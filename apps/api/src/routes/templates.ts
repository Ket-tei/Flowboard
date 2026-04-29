import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { FastifyInstance } from "fastify";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { and, desc, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, pool } from "../db/index.js";
import {
  templateFolders,
  templates,
  templateItems,
  templateWidgets,
  userTemplateFolderAccess,
  userTemplateAccess,
} from "../db/schema.js";
import { authPreHandler, adminPreHandler } from "../plugins/require-auth.js";
import { deleteFile, ensureUploadDir, uploadDir, resolveFilePath } from "../services/upload.service.js";
import { mimeToMediaType } from "../lib/media-type.js";
import { z } from "zod";
import { validate } from "../schemas/validate.js";

const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(255),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

const updateFolderSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "at least one field required",
});

const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  sortOrder: z.number().int().default(0),
});

const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  sortOrder: z.number().int().optional(),
  folderId: z.number().int().positive().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "at least one field required",
});

const reorderItemsSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1),
});

const TRANSITION_VALUES = ["NONE", "FADE", "SLIDE_LEFT", "SLIDE_UP"] as const;
const WIDGET_POSITIONS = ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"] as const;
const WIDGET_TYPES = ["WEATHER_CURRENT"] as const;

const updateItemSchema = z.object({
  durationMs: z.number().int().min(0).optional(),
  transitionType: z.enum(TRANSITION_VALUES).optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "at least one field required",
});

const createWidgetSchema = z.object({
  type: z.enum(WIDGET_TYPES),
  position: z.enum(WIDGET_POSITIONS).default("TOP_RIGHT"),
  config: z.record(z.string(), z.unknown()).default({}),
});

const updateWidgetSchema = z.object({
  position: z.enum(WIDGET_POSITIONS).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "at least one field required",
});

type FolderRow = typeof templateFolders.$inferSelect;
type TemplateRow = typeof templates.$inferSelect;

function buildTree(
  folderRows: FolderRow[],
  templatesByFolder: Map<number, TemplateRow[]>,
  parentId: number | null
): unknown[] {
  return folderRows
    .filter((r) => (r.parentId ?? null) === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .map((r) => ({
      id: r.id,
      parentId: r.parentId,
      name: r.name,
      sortOrder: r.sortOrder,
      screens: (templatesByFolder.get(r.id) ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        publicToken: `tpl-${t.id}`,
        displayMode: "QUICK" as const,
      })),
      children: buildTree(folderRows, templatesByFolder, r.id),
    }));
}

async function canAccessTemplate(userId: number, role: string, templateId: number): Promise<boolean> {
  if (role === "ADMIN") return true;
  const tpl = await db.select({ folderId: templates.folderId }).from(templates).where(eq(templates.id, templateId)).limit(1);
  if (!tpl[0]) return false;
  const folderAccess = await db.select().from(userTemplateFolderAccess)
    .where(and(eq(userTemplateFolderAccess.userId, userId), eq(userTemplateFolderAccess.templateFolderId, tpl[0].folderId)))
    .limit(1);
  if (folderAccess.length > 0) return true;
  const direct = await db.select().from(userTemplateAccess)
    .where(and(eq(userTemplateAccess.userId, userId), eq(userTemplateAccess.templateId, templateId)))
    .limit(1);
  return direct.length > 0;
}

async function bumpTemplateRevision(templateId: number): Promise<void> {
  await db.update(templates).set({ revision: sql`${templates.revision} + 1` }).where(eq(templates.id, templateId));
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function registerTemplateRoutes(app: FastifyInstance) {
  // --- Template folders tree ---
  app.get("/template-folders/tree", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const allFolders = await db.select().from(templateFolders);
    const allTemplates = await db.select().from(templates);
    const map = new Map<number, TemplateRow[]>();
    for (const t of allTemplates) {
      const list = map.get(t.folderId) ?? [];
      list.push(t);
      map.set(t.folderId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }
    if (u.role !== "ADMIN") {
      // Filter to only accessible folders/templates
      const [folderRows, templateRows] = await Promise.all([
        db.select({ templateFolderId: userTemplateFolderAccess.templateFolderId }).from(userTemplateFolderAccess).where(eq(userTemplateFolderAccess.userId, u.sub)),
        db.select({ templateId: userTemplateAccess.templateId }).from(userTemplateAccess).where(eq(userTemplateAccess.userId, u.sub)),
      ]);
      const accessFolderIds = new Set(folderRows.map((r) => r.templateFolderId));
      const accessTemplateIds = new Set(templateRows.map((r) => r.templateId));
      const visibleFolderIds = new Set<number>();
      const addWithParents = (id: number) => {
        if (visibleFolderIds.has(id)) return;
        visibleFolderIds.add(id);
        const f = allFolders.find((f) => f.id === id);
        if (f?.parentId) addWithParents(f.parentId);
      };
      for (const fid of accessFolderIds) addWithParents(fid);
      for (const tid of accessTemplateIds) {
        const tpl = allTemplates.find((t) => t.id === tid);
        if (tpl) addWithParents(tpl.folderId);
      }
      const filteredFolders = allFolders.filter((f) => visibleFolderIds.has(f.id));
      const filteredMap = new Map<number, TemplateRow[]>();
      for (const t of allTemplates) {
        if (!accessFolderIds.has(t.folderId) && !accessTemplateIds.has(t.id)) continue;
        const list = filteredMap.get(t.folderId) ?? [];
        list.push(t);
        filteredMap.set(t.folderId, list);
      }
      return { tree: buildTree(filteredFolders, filteredMap, null) };
    }
    return { tree: buildTree(allFolders, map, null) };
  });

  // --- Admin tree for access management ---
  app.get("/admin/template-folder-tree", { preHandler: adminPreHandler }, async () => {
    const allFolders = await db.select().from(templateFolders);
    const allTemplates = await db.select().from(templates);
    const map = new Map<number, TemplateRow[]>();
    for (const t of allTemplates) {
      const list = map.get(t.folderId) ?? [];
      list.push(t);
      map.set(t.folderId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }
    return { tree: buildTree(allFolders, map, null) };
  });

  // --- Template folder CRUD ---
  app.post("/template-folders", { preHandler: adminPreHandler }, async (request) => {
    const input = validate(createFolderSchema, request.body);
    await db.insert(templateFolders).values({
      name: input.name,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder,
    });
    const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
    const id = Number((lid as { id: number }[])[0]?.id);
    return { id };
  });

  app.patch("/template-folders/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    const input = validate(updateFolderSchema, request.body);
    const updates: Partial<{ name: string; parentId: number | null; sortOrder: number }> = {};
    if (input.name != null) updates.name = input.name;
    if ("parentId" in input) updates.parentId = input.parentId ?? null;
    if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
    await db.update(templateFolders).set(updates).where(eq(templateFolders.id, id));
    return { ok: true };
  });

  app.delete("/template-folders/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    // Delete all templates + their items in this folder
    const tpls = await db.select({ id: templates.id }).from(templates).where(eq(templates.folderId, id));
    for (const tpl of tpls) {
      const items = await db.select().from(templateItems).where(eq(templateItems.templateId, tpl.id));
      for (const it of items) await deleteFile(it.storageKey);
      await db.delete(templateItems).where(eq(templateItems.templateId, tpl.id));
    }
    await db.delete(templates).where(eq(templates.folderId, id));
    await db.delete(templateFolders).where(eq(templateFolders.id, id));
    return { ok: true };
  });

  // --- Template CRUD ---
  app.post("/template-folders/:folderId/templates", { preHandler: adminPreHandler }, async (request, reply) => {
    const folderId = Number((request.params as { folderId: string }).folderId);
    if (!Number.isFinite(folderId)) return reply.status(400).send({ error: "invalid folder" });
    const f = await db.select().from(templateFolders).where(eq(templateFolders.id, folderId)).limit(1);
    if (!f[0]) return reply.status(404).send({ error: "folder not found" });
    const input = validate(createTemplateSchema, request.body);
    await db.insert(templates).values({ folderId, name: input.name, sortOrder: input.sortOrder, revision: 0 });
    const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
    const id = Number((lid as { id: number }[])[0]?.id);
    return { id };
  });

  app.get("/templates/:id", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    if (!(await canAccessTemplate(u.sub, u.role, id))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const tpl = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
    if (!tpl[0]) return reply.status(404).send({ error: "not found" });
    const items = await db.select().from(templateItems)
      .where(eq(templateItems.templateId, id))
      .orderBy(templateItems.sortOrder, templateItems.id);
    const widgets = await db.select().from(templateWidgets).where(eq(templateWidgets.templateId, id));
    return {
      screen: {
        id: tpl[0].id,
        folderId: tpl[0].folderId,
        name: tpl[0].name,
        publicToken: `tpl-${tpl[0].id}`,
        revision: tpl[0].revision,
        sortOrder: tpl[0].sortOrder,
        displayMode: "QUICK" as const,
        slideshowPath: "",
      },
      items: items.map((it) => ({
        id: it.id,
        type: it.type,
        durationMs: it.durationMs,
        sortOrder: it.sortOrder,
        mimeType: it.mimeType,
        transitionType: it.transitionType,
      })),
      widgets: widgets.map((w) => ({
        id: w.id,
        type: w.type,
        position: w.position,
        config: safeParseJson(w.config),
      })),
    };
  });

  app.patch("/templates/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    const input = validate(updateTemplateSchema, request.body);
    const updates: Partial<{ name: string; sortOrder: number; folderId: number }> = {};
    if (input.name != null) updates.name = input.name;
    if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
    if (input.folderId !== undefined) updates.folderId = input.folderId;
    await db.update(templates).set(updates).where(eq(templates.id, id));
    return { ok: true };
  });

  app.delete("/templates/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    const items = await db.select().from(templateItems).where(eq(templateItems.templateId, id));
    for (const it of items) await deleteFile(it.storageKey);
    await db.delete(templateItems).where(eq(templateItems.templateId, id));
    await db.delete(templates).where(eq(templates.id, id));
    return { ok: true };
  });

  // --- Template items ---
  app.post("/templates/:id/items", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const templateId = Number((request.params as { id: string }).id);
    if (!Number.isFinite(templateId)) return reply.status(400).send({ error: "invalid id" });
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const mp = await request.file();
    if (!mp) return reply.status(400).send({ error: "file required" });
    const q = request.query as { durationMs?: string; transitionType?: string };
    const durationMs = Number(q.durationMs ?? 5000) || 5000;
    const transitionType = (TRANSITION_VALUES as readonly string[]).includes(q.transitionType ?? "")
      ? (q.transitionType as typeof TRANSITION_VALUES[number])
      : "NONE";

    const mime = mp.mimetype ?? "application/octet-stream";
    const kind = mimeToMediaType(mime);
    if (!kind) return reply.status(400).send({ error: "unsupported media type" });

    await ensureUploadDir();
    const ext = path.extname(mp.filename || "") || (kind === "VIDEO" ? ".mp4" : ".bin");
    const storageKey = `tpl_${templateId}/${uuidv4()}${ext}`;
    const full = path.join(uploadDir(), storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await pipeline(mp.file, createWriteStream(full));

    const maxOrder = await db
      .select({ sortOrder: templateItems.sortOrder })
      .from(templateItems)
      .where(eq(templateItems.templateId, templateId))
      .orderBy(desc(templateItems.sortOrder))
      .limit(1);
    const nextOrder = (maxOrder[0]?.sortOrder ?? -1) + 1;

    await db.insert(templateItems).values({ templateId, type: kind, storageKey, mimeType: mime, durationMs, sortOrder: nextOrder, transitionType });
    const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
    const itemId = Number((lid as { id: number }[])[0]?.id);
    await bumpTemplateRevision(templateId);
    return { id: itemId, type: kind, durationMs, sortOrder: nextOrder, mimeType: mime, transitionType };
  });

  app.patch("/templates/:id/items/order", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const templateId = Number((request.params as { id: string }).id);
    if (!Number.isFinite(templateId)) return reply.status(400).send({ error: "invalid id" });
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const input = validate(reorderItemsSchema, request.body);
    const existing = await db.select({ id: templateItems.id }).from(templateItems).where(eq(templateItems.templateId, templateId));
    const setIds = new Set(existing.map((e) => e.id));
    for (let i = 0; i < input.orderedIds.length; i++) {
      if (!setIds.has(input.orderedIds[i])) return reply.status(400).send({ error: "invalid item id" });
      await db.update(templateItems).set({ sortOrder: i }).where(eq(templateItems.id, input.orderedIds[i]));
    }
    await bumpTemplateRevision(templateId);
    return { ok: true };
  });

  app.patch("/templates/:id/items/:itemId", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const templateId = Number((request.params as { id: string }).id);
    const itemId = Number((request.params as { itemId: string }).itemId);
    if (!Number.isFinite(templateId) || !Number.isFinite(itemId)) {
      return reply.status(400).send({ error: "invalid id" });
    }
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const input = validate(updateItemSchema, request.body);
    const row = await db.select().from(templateItems).where(eq(templateItems.id, itemId)).limit(1);
    if (!row[0] || row[0].templateId !== templateId) return reply.status(404).send({ error: "item not found" });
    const updates: Partial<{ durationMs: number; transitionType: typeof TRANSITION_VALUES[number] }> = {};
    if (input.durationMs !== undefined) updates.durationMs = input.durationMs;
    if (input.transitionType !== undefined) updates.transitionType = input.transitionType;
    await db.update(templateItems).set(updates).where(eq(templateItems.id, itemId));
    await bumpTemplateRevision(templateId);
    return { ok: true };
  });

  app.delete("/templates/:id/items/:itemId", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const templateId = Number((request.params as { id: string }).id);
    const itemId = Number((request.params as { itemId: string }).itemId);
    if (!Number.isFinite(templateId) || !Number.isFinite(itemId)) {
      return reply.status(400).send({ error: "invalid id" });
    }
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const row = await db.select().from(templateItems).where(eq(templateItems.id, itemId)).limit(1);
    if (!row[0] || row[0].templateId !== templateId) return reply.status(404).send({ error: "item not found" });
    await deleteFile(row[0].storageKey);
    await db.delete(templateItems).where(eq(templateItems.id, itemId));
    await bumpTemplateRevision(templateId);
    return { ok: true };
  });

  // --- Template widgets ---
  app.post("/templates/:id/widgets", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const templateId = Number((request.params as { id: string }).id);
    if (!Number.isFinite(templateId)) return reply.status(400).send({ error: "invalid id" });
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const input = validate(createWidgetSchema, request.body);
    await db.insert(templateWidgets).values({
      templateId,
      type: input.type,
      position: input.position,
      config: JSON.stringify(input.config),
    });
    const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
    const id = Number((lid as { id: number }[])[0]?.id);
    await bumpTemplateRevision(templateId);
    return { id, type: input.type, position: input.position, config: input.config };
  });

  app.patch("/templates/:id/widgets/:widgetId", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const templateId = Number((request.params as { id: string }).id);
    const widgetId = Number((request.params as { widgetId: string }).widgetId);
    if (!Number.isFinite(templateId) || !Number.isFinite(widgetId)) {
      return reply.status(400).send({ error: "invalid id" });
    }
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const input = validate(updateWidgetSchema, request.body);
    const row = await db.select().from(templateWidgets).where(eq(templateWidgets.id, widgetId)).limit(1);
    if (!row[0] || row[0].templateId !== templateId) return reply.status(404).send({ error: "widget not found" });
    const updates: Partial<{ position: typeof WIDGET_POSITIONS[number]; config: string }> = {};
    if (input.position !== undefined) updates.position = input.position;
    if (input.config !== undefined) updates.config = JSON.stringify(input.config);
    await db.update(templateWidgets).set(updates).where(eq(templateWidgets.id, widgetId));
    await bumpTemplateRevision(templateId);
    return { ok: true };
  });

  app.delete("/templates/:id/widgets/:widgetId", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const templateId = Number((request.params as { id: string }).id);
    const widgetId = Number((request.params as { widgetId: string }).widgetId);
    if (!Number.isFinite(templateId) || !Number.isFinite(widgetId)) {
      return reply.status(400).send({ error: "invalid id" });
    }
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const row = await db.select().from(templateWidgets).where(eq(templateWidgets.id, widgetId)).limit(1);
    if (!row[0] || row[0].templateId !== templateId) return reply.status(404).send({ error: "widget not found" });
    await db.delete(templateWidgets).where(eq(templateWidgets.id, widgetId));
    await bumpTemplateRevision(templateId);
    return { ok: true };
  });

  // --- Public template media endpoint ---
  app.get("/public/templates/:templateId/media/:itemId", async (request, reply) => {
    const templateId = Number((request.params as { templateId: string }).templateId);
    const itemId = Number((request.params as { itemId: string }).itemId);
    if (!Number.isFinite(templateId) || !Number.isFinite(itemId)) {
      return reply.status(400).send({ error: "invalid" });
    }
    const item = await db.select().from(templateItems)
      .where(and(eq(templateItems.id, itemId), eq(templateItems.templateId, templateId)))
      .limit(1);
    if (!item[0]) return reply.status(404).send({ error: "not found" });
    const full = resolveFilePath(item[0].storageKey);
    let fileStat;
    try {
      fileStat = await stat(full);
      if (!fileStat.isFile()) return reply.status(404).send({ error: "not found" });
    } catch {
      return reply.status(404).send({ error: "not found" });
    }
    const totalSize = fileStat.size;
    const mime = item[0].mimeType;
    const rangeHeader = request.headers.range;
    reply.header("Accept-Ranges", "bytes");
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    if (rangeHeader) {
      const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
        const chunkSize = end - start + 1;
        reply.status(206);
        reply.header("Content-Type", mime);
        reply.header("Content-Range", `bytes ${start}-${end}/${totalSize}`);
        reply.header("Content-Length", chunkSize);
        return reply.send(createReadStream(full, { start, end }));
      }
    }
    reply.header("Content-Type", mime);
    reply.header("Content-Length", totalSize);
    return reply.send(createReadStream(full));
  });
}

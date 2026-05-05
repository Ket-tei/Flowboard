import { and, eq, sql } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import {
  templateFolders,
  templates,
  templateItems,
  templateWidgets,
  userTemplateFolderAccess,
  userTemplateAccess,
} from "../db/schema.js";
import { deleteFile } from "./upload.service.js";
import { NotFoundError } from "../lib/errors.js";
import type {
  CreateTemplateFolderInput,
  UpdateTemplateFolderInput,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "../schemas/template.schema.js";

type FolderRow = typeof templateFolders.$inferSelect;
type TemplateRow = typeof templates.$inferSelect;

export function safeParseJson(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function buildTemplateTree(
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
      children: buildTemplateTree(folderRows, templatesByFolder, r.id),
    }));
}

export async function bumpTemplateRevision(templateId: number): Promise<void> {
  await db.update(templates).set({ revision: sql`${templates.revision} + 1` }).where(eq(templates.id, templateId));
}

export async function getTemplateTree(userId: number, role: string) {
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

  if (role === "ADMIN") {
    return { tree: buildTemplateTree(allFolders, map, null) };
  }

  const [folderRows, templateRows] = await Promise.all([
    db.select({ templateFolderId: userTemplateFolderAccess.templateFolderId }).from(userTemplateFolderAccess).where(eq(userTemplateFolderAccess.userId, userId)),
    db.select({ templateId: userTemplateAccess.templateId }).from(userTemplateAccess).where(eq(userTemplateAccess.userId, userId)),
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

  return { tree: buildTemplateTree(filteredFolders, filteredMap, null) };
}

export async function getAdminTemplateTree() {
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
  return { tree: buildTemplateTree(allFolders, map, null) };
}

export async function createTemplateFolder(input: CreateTemplateFolderInput): Promise<{ id: number }> {
  await db.insert(templateFolders).values({
    name: input.name,
    parentId: input.parentId ?? null,
    sortOrder: input.sortOrder,
  });
  const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
  const id = Number((lid as { id: number }[])[0]?.id);
  return { id };
}

export async function updateTemplateFolder(
  folderId: number,
  input: UpdateTemplateFolderInput
): Promise<void> {
  const updates: Partial<{ name: string; parentId: number | null; sortOrder: number }> = {};
  if (input.name != null) updates.name = input.name;
  if ("parentId" in input) updates.parentId = input.parentId ?? null;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
  await db.update(templateFolders).set(updates).where(eq(templateFolders.id, folderId));
}

export async function deleteTemplateFolder(folderId: number): Promise<void> {
  const tpls = await db.select({ id: templates.id }).from(templates).where(eq(templates.folderId, folderId));
  for (const tpl of tpls) {
    const items = await db.select().from(templateItems).where(eq(templateItems.templateId, tpl.id));
    for (const it of items) await deleteFile(it.storageKey);
    await db.delete(templateItems).where(eq(templateItems.templateId, tpl.id));
  }
  await db.delete(templates).where(eq(templates.folderId, folderId));
  await db.delete(templateFolders).where(eq(templateFolders.id, folderId));
}

export async function createTemplate(
  folderId: number,
  input: CreateTemplateInput
): Promise<{ id: number }> {
  const f = await db.select().from(templateFolders).where(eq(templateFolders.id, folderId)).limit(1);
  if (!f[0]) throw new NotFoundError("folder not found");
  await db.insert(templates).values({ folderId, name: input.name, sortOrder: input.sortOrder, revision: 0 });
  const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
  const id = Number((lid as { id: number }[])[0]?.id);
  return { id };
}

export async function getTemplateDetail(templateId: number) {
  const tpl = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
  if (!tpl[0]) throw new NotFoundError("template not found");

  const items = await db
    .select()
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(templateItems.sortOrder, templateItems.id);

  const widgets = await db.select().from(templateWidgets).where(eq(templateWidgets.templateId, templateId));

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
      transitionDurationMs: it.transitionDurationMs,
    })),
    widgets: widgets.map((widget) => ({
      id: widget.id,
      type: widget.type,
      config: safeParseJson(widget.config),
      x: Number(widget.x),
      y: Number(widget.y),
      w: Number(widget.w),
      h: Number(widget.h),
      startMs: widget.startMs,
      endMs: widget.endMs,
    })),
  };
}

export async function updateTemplate(
  templateId: number,
  input: UpdateTemplateInput
): Promise<void> {
  const updates: Partial<{ name: string; sortOrder: number; folderId: number }> = {};
  if (input.name != null) updates.name = input.name;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
  if (input.folderId !== undefined) updates.folderId = input.folderId;
  await db.update(templates).set(updates).where(eq(templates.id, templateId));
}

export async function deleteTemplate(templateId: number): Promise<void> {
  const items = await db.select().from(templateItems).where(eq(templateItems.templateId, templateId));
  for (const it of items) await deleteFile(it.storageKey);
  await db.delete(templateItems).where(eq(templateItems.templateId, templateId));
  await db.delete(templates).where(eq(templates.id, templateId));
}

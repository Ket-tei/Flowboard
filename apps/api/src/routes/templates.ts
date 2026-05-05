import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { templateItems } from "../db/schema.js";
import { authPreHandler, adminPreHandler } from "../plugins/require-auth.js";
import { validate } from "../schemas/validate.js";
import { resolveFilePath } from "../services/upload.service.js";
import { canAccessTemplate } from "../services/access.service.js";
import {
  getTemplateTree,
  getAdminTemplateTree,
  createTemplateFolder,
  updateTemplateFolder,
  deleteTemplateFolder,
  createTemplate,
  getTemplateDetail,
  updateTemplate,
  deleteTemplate,
} from "../services/template.service.js";
import {
  uploadTemplateItem,
  reorderTemplateItems,
  updateTemplateItem,
  deleteTemplateItem,
} from "../services/template-item.service.js";
import {
  createTemplateWidget,
  updateTemplateWidget,
  deleteTemplateWidget,
} from "../services/template-widget.service.js";
import {
  createTemplateFolderSchema,
  updateTemplateFolderSchema,
  createTemplateSchema,
  updateTemplateSchema,
  reorderTemplateItemsSchema,
  updateTemplateItemSchema,
  createWidgetSchema,
  updateWidgetSchema,
  TRANSITION_VALUES,
} from "../schemas/template.schema.js";
import { parseIdParam } from "../lib/params.js";
import { AccessError, BadRequestError } from "../lib/errors.js";
import type { TransitionValue } from "../schemas/template.schema.js";

export async function registerTemplateRoutes(app: FastifyInstance) {
  // --- Template folder tree ---
  app.get("/template-folders/tree", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    return getTemplateTree(u.sub, u.role);
  });

  app.get("/admin/template-folder-tree", { preHandler: adminPreHandler }, async () => {
    return getAdminTemplateTree();
  });

  // --- Template folder CRUD ---
  app.post("/template-folders", { preHandler: adminPreHandler }, async (request) => {
    const input = validate(createTemplateFolderSchema, request.body);
    return createTemplateFolder(input);
  });

  app.patch("/template-folders/:id", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    const input = validate(updateTemplateFolderSchema, request.body);
    await updateTemplateFolder(id, input);
    return { ok: true };
  });

  app.delete("/template-folders/:id", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    await deleteTemplateFolder(id);
    return { ok: true };
  });

  // --- Template CRUD ---
  app.post("/template-folders/:folderId/templates", { preHandler: adminPreHandler }, async (request) => {
    const folderId = parseIdParam(request, "folderId");
    const input = validate(createTemplateSchema, request.body);
    return createTemplate(folderId, input);
  });

  app.get("/templates/:id", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const id = parseIdParam(request);
    if (!(await canAccessTemplate(u.sub, u.role, id))) throw new AccessError();
    return getTemplateDetail(id);
  });

  app.patch("/templates/:id", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    const input = validate(updateTemplateSchema, request.body);
    await updateTemplate(id, input);
    return { ok: true };
  });

  app.delete("/templates/:id", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    await deleteTemplate(id);
    return { ok: true };
  });

  // --- Template items ---
  app.post("/templates/:id/items", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const templateId = parseIdParam(request);
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) throw new AccessError();

    const mp = await request.file();
    if (!mp) throw new BadRequestError("file required");

    const q = request.query as { durationMs?: string; transitionType?: string; transitionDurationMs?: string };
    const durationMs = Number(q.durationMs ?? 5000) || 5000;
    const transitionType = (TRANSITION_VALUES as readonly string[]).includes(q.transitionType ?? "")
      ? (q.transitionType as TransitionValue)
      : "NONE";
    const transitionDurationMs = Math.min(5000, Math.max(50, Number(q.transitionDurationMs ?? 350) || 350));

    return uploadTemplateItem(templateId, { stream: mp.file, mimetype: mp.mimetype, filename: mp.filename }, { durationMs, transitionType, transitionDurationMs });
  });

  app.patch("/templates/:id/items/order", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const templateId = parseIdParam(request);
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) throw new AccessError();
    const input = validate(reorderTemplateItemsSchema, request.body);
    await reorderTemplateItems(templateId, input);
    return { ok: true };
  });

  app.patch("/templates/:id/items/:itemId", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const templateId = parseIdParam(request);
    const itemId = parseIdParam(request, "itemId");
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) throw new AccessError();
    const input = validate(updateTemplateItemSchema, request.body);
    await updateTemplateItem(templateId, itemId, input);
    return { ok: true };
  });

  app.delete("/templates/:id/items/:itemId", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const templateId = parseIdParam(request);
    const itemId = parseIdParam(request, "itemId");
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) throw new AccessError();
    await deleteTemplateItem(templateId, itemId);
    return { ok: true };
  });

  // --- Template widgets ---
  app.post("/templates/:id/widgets", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const templateId = parseIdParam(request);
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) throw new AccessError();
    const input = validate(createWidgetSchema, request.body);
    return createTemplateWidget(templateId, input);
  });

  app.patch("/templates/:id/widgets/:widgetId", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const templateId = parseIdParam(request);
    const widgetId = parseIdParam(request, "widgetId");
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) throw new AccessError();
    const input = validate(updateWidgetSchema, request.body);
    await updateTemplateWidget(templateId, widgetId, input);
    return { ok: true };
  });

  app.delete("/templates/:id/widgets/:widgetId", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const templateId = parseIdParam(request);
    const widgetId = parseIdParam(request, "widgetId");
    if (!(await canAccessTemplate(u.sub, u.role, templateId))) throw new AccessError();
    await deleteTemplateWidget(templateId, widgetId);
    return { ok: true };
  });

  // --- Public template media endpoint ---
  app.get("/public/templates/:templateId/media/:itemId", async (request, reply) => {
    const templateId = parseIdParam(request, "templateId");
    const itemId = parseIdParam(request, "itemId");

    const item = await db
      .select()
      .from(templateItems)
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

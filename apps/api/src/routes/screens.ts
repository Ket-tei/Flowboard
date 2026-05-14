import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { canAccessScreen } from "../services/access.service.js";
import {
  createScreen,
  getScreenDetail,
  updateScreen,
  deleteScreen,
  uploadItem,
  reorderItems,
  updateItem,
  deleteItem,
} from "../services/screen.service.js";
import { checkScreenLimit } from "../services/quota.service.js";
import { authPreHandler, adminPreHandler } from "../plugins/require-auth.js";
import { validate } from "../schemas/validate.js";
import {
  createScreenSchema,
  updateScreenSchema,
  reorderItemsSchema,
  updateItemSchema,
} from "../schemas/screen.schema.js";
import { db } from "../db/index.js";
import { screenSchedules, screens } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { parseIdParam } from "../lib/params.js";
import { AccessError, BadRequestError } from "../lib/errors.js";

export async function registerScreenRoutes(app: FastifyInstance) {
  app.post("/folders/:folderId/screens", { preHandler: adminPreHandler }, async (request) => {
    const folderId = parseIdParam(request, "folderId");
    await checkScreenLimit();
    const input = validate(createScreenSchema, request.body);
    const body = request.body as { displayMode?: string };
    const displayMode = body.displayMode === "TEMPLATE" ? "TEMPLATE" : "QUICK";
    return createScreen(folderId, input, displayMode);
  });

  app.get("/screens/:id", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const id = parseIdParam(request);
    if (!(await canAccessScreen(u.sub, u.role, id))) throw new AccessError();
    return getScreenDetail(id);
  });

  app.patch("/screens/:id", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    const input = validate(updateScreenSchema, request.body);
    await updateScreen(id, input);
    return { ok: true };
  });

  app.delete("/screens/:id", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    await deleteScreen(id);
    return { ok: true };
  });

  app.post("/screens/:id/items", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const screenId = parseIdParam(request);
    if (!(await canAccessScreen(u.sub, u.role, screenId))) throw new AccessError();
    const mp = await request.file();
    if (!mp) throw new BadRequestError("file required");
    const q = request.query as { durationMs?: string };
    const durationMs = Number(q.durationMs ?? 5000) || 5000;
    return uploadItem(
      screenId,
      { file: mp.file, mimetype: mp.mimetype, filename: mp.filename },
      durationMs
    );
  });

  app.patch("/screens/:id/items/order", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const screenId = parseIdParam(request);
    if (!(await canAccessScreen(u.sub, u.role, screenId))) throw new AccessError();
    const input = validate(reorderItemsSchema, request.body);
    await reorderItems(screenId, input);
    return { ok: true };
  });

  app.patch("/screens/:id/items/:itemId", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const screenId = parseIdParam(request);
    const itemId = parseIdParam(request, "itemId");
    if (!(await canAccessScreen(u.sub, u.role, screenId))) throw new AccessError();
    const input = validate(updateItemSchema, request.body);
    await updateItem(screenId, itemId, input);
    return { ok: true };
  });

  app.delete("/screens/:id/items/:itemId", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const screenId = parseIdParam(request);
    const itemId = parseIdParam(request, "itemId");
    if (!(await canAccessScreen(u.sub, u.role, screenId))) throw new AccessError();
    await deleteItem(screenId, itemId);
    return { ok: true };
  });

  app.get("/screens/:id/schedule", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    const screenId = parseIdParam(request);
    if (!(await canAccessScreen(u.sub, u.role, screenId))) throw new AccessError();
    const slots = await db.select().from(screenSchedules).where(eq(screenSchedules.screenId, screenId));
    return { slots };
  });

  app.put("/screens/:id/schedule", { preHandler: adminPreHandler }, async (request) => {
    const screenId = parseIdParam(request);
    const body = request.body as { slots?: unknown };
    if (!Array.isArray(body?.slots)) throw new BadRequestError("slots array required");
    const slots = body.slots as Array<{ dayOfWeek: number; startTime: string; endTime: string; templateId: number }>;
    await db.delete(screenSchedules).where(eq(screenSchedules.screenId, screenId));
    if (slots.length > 0) {
      await db.insert(screenSchedules).values(
        slots.map((s) => ({
          screenId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          templateId: s.templateId,
        }))
      );
    }
    await db.update(screens).set({ revision: sql`${screens.revision} + 1` }).where(eq(screens.id, screenId));
    return { ok: true };
  });
}

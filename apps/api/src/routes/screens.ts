import type { FastifyInstance } from "fastify";
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
import { authPreHandler, adminPreHandler } from "../plugins/require-auth.js";
import { validate } from "../schemas/validate.js";
import {
  createScreenSchema,
  updateScreenSchema,
  reorderItemsSchema,
  updateItemSchema,
} from "../schemas/screen.schema.js";

export async function registerScreenRoutes(app: FastifyInstance) {
  app.post("/folders/:folderId/screens", { preHandler: adminPreHandler }, async (request, reply) => {
    const folderId = Number((request.params as { folderId: string }).folderId);
    if (!Number.isFinite(folderId)) return reply.status(400).send({ error: "invalid folder" });
    const input = validate(createScreenSchema, request.body);
    return createScreen(folderId, input);
  });

  app.get("/screens/:id", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    if (!(await canAccessScreen(u.sub, u.role, id))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    return getScreenDetail(id);
  });

  app.patch("/screens/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    const input = validate(updateScreenSchema, request.body);
    await updateScreen(id, input);
    return { ok: true };
  });

  app.delete("/screens/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    await deleteScreen(id);
    return { ok: true };
  });

  app.post("/screens/:id/items", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const screenId = Number((request.params as { id: string }).id);
    if (!Number.isFinite(screenId)) return reply.status(400).send({ error: "invalid id" });
    if (!(await canAccessScreen(u.sub, u.role, screenId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const mp = await request.file();
    if (!mp) return reply.status(400).send({ error: "file required" });
    const q = request.query as { durationMs?: string };
    const durationMs = Number(q.durationMs ?? 5000) || 5000;
    return uploadItem(
      screenId,
      { file: mp.file, mimetype: mp.mimetype, filename: mp.filename },
      durationMs
    );
  });

  app.patch("/screens/:id/items/order", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const screenId = Number((request.params as { id: string }).id);
    if (!Number.isFinite(screenId)) return reply.status(400).send({ error: "invalid id" });
    if (!(await canAccessScreen(u.sub, u.role, screenId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const input = validate(reorderItemsSchema, request.body);
    await reorderItems(screenId, input);
    return { ok: true };
  });

  app.patch("/screens/:id/items/:itemId", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const screenId = Number((request.params as { id: string }).id);
    const itemId = Number((request.params as { itemId: string }).itemId);
    if (!Number.isFinite(screenId) || !Number.isFinite(itemId)) {
      return reply.status(400).send({ error: "invalid id" });
    }
    if (!(await canAccessScreen(u.sub, u.role, screenId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const input = validate(updateItemSchema, request.body);
    await updateItem(screenId, itemId, input);
    return { ok: true };
  });

  app.delete("/screens/:id/items/:itemId", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const screenId = Number((request.params as { id: string }).id);
    const itemId = Number((request.params as { itemId: string }).itemId);
    if (!Number.isFinite(screenId) || !Number.isFinite(itemId)) {
      return reply.status(400).send({ error: "invalid id" });
    }
    if (!(await canAccessScreen(u.sub, u.role, screenId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    await deleteItem(screenId, itemId);
    return { ok: true };
  });
}

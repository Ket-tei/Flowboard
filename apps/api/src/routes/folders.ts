import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { screens } from "../db/schema.js";
import { canAccessFolder } from "../services/access.service.js";
import {
  getFolderTree,
  createFolder,
  deleteFolder,
  updateFolder,
} from "../services/folder.service.js";
import { authPreHandler, adminPreHandler } from "../plugins/require-auth.js";
import { validate } from "../schemas/validate.js";
import { createFolderSchema, updateFolderSchema } from "../schemas/folder.schema.js";

export async function registerFolderRoutes(app: FastifyInstance) {
  app.get("/folders", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    return getFolderTree(u.sub, u.role);
  });

  app.post("/folders", { preHandler: adminPreHandler }, async (request) => {
    const input = validate(createFolderSchema, request.body);
    return createFolder(input);
  });

  app.delete("/folders/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    await deleteFolder(id);
    return { ok: true };
  });

  app.patch("/folders/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    const input = validate(updateFolderSchema, request.body);
    await updateFolder(id, input);
    return { ok: true };
  });

  app.get("/folders/:folderId/screens", { preHandler: authPreHandler }, async (request, reply) => {
    const u = request.authUser!;
    const folderId = Number((request.params as { folderId: string }).folderId);
    if (!Number.isFinite(folderId)) return reply.status(400).send({ error: "invalid id" });
    if (!(await canAccessFolder(u.sub, u.role, folderId))) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const list = await db
      .select()
      .from(screens)
      .where(eq(screens.folderId, folderId))
      .orderBy(screens.sortOrder, screens.id);
    return {
      screens: list.map((s) => ({
        id: s.id,
        folderId: s.folderId,
        name: s.name,
        publicToken: s.publicToken,
        revision: s.revision,
        sortOrder: s.sortOrder,
        slideshowPath: `/show/${s.publicToken}`,
      })),
    };
  });
}

import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  userFolderAccess,
  userScreenAccess,
  users,
} from "../db/schema.js";
import { authPreHandler, requireAdmin } from "../plugins/require-auth.js";

export async function registerUserRoutes(app: FastifyInstance) {
  app.get(
    "/users",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const err = requireAdmin(request, reply);
      if (err) return err;
      const list = await db
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users);
      return { users: list };
    }
  );

  app.get(
    "/users/:id/access",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const err = requireAdmin(request, reply);
      if (err) return err;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
      const folders = await db
        .select({ folderId: userFolderAccess.folderId })
        .from(userFolderAccess)
        .where(eq(userFolderAccess.userId, id));
      const scr = await db
        .select({ screenId: userScreenAccess.screenId })
        .from(userScreenAccess)
        .where(eq(userScreenAccess.userId, id));
      return {
        folderIds: folders.map((f) => f.folderId),
        screenIds: scr.map((s) => s.screenId),
      };
    }
  );

  app.post(
    "/users",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const err = requireAdmin(request, reply);
      if (err) return err;
      const body = request.body as {
        username?: string;
        password?: string;
        role?: "ADMIN" | "USER";
        folderIds?: number[];
        screenIds?: number[];
      };
      const username = body.username?.trim();
      const password = body.password ?? "";
      if (!username || !password) {
        return reply.status(400).send({ error: "username and password required" });
      }
      const role = body.role === "ADMIN" ? "ADMIN" : "USER";
      const passwordHash = await bcrypt.hash(password, 12);
      try {
        await db.insert(users).values({ username, passwordHash, role });
      } catch {
        return reply.status(400).send({ error: "username taken" });
      }
      const [row] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
      const userId = row?.id;
      if (!userId) return reply.status(500).send({ error: "create failed" });
      if (role === "USER") {
        const folderIds = body.folderIds ?? [];
        const screenIds = body.screenIds ?? [];
        if (folderIds.length) {
          await db.insert(userFolderAccess).values(
            folderIds.map((folderId) => ({ userId, folderId }))
          );
        }
        if (screenIds.length) {
          await db.insert(userScreenAccess).values(
            screenIds.map((screenId) => ({ userId, screenId }))
          );
        }
      }
      return { id: userId };
    }
  );

  app.patch(
    "/users/:id",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const err = requireAdmin(request, reply);
      if (err) return err;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
      const body = request.body as {
        password?: string;
        role?: "ADMIN" | "USER";
        folderIds?: number[];
        screenIds?: number[];
      };
      const updates: Partial<{ passwordHash: string; role: "ADMIN" | "USER" }> = {};
      if (body.password) {
        updates.passwordHash = await bcrypt.hash(body.password, 12);
      }
      if (body.role !== undefined) {
        updates.role = body.role === "ADMIN" ? "ADMIN" : "USER";
      }
      if (Object.keys(updates).length) {
        await db.update(users).set(updates).where(eq(users.id, id));
      }
      if (body.role === "ADMIN") {
        await db.delete(userFolderAccess).where(eq(userFolderAccess.userId, id));
        await db.delete(userScreenAccess).where(eq(userScreenAccess.userId, id));
      }
      if (body.folderIds !== undefined || body.screenIds !== undefined) {
        await db.delete(userFolderAccess).where(eq(userFolderAccess.userId, id));
        await db.delete(userScreenAccess).where(eq(userScreenAccess.userId, id));
        const u = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
        const role = u[0]?.role ?? "USER";
        if (role === "USER") {
          const folderIds = body.folderIds ?? [];
          const screenIds = body.screenIds ?? [];
          if (folderIds.length) {
            await db.insert(userFolderAccess).values(
              folderIds.map((folderId) => ({ userId: id, folderId }))
            );
          }
          if (screenIds.length) {
            await db.insert(userScreenAccess).values(
              screenIds.map((screenId) => ({ userId: id, screenId }))
            );
          }
        }
      }
      return { ok: true };
    }
  );

  app.delete(
    "/users/:id",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const err = requireAdmin(request, reply);
      if (err) return err;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
      if (id === request.authUser!.sub) {
        return reply.status(400).send({ error: "cannot delete self" });
      }
      await db.delete(users).where(eq(users.id, id));
      return { ok: true };
    }
  );
}

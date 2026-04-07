import type { FastifyInstance } from "fastify";
import { eq, inArray } from "drizzle-orm";
import { promises as fs } from "node:fs";
import path from "node:path";
import { db, pool } from "../db/index.js";
import { folders, screenItems, screens } from "../db/schema.js";
import {
  canAccessFolder,
  getVisibleFolderIds,
} from "../lib/access.js";
import { authPreHandler } from "../plugins/require-auth.js";

type FolderRow = typeof folders.$inferSelect;

function uploadDir(): string {
  const d = process.env.UPLOAD_DIR ?? "./data/uploads";
  return path.resolve(d);
}

function collectDescendantFolderIds(all: Pick<FolderRow, "id" | "parentId">[], rootId: number) {
  const children = new Map<number, number[]>();
  for (const f of all) {
    const p = f.parentId ?? null;
    if (p == null) continue;
    const list = children.get(p) ?? [];
    list.push(f.id);
    children.set(p, list);
  }
  const order: number[] = [];
  const q: number[] = [rootId];
  const seen = new Set<number>();
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const c of children.get(id) ?? []) q.push(c);
  }
  return { ids: [...seen], deleteOrder: order.reverse() };
}

function buildTree(rows: FolderRow[], parentId: number | null): unknown[] {
  return rows
    .filter((r) => (r.parentId ?? null) === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .map((r) => ({
      id: r.id,
      parentId: r.parentId,
      name: r.name,
      sortOrder: r.sortOrder,
      children: buildTree(rows, r.id),
    }));
}

export async function registerFolderRoutes(app: FastifyInstance) {
  app.get(
    "/folders",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const u = request.authUser!;
      let all: FolderRow[];
      if (u.role === "ADMIN") {
        all = await db.select().from(folders);
      } else {
        const visible = await getVisibleFolderIds(u.sub);
        if (visible.size === 0) {
          return { tree: [] };
        }
        all = await db.select().from(folders).where(inArray(folders.id, [...visible]));
      }
      const tree = buildTree(all, null);
      return { tree, flat: all };
    }
  );

  app.post(
    "/folders",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const u = request.authUser!;
      if (u.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
      const body = request.body as {
        name?: string;
        parentId?: number | null;
        sortOrder?: number;
      };
      const name = body.name?.trim();
      if (!name) return reply.status(400).send({ error: "name required" });
      const parentId = body.parentId ?? null;
      if (parentId != null) {
        const p = await db.select().from(folders).where(eq(folders.id, parentId)).limit(1);
        if (!p[0]) return reply.status(400).send({ error: "parent not found" });
      }
      await db.insert(folders).values({
        name,
        parentId,
        sortOrder: body.sortOrder ?? 0,
      });
      const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
      const id = Number((lid as { id: number }[])[0]?.id);
      return { id };
    }
  );

  app.delete(
    "/folders/:id",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const u = request.authUser!;
      if (u.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
      const id = Number((request.params as { id: string }).id);
      if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
      const all = await db.select({ id: folders.id, parentId: folders.parentId }).from(folders);
      if (!all.some((f) => f.id === id)) return reply.status(404).send({ error: "not found" });
      const { ids: folderIds, deleteOrder } = collectDescendantFolderIds(all, id);

      const screenRows =
        folderIds.length === 0
          ? []
          : await db
              .select({ id: screens.id })
              .from(screens)
              .where(inArray(screens.folderId, folderIds));
      const screenIds = screenRows.map((s) => s.id);

      if (screenIds.length > 0) {
        const items = await db
          .select({ storageKey: screenItems.storageKey })
          .from(screenItems)
          .where(inArray(screenItems.screenId, screenIds));
        const root = uploadDir();
        for (const it of items) {
          const fp = path.join(root, it.storageKey);
          try {
            await fs.unlink(fp);
          } catch {
            /* ignore */
          }
        }
        await db.delete(screenItems).where(inArray(screenItems.screenId, screenIds));
        await db.delete(screens).where(inArray(screens.id, screenIds));
      }

      for (const fid of deleteOrder) {
        await db.delete(folders).where(eq(folders.id, fid));
      }
      return { ok: true };
    }
  );

  app.patch(
    "/folders/:id",
    { preHandler: authPreHandler },
    async (request, reply) => {
      const u = request.authUser!;
      const id = Number((request.params as { id: string }).id);
      if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
      if (!(await canAccessFolder(u.sub, u.role, id))) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      if (u.role !== "ADMIN") {
        return reply.status(403).send({ error: "Only admin can rename/move folders" });
      }
      const body = request.body as { name?: string; parentId?: number | null; sortOrder?: number };
      const updates: Partial<{ name: string; parentId: number | null; sortOrder: number }> = {};
      if (body.name != null) updates.name = body.name.trim();
      if (body.parentId !== undefined) updates.parentId = body.parentId;
      if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
      if (Object.keys(updates).length === 0) {
        return reply.status(400).send({ error: "no updates" });
      }
      await db.update(folders).set(updates).where(eq(folders.id, id));
      return { ok: true };
    }
  );

  app.get(
    "/folders/:folderId/screens",
    { preHandler: authPreHandler },
    async (request, reply) => {
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
    }
  );
}

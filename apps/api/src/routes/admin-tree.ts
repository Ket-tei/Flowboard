import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { folders, screens } from "../db/schema.js";
import { adminPreHandler } from "../plugins/require-auth.js";

type FolderRow = typeof folders.$inferSelect;
type ScreenRow = typeof screens.$inferSelect;

function buildTree(
  folderRows: FolderRow[],
  screensByFolder: Map<number, ScreenRow[]>,
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
      screens: (screensByFolder.get(r.id) ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        publicToken: s.publicToken,
      })),
      children: buildTree(folderRows, screensByFolder, r.id),
    }));
}

export async function registerAdminTreeRoutes(app: FastifyInstance) {
  app.get("/admin/folder-screen-tree", { preHandler: adminPreHandler }, async () => {
    const allFolders = await db.select().from(folders);
    const allScreens = await db.select().from(screens);
    const map = new Map<number, ScreenRow[]>();
    for (const s of allScreens) {
      const list = map.get(s.folderId) ?? [];
      list.push(s);
      map.set(s.folderId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }
    return { tree: buildTree(allFolders, map, null) };
  });
}

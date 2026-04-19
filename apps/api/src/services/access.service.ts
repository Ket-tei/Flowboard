import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  folders,
  screens,
  userFolderAccess,
  userScreenAccess,
} from "../db/schema.js";

/**
 * Load all folders once, then expand granted folder IDs to include all
 * descendants in-memory (avoids N+1 queries).
 */
export async function getExpandedFolderAccess(userId: number): Promise<Set<number>> {
  const [granted, allFolders] = await Promise.all([
    db
      .select({ folderId: userFolderAccess.folderId })
      .from(userFolderAccess)
      .where(eq(userFolderAccess.userId, userId)),
    db.select({ id: folders.id, parentId: folders.parentId }).from(folders),
  ]);

  const childrenMap = new Map<number, number[]>();
  for (const f of allFolders) {
    if (f.parentId != null) {
      let kids = childrenMap.get(f.parentId);
      if (!kids) {
        kids = [];
        childrenMap.set(f.parentId, kids);
      }
      kids.push(f.id);
    }
  }

  const expanded = new Set<number>();
  const stack = granted.map((g) => g.folderId);
  while (stack.length) {
    const id = stack.pop()!;
    if (expanded.has(id)) continue;
    expanded.add(id);
    const kids = childrenMap.get(id);
    if (kids) {
      for (const k of kids) stack.push(k);
    }
  }
  return expanded;
}

export async function getVisibleFolderIds(userId: number): Promise<Set<number>> {
  const expanded = await getExpandedFolderAccess(userId);

  const allFolders = await db
    .select({ id: folders.id, parentId: folders.parentId })
    .from(folders);

  const parentMap = new Map<number, number | null>();
  for (const f of allFolders) parentMap.set(f.id, f.parentId ?? null);

  const visible = new Set(expanded);
  for (const id of expanded) {
    let fid: number | null = parentMap.get(id) ?? null;
    while (fid != null) {
      if (visible.has(fid)) break;
      visible.add(fid);
      fid = parentMap.get(fid) ?? null;
    }
  }
  return visible;
}

export async function canAccessFolder(
  userId: number,
  role: string,
  folderId: number
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const expanded = await getExpandedFolderAccess(userId);
  return expanded.has(folderId);
}

export async function canAccessScreen(
  userId: number,
  role: string,
  screenId: number
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const expanded = await getExpandedFolderAccess(userId);
  const scr = await db
    .select({ folderId: screens.folderId })
    .from(screens)
    .where(eq(screens.id, screenId))
    .limit(1);
  if (!scr[0]) return false;
  if (expanded.has(scr[0].folderId)) return true;
  const direct = await db
    .select({ screenId: userScreenAccess.screenId })
    .from(userScreenAccess)
    .where(
      and(eq(userScreenAccess.userId, userId), eq(userScreenAccess.screenId, screenId))
    )
    .limit(1);
  return direct.length > 0;
}

export async function bumpScreenRevision(screenId: number): Promise<void> {
  await db
    .update(screens)
    .set({ revision: sql`${screens.revision} + 1` })
    .where(eq(screens.id, screenId));
}

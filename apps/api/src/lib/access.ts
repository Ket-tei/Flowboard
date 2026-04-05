import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  folders,
  screens,
  userFolderAccess,
  userScreenAccess,
} from "../db/schema.js";

/** Tous les dossiers accessibles (dossiers cochés + descendants). */
export async function getExpandedFolderAccess(userId: number): Promise<Set<number>> {
  const granted = await db
    .select({ folderId: userFolderAccess.folderId })
    .from(userFolderAccess)
    .where(eq(userFolderAccess.userId, userId));

  const expanded = new Set<number>();
  const stack = granted.map((g) => g.folderId);
  while (stack.length) {
    const id = stack.pop()!;
    if (expanded.has(id)) continue;
    expanded.add(id);
    const kids = await db
      .select({ id: folders.id })
      .from(folders)
      .where(eq(folders.parentId, id));
    for (const k of kids) stack.push(k.id);
  }
  return expanded;
}

/** Dossiers visibles dans l’UI : accessibles + ancêtres pour l’arborescence. */
export async function getVisibleFolderIds(userId: number): Promise<Set<number>> {
  const expanded = await getExpandedFolderAccess(userId);
  const visible = new Set(expanded);
  for (const id of expanded) {
    let fid: number | null = id;
    while (fid != null) {
      const row: { parentId: number | null } | undefined = (
        await db
          .select({ parentId: folders.parentId })
          .from(folders)
          .where(eq(folders.id, fid))
          .limit(1)
      )[0];
      const parentId: number | null = row?.parentId ?? null;
      if (parentId != null) visible.add(parentId);
      fid = parentId;
    }
  }
  return visible;
}

/** Accès au contenu d’un dossier (pas seulement affichage comme ancêtre dans l’arbre). */
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

/** Écrans listables pour un utilisateur (dossiers visibles + accès écran direct). */
export async function listAccessibleScreenIds(userId: number, role: string): Promise<number[]> {
  if (role === "ADMIN") {
    const all = await db.select({ id: screens.id }).from(screens);
    return all.map((r) => r.id);
  }
  const expanded = await getExpandedFolderAccess(userId);
  const fromFolders =
    expanded.size === 0
      ? []
      : await db
          .select({ id: screens.id })
          .from(screens)
          .where(inArray(screens.folderId, [...expanded]));

  const direct = await db
    .select({ screenId: userScreenAccess.screenId })
    .from(userScreenAccess)
    .where(eq(userScreenAccess.userId, userId));

  const set = new Set<number>();
  for (const r of fromFolders) set.add(r.id);
  for (const r of direct) set.add(r.screenId);
  return [...set];
}

export async function bumpScreenRevision(screenId: number): Promise<void> {
  await db
    .update(screens)
    .set({ revision: sql`${screens.revision} + 1` })
    .where(eq(screens.id, screenId));
}

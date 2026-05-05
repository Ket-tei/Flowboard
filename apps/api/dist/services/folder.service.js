import { eq, inArray } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import { folders, screenItems, screens } from "../db/schema.js";
import { getVisibleFolderIds } from "./access.service.js";
import { deleteFile } from "./upload.service.js";
function buildTree(rows, parentId) {
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
function collectDescendantFolderIds(all, rootId) {
    const children = new Map();
    for (const f of all) {
        const p = f.parentId ?? null;
        if (p == null)
            continue;
        const list = children.get(p) ?? [];
        list.push(f.id);
        children.set(p, list);
    }
    const order = [];
    const q = [rootId];
    const seen = new Set();
    while (q.length) {
        const id = q.shift();
        if (seen.has(id))
            continue;
        seen.add(id);
        order.push(id);
        for (const c of children.get(id) ?? [])
            q.push(c);
    }
    return { ids: [...seen], deleteOrder: order.reverse() };
}
export async function getFolderTree(userId, role) {
    let all;
    if (role === "ADMIN") {
        all = await db.select().from(folders);
    }
    else {
        const visible = await getVisibleFolderIds(userId);
        if (visible.size === 0)
            return { tree: [], flat: [] };
        all = await db.select().from(folders).where(inArray(folders.id, [...visible]));
    }
    return { tree: buildTree(all, null), flat: all };
}
export async function createFolder(input) {
    if (input.parentId != null) {
        const p = await db.select().from(folders).where(eq(folders.id, input.parentId)).limit(1);
        if (!p[0])
            throw new NotFoundError("parent folder not found");
    }
    await db.insert(folders).values({
        name: input.name,
        parentId: input.parentId ?? null,
        sortOrder: input.sortOrder,
    });
    const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
    const id = Number(lid[0]?.id);
    return { id };
}
export async function deleteFolder(folderId) {
    const all = await db.select({ id: folders.id, parentId: folders.parentId }).from(folders);
    if (!all.some((f) => f.id === folderId))
        throw new NotFoundError("folder not found");
    const { ids: folderIds, deleteOrder } = collectDescendantFolderIds(all, folderId);
    const screenRows = folderIds.length === 0
        ? []
        : await db.select({ id: screens.id }).from(screens).where(inArray(screens.folderId, folderIds));
    const screenIds = screenRows.map((s) => s.id);
    if (screenIds.length > 0) {
        const items = await db
            .select({ storageKey: screenItems.storageKey })
            .from(screenItems)
            .where(inArray(screenItems.screenId, screenIds));
        for (const it of items)
            await deleteFile(it.storageKey);
        await db.delete(screenItems).where(inArray(screenItems.screenId, screenIds));
        await db.delete(screens).where(inArray(screens.id, screenIds));
    }
    for (const fid of deleteOrder) {
        await db.delete(folders).where(eq(folders.id, fid));
    }
}
export async function updateFolder(folderId, input) {
    const updates = {};
    if (input.name != null)
        updates.name = input.name;
    if (input.parentId !== undefined)
        updates.parentId = input.parentId;
    if (input.sortOrder !== undefined)
        updates.sortOrder = input.sortOrder;
    await db.update(folders).set(updates).where(eq(folders.id, folderId));
}
export class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
    }
}

import { eq, inArray } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import { folders, screens } from "../db/schema.js";
import { canAccessFolder, getVisibleFolderIds, } from "../lib/access.js";
import { authPreHandler } from "../plugins/require-auth.js";
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
export async function registerFolderRoutes(app) {
    app.get("/folders", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        let all;
        if (u.role === "ADMIN") {
            all = await db.select().from(folders);
        }
        else {
            const visible = await getVisibleFolderIds(u.sub);
            if (visible.size === 0) {
                return { tree: [] };
            }
            all = await db.select().from(folders).where(inArray(folders.id, [...visible]));
        }
        const tree = buildTree(all, null);
        return { tree, flat: all };
    });
    app.post("/folders", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        if (u.role !== "ADMIN") {
            return reply.status(403).send({ error: "Forbidden" });
        }
        const body = request.body;
        const name = body.name?.trim();
        if (!name)
            return reply.status(400).send({ error: "name required" });
        const parentId = body.parentId ?? null;
        if (parentId != null) {
            const p = await db.select().from(folders).where(eq(folders.id, parentId)).limit(1);
            if (!p[0])
                return reply.status(400).send({ error: "parent not found" });
        }
        await db.insert(folders).values({
            name,
            parentId,
            sortOrder: body.sortOrder ?? 0,
        });
        const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
        const id = Number(lid[0]?.id);
        return { id };
    });
    app.delete("/folders/:id", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        if (u.role !== "ADMIN") {
            return reply.status(403).send({ error: "Forbidden" });
        }
        const id = Number(request.params.id);
        if (!Number.isFinite(id))
            return reply.status(400).send({ error: "invalid id" });
        await db.delete(folders).where(eq(folders.id, id));
        return { ok: true };
    });
    app.patch("/folders/:id", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        const id = Number(request.params.id);
        if (!Number.isFinite(id))
            return reply.status(400).send({ error: "invalid id" });
        if (!(await canAccessFolder(u.sub, u.role, id))) {
            return reply.status(403).send({ error: "Forbidden" });
        }
        if (u.role !== "ADMIN") {
            return reply.status(403).send({ error: "Only admin can rename/move folders" });
        }
        const body = request.body;
        const updates = {};
        if (body.name != null)
            updates.name = body.name.trim();
        if (body.parentId !== undefined)
            updates.parentId = body.parentId;
        if (body.sortOrder !== undefined)
            updates.sortOrder = body.sortOrder;
        if (Object.keys(updates).length === 0) {
            return reply.status(400).send({ error: "no updates" });
        }
        await db.update(folders).set(updates).where(eq(folders.id, id));
        return { ok: true };
    });
    app.get("/folders/:folderId/screens", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        const folderId = Number(request.params.folderId);
        if (!Number.isFinite(folderId))
            return reply.status(400).send({ error: "invalid id" });
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

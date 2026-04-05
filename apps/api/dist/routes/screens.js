import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, pool } from "../db/index.js";
import { folders, screenItems, screens } from "../db/schema.js";
import { bumpScreenRevision, canAccessScreen } from "../lib/access.js";
import { mimeToMediaType } from "../lib/media-type.js";
import { authPreHandler, requireAdmin } from "../plugins/require-auth.js";
function uploadDir() {
    const d = process.env.UPLOAD_DIR ?? "./data/uploads";
    return path.resolve(d);
}
async function ensureUploadDir() {
    await fs.mkdir(uploadDir(), { recursive: true });
}
export async function registerScreenRoutes(app) {
    app.post("/folders/:folderId/screens", { preHandler: authPreHandler }, async (request, reply) => {
        const err = requireAdmin(request, reply);
        if (err)
            return err;
        const folderId = Number(request.params.folderId);
        if (!Number.isFinite(folderId))
            return reply.status(400).send({ error: "invalid folder" });
        const f = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
        if (!f[0])
            return reply.status(404).send({ error: "folder not found" });
        const body = request.body;
        const name = body.name?.trim();
        if (!name)
            return reply.status(400).send({ error: "name required" });
        const publicToken = uuidv4();
        await db.insert(screens).values({
            folderId,
            name,
            publicToken,
            sortOrder: body.sortOrder ?? 0,
            revision: 0,
        });
        const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
        const id = Number(lid[0]?.id);
        return { id, publicToken, slideshowPath: `/show/${publicToken}` };
    });
    app.get("/screens/:id", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        const id = Number(request.params.id);
        if (!Number.isFinite(id))
            return reply.status(400).send({ error: "invalid id" });
        if (!(await canAccessScreen(u.sub, u.role, id))) {
            return reply.status(403).send({ error: "Forbidden" });
        }
        const scr = await db.select().from(screens).where(eq(screens.id, id)).limit(1);
        if (!scr[0])
            return reply.status(404).send({ error: "not found" });
        const items = await db
            .select()
            .from(screenItems)
            .where(eq(screenItems.screenId, id))
            .orderBy(screenItems.sortOrder, screenItems.id);
        return {
            screen: {
                id: scr[0].id,
                folderId: scr[0].folderId,
                name: scr[0].name,
                publicToken: scr[0].publicToken,
                revision: scr[0].revision,
                slideshowPath: `/show/${scr[0].publicToken}`,
            },
            items: items.map((it) => ({
                id: it.id,
                type: it.type,
                durationMs: it.durationMs,
                sortOrder: it.sortOrder,
                mimeType: it.mimeType,
            })),
        };
    });
    app.patch("/screens/:id", { preHandler: authPreHandler }, async (request, reply) => {
        const err = requireAdmin(request, reply);
        if (err)
            return err;
        const id = Number(request.params.id);
        if (!Number.isFinite(id))
            return reply.status(400).send({ error: "invalid id" });
        const body = request.body;
        const updates = {};
        if (body.name != null)
            updates.name = body.name.trim();
        if (body.sortOrder !== undefined)
            updates.sortOrder = body.sortOrder;
        if (body.folderId !== undefined)
            updates.folderId = body.folderId;
        if (Object.keys(updates).length === 0) {
            return reply.status(400).send({ error: "no updates" });
        }
        await db.update(screens).set(updates).where(eq(screens.id, id));
        await bumpScreenRevision(id);
        return { ok: true };
    });
    app.delete("/screens/:id", { preHandler: authPreHandler }, async (request, reply) => {
        const err = requireAdmin(request, reply);
        if (err)
            return err;
        const id = Number(request.params.id);
        if (!Number.isFinite(id))
            return reply.status(400).send({ error: "invalid id" });
        const items = await db.select().from(screenItems).where(eq(screenItems.screenId, id));
        const root = uploadDir();
        for (const it of items) {
            const fp = path.join(root, it.storageKey);
            try {
                await fs.unlink(fp);
            }
            catch {
                /* ignore */
            }
        }
        await db.delete(screens).where(eq(screens.id, id));
        return { ok: true };
    });
    app.post("/screens/:id/items", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        const screenId = Number(request.params.id);
        if (!Number.isFinite(screenId))
            return reply.status(400).send({ error: "invalid id" });
        if (!(await canAccessScreen(u.sub, u.role, screenId))) {
            return reply.status(403).send({ error: "Forbidden" });
        }
        const mp = await request.file();
        if (!mp)
            return reply.status(400).send({ error: "file required" });
        const q = request.query;
        const durationMs = Number(q.durationMs ?? 5000) || 5000;
        const mime = mp.mimetype ?? "application/octet-stream";
        const kind = mimeToMediaType(mime);
        if (!kind) {
            return reply.status(400).send({ error: "unsupported media type" });
        }
        await ensureUploadDir();
        const ext = path.extname(mp.filename || "") || (kind === "VIDEO" ? ".mp4" : ".bin");
        const storageKey = `${screenId}/${uuidv4()}${ext}`;
        const full = path.join(uploadDir(), storageKey);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await pipeline(mp.file, createWriteStream(full));
        const maxOrder = await db
            .select({ sortOrder: screenItems.sortOrder })
            .from(screenItems)
            .where(eq(screenItems.screenId, screenId))
            .orderBy(desc(screenItems.sortOrder))
            .limit(1);
        const nextOrder = (maxOrder[0]?.sortOrder ?? -1) + 1;
        await db.insert(screenItems).values({
            screenId,
            type: kind,
            storageKey,
            mimeType: mime,
            durationMs,
            sortOrder: nextOrder,
        });
        const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
        const itemId = Number(lid[0]?.id);
        await bumpScreenRevision(screenId);
        return { id: itemId, type: kind, durationMs, sortOrder: nextOrder, mimeType: mime };
    });
    app.patch("/screens/:id/items/order", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        const screenId = Number(request.params.id);
        if (!Number.isFinite(screenId))
            return reply.status(400).send({ error: "invalid id" });
        if (!(await canAccessScreen(u.sub, u.role, screenId))) {
            return reply.status(403).send({ error: "Forbidden" });
        }
        const body = request.body;
        const orderedIds = body.orderedIds;
        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return reply.status(400).send({ error: "orderedIds required" });
        }
        const existing = await db
            .select({ id: screenItems.id })
            .from(screenItems)
            .where(eq(screenItems.screenId, screenId));
        const setIds = new Set(existing.map((e) => e.id));
        for (let i = 0; i < orderedIds.length; i++) {
            const id = orderedIds[i];
            if (!setIds.has(id)) {
                return reply.status(400).send({ error: "invalid item id" });
            }
            await db.update(screenItems).set({ sortOrder: i }).where(eq(screenItems.id, id));
        }
        await bumpScreenRevision(screenId);
        return { ok: true };
    });
    app.patch("/screens/:id/items/:itemId", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        const screenId = Number(request.params.id);
        const itemId = Number(request.params.itemId);
        if (!Number.isFinite(screenId) || !Number.isFinite(itemId)) {
            return reply.status(400).send({ error: "invalid id" });
        }
        if (!(await canAccessScreen(u.sub, u.role, screenId))) {
            return reply.status(403).send({ error: "Forbidden" });
        }
        const row = await db
            .select()
            .from(screenItems)
            .where(eq(screenItems.id, itemId))
            .limit(1);
        if (!row[0] || row[0].screenId !== screenId) {
            return reply.status(404).send({ error: "not found" });
        }
        const body = request.body;
        if (body.durationMs === undefined) {
            return reply.status(400).send({ error: "durationMs required" });
        }
        await db
            .update(screenItems)
            .set({ durationMs: body.durationMs })
            .where(eq(screenItems.id, itemId));
        await bumpScreenRevision(screenId);
        return { ok: true };
    });
    app.delete("/screens/:id/items/:itemId", { preHandler: authPreHandler }, async (request, reply) => {
        const u = request.authUser;
        const screenId = Number(request.params.id);
        const itemId = Number(request.params.itemId);
        if (!Number.isFinite(screenId) || !Number.isFinite(itemId)) {
            return reply.status(400).send({ error: "invalid id" });
        }
        if (!(await canAccessScreen(u.sub, u.role, screenId))) {
            return reply.status(403).send({ error: "Forbidden" });
        }
        const row = await db
            .select()
            .from(screenItems)
            .where(eq(screenItems.id, itemId))
            .limit(1);
        if (!row[0] || row[0].screenId !== screenId) {
            return reply.status(404).send({ error: "not found" });
        }
        const full = path.join(uploadDir(), row[0].storageKey);
        try {
            await fs.unlink(full);
        }
        catch {
            /* ignore */
        }
        await db.delete(screenItems).where(eq(screenItems.id, itemId));
        await bumpScreenRevision(screenId);
        return { ok: true };
    });
}

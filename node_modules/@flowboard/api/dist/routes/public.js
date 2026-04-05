import { createReadStream } from "node:fs";
import path from "node:path";
import { stat } from "node:fs/promises";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { screenItems, screens } from "../db/schema.js";
function uploadDir() {
    return path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads");
}
export async function registerPublicRoutes(app) {
    app.get("/public/screens/:token/manifest", async (request, reply) => {
        const token = request.params.token;
        const scr = await db
            .select()
            .from(screens)
            .where(eq(screens.publicToken, token))
            .limit(1);
        if (!scr[0]) {
            return reply.status(404).send({ error: "not found" });
        }
        const items = await db
            .select()
            .from(screenItems)
            .where(eq(screenItems.screenId, scr[0].id))
            .orderBy(screenItems.sortOrder, screenItems.id);
        return {
            revision: scr[0].revision,
            screenId: scr[0].id,
            items: items.map((it) => ({
                id: it.id,
                type: it.type,
                durationMs: it.durationMs,
                mimeType: it.mimeType,
                url: `/api/public/screens/${encodeURIComponent(token)}/media/${it.id}`,
            })),
        };
    });
    app.get("/public/screens/:token/media/:itemId", async (request, reply) => {
        const token = request.params.token;
        const itemId = Number(request.params.itemId);
        if (!Number.isFinite(itemId)) {
            return reply.status(400).send({ error: "invalid item" });
        }
        const scr = await db
            .select()
            .from(screens)
            .where(eq(screens.publicToken, token))
            .limit(1);
        if (!scr[0]) {
            return reply.status(404).send({ error: "not found" });
        }
        const item = await db
            .select()
            .from(screenItems)
            .where(and(eq(screenItems.id, itemId), eq(screenItems.screenId, scr[0].id)))
            .limit(1);
        if (!item[0]) {
            return reply.status(404).send({ error: "not found" });
        }
        const full = path.join(uploadDir(), item[0].storageKey);
        try {
            const st = await stat(full);
            if (!st.isFile()) {
                return reply.status(404).send({ error: "not found" });
            }
        }
        catch {
            return reply.status(404).send({ error: "not found" });
        }
        reply.header("Content-Type", item[0].mimeType);
        reply.header("Cache-Control", "public, max-age=31536000, immutable");
        return reply.send(createReadStream(full));
    });
}

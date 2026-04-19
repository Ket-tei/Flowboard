import type { FastifyInstance } from "fastify";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { screenItems, screens } from "../db/schema.js";
import { resolveFilePath } from "../services/upload.service.js";

export async function registerPublicRoutes(app: FastifyInstance) {
  app.get("/public/screens/:token/manifest", async (request, reply) => {
    const token = (request.params as { token: string }).token;
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
    const token = (request.params as { token: string }).token;
    const itemId = Number((request.params as { itemId: string }).itemId);
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
      .where(
        and(eq(screenItems.id, itemId), eq(screenItems.screenId, scr[0].id))
      )
      .limit(1);
    if (!item[0]) {
      return reply.status(404).send({ error: "not found" });
    }
    const full = resolveFilePath(item[0].storageKey);
    let fileStat;
    try {
      fileStat = await stat(full);
      if (!fileStat.isFile()) {
        return reply.status(404).send({ error: "not found" });
      }
    } catch {
      return reply.status(404).send({ error: "not found" });
    }

    const totalSize = fileStat.size;
    const mime = item[0].mimeType;
    const rangeHeader = request.headers.range;

    reply.header("Accept-Ranges", "bytes");
    reply.header("Cache-Control", "public, max-age=31536000, immutable");

    if (rangeHeader) {
      const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
        const chunkSize = end - start + 1;

        reply.status(206);
        reply.header("Content-Type", mime);
        reply.header("Content-Range", `bytes ${start}-${end}/${totalSize}`);
        reply.header("Content-Length", chunkSize);
        return reply.send(createReadStream(full, { start, end }));
      }
    }

    reply.header("Content-Type", mime);
    reply.header("Content-Length", totalSize);
    return reply.send(createReadStream(full));
  });
}

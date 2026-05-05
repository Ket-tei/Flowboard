import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, pool } from "../db/index.js";
import { templateItems } from "../db/schema.js";
import { deleteFile, saveFile } from "./upload.service.js";
import { mimeToMediaType } from "../lib/media-type.js";
import { bumpTemplateRevision } from "./template.service.js";
import { BadRequestError, NotFoundError } from "../lib/errors.js";
export async function uploadTemplateItem(templateId, file, opts) {
    const mime = file.mimetype ?? "application/octet-stream";
    const kind = mimeToMediaType(mime);
    if (!kind)
        throw new BadRequestError("unsupported media type");
    const ext = path.extname(file.filename || "") || (kind === "VIDEO" ? ".mp4" : ".bin");
    const storageKey = `tpl_${templateId}/${uuidv4()}${ext}`;
    await saveFile(file.stream, storageKey);
    const maxOrder = await db
        .select({ sortOrder: templateItems.sortOrder })
        .from(templateItems)
        .where(eq(templateItems.templateId, templateId))
        .orderBy(desc(templateItems.sortOrder))
        .limit(1);
    const nextOrder = (maxOrder[0]?.sortOrder ?? -1) + 1;
    await db.insert(templateItems).values({
        templateId,
        type: kind,
        storageKey,
        mimeType: mime,
        durationMs: opts.durationMs,
        sortOrder: nextOrder,
        transitionType: opts.transitionType,
        transitionDurationMs: opts.transitionDurationMs,
    });
    const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
    const itemId = Number(lid[0]?.id);
    await bumpTemplateRevision(templateId);
    return {
        id: itemId,
        type: kind,
        durationMs: opts.durationMs,
        sortOrder: nextOrder,
        mimeType: mime,
        transitionType: opts.transitionType,
        transitionDurationMs: opts.transitionDurationMs,
    };
}
export async function reorderTemplateItems(templateId, input) {
    const existing = await db.select({ id: templateItems.id }).from(templateItems).where(eq(templateItems.templateId, templateId));
    const setIds = new Set(existing.map((e) => e.id));
    for (let i = 0; i < input.orderedIds.length; i++) {
        if (!setIds.has(input.orderedIds[i]))
            throw new BadRequestError("invalid item id");
        await db.update(templateItems).set({ sortOrder: i }).where(eq(templateItems.id, input.orderedIds[i]));
    }
    await bumpTemplateRevision(templateId);
}
export async function updateTemplateItem(templateId, itemId, input) {
    const row = await db.select().from(templateItems).where(eq(templateItems.id, itemId)).limit(1);
    if (!row[0] || row[0].templateId !== templateId)
        throw new NotFoundError("item not found");
    const updates = {};
    if (input.durationMs !== undefined)
        updates.durationMs = input.durationMs;
    if (input.transitionType !== undefined)
        updates.transitionType = input.transitionType;
    if (input.transitionDurationMs !== undefined)
        updates.transitionDurationMs = input.transitionDurationMs;
    await db.update(templateItems).set(updates).where(eq(templateItems.id, itemId));
    await bumpTemplateRevision(templateId);
}
export async function deleteTemplateItem(templateId, itemId) {
    const row = await db.select().from(templateItems).where(eq(templateItems.id, itemId)).limit(1);
    if (!row[0] || row[0].templateId !== templateId)
        throw new NotFoundError("item not found");
    await deleteFile(row[0].storageKey);
    await db.delete(templateItems).where(eq(templateItems.id, itemId));
    await bumpTemplateRevision(templateId);
}

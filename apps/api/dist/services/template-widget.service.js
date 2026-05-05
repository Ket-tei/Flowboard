import { eq } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import { templateWidgets } from "../db/schema.js";
import { bumpTemplateRevision, safeParseJson } from "./template.service.js";
import { NotFoundError } from "../lib/errors.js";
export async function createTemplateWidget(templateId, input) {
    const wx = input.x ?? 0.85;
    const wy = input.y ?? 0.04;
    const ww = input.w ?? 0.13;
    const wh = input.h ?? 0.10;
    await db.insert(templateWidgets).values({
        templateId,
        type: input.type,
        position: input.position,
        config: JSON.stringify(input.config),
        x: String(wx),
        y: String(wy),
        w: String(ww),
        h: String(wh),
        startMs: input.startMs ?? null,
        endMs: input.endMs ?? null,
    });
    const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
    const id = Number(lid[0]?.id);
    await bumpTemplateRevision(templateId);
    return { id, type: input.type, config: input.config, x: wx, y: wy, w: ww, h: wh, startMs: input.startMs ?? null, endMs: input.endMs ?? null };
}
export async function updateTemplateWidget(templateId, widgetId, input) {
    const row = await db.select().from(templateWidgets).where(eq(templateWidgets.id, widgetId)).limit(1);
    if (!row[0] || row[0].templateId !== templateId)
        throw new NotFoundError("widget not found");
    const updates = {};
    if (input.position !== undefined)
        updates.position = input.position;
    if (input.config !== undefined)
        updates.config = JSON.stringify(input.config);
    if (input.x !== undefined)
        updates.x = String(input.x);
    if (input.y !== undefined)
        updates.y = String(input.y);
    if (input.w !== undefined)
        updates.w = String(input.w);
    if (input.h !== undefined)
        updates.h = String(input.h);
    if ("startMs" in input)
        updates.startMs = input.startMs ?? null;
    if ("endMs" in input)
        updates.endMs = input.endMs ?? null;
    await db.update(templateWidgets).set(updates).where(eq(templateWidgets.id, widgetId));
    await bumpTemplateRevision(templateId);
}
export async function deleteTemplateWidget(templateId, widgetId) {
    const row = await db.select().from(templateWidgets).where(eq(templateWidgets.id, widgetId)).limit(1);
    if (!row[0] || row[0].templateId !== templateId)
        throw new NotFoundError("widget not found");
    await db.delete(templateWidgets).where(eq(templateWidgets.id, widgetId));
    await bumpTemplateRevision(templateId);
}
export { safeParseJson };

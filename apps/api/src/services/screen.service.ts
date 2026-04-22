import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, pool } from "../db/index.js";
import { folders, screenItems, screens } from "../db/schema.js";
import { bumpScreenRevision } from "./access.service.js";
import { deleteFile, ensureUploadDir, uploadDir } from "./upload.service.js";
import { mimeToMediaType } from "../lib/media-type.js";
import type {
  ReorderItemsInput,
  UpdateItemInput,
} from "../schemas/screen.schema.js";

export async function createScreen(folderId: number, input: { name: string; sortOrder: number }, displayMode: "QUICK" | "TEMPLATE" = "QUICK") {
  const f = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
  if (!f[0]) throw new ScreenError("folder not found", 404);
  const publicToken = uuidv4();
  await db.insert(screens).values({
    folderId,
    name: input.name,
    publicToken,
    sortOrder: input.sortOrder,
    revision: 0,
    displayMode,
  });
  const [lid] = await pool.query("SELECT LAST_INSERT_ID() AS id");
  const id = Number((lid as { id: number }[])[0]?.id);
  return { id, publicToken, slideshowPath: `/show/${publicToken}` };
}

export async function getScreenDetail(screenId: number) {
  const scr = await db.select().from(screens).where(eq(screens.id, screenId)).limit(1);
  if (!scr[0]) throw new ScreenError("screen not found", 404);
  const items = await db
    .select()
    .from(screenItems)
    .where(eq(screenItems.screenId, screenId))
    .orderBy(screenItems.sortOrder, screenItems.id);
  return {
    screen: {
      id: scr[0].id,
      folderId: scr[0].folderId,
      name: scr[0].name,
      publicToken: scr[0].publicToken,
      revision: scr[0].revision,
      displayMode: scr[0].displayMode,
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
}

export async function updateScreen(screenId: number, input: { name?: string; sortOrder?: number; folderId?: number; displayMode?: "QUICK" | "TEMPLATE" }) {
  const updates: Partial<{ name: string; sortOrder: number; folderId: number; displayMode: "QUICK" | "TEMPLATE" }> = {};
  if (input.name != null) updates.name = input.name;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
  if (input.folderId !== undefined) updates.folderId = input.folderId;
  if (input.displayMode !== undefined) updates.displayMode = input.displayMode;
  await db.update(screens).set(updates).where(eq(screens.id, screenId));
  await bumpScreenRevision(screenId);
}

export async function deleteScreen(screenId: number) {
  const items = await db.select().from(screenItems).where(eq(screenItems.screenId, screenId));
  for (const it of items) await deleteFile(it.storageKey);
  await db.delete(screens).where(eq(screens.id, screenId));
}

export async function uploadItem(
  screenId: number,
  file: { file: Readable; mimetype: string; filename: string },
  durationMs: number
) {
  const mime = file.mimetype ?? "application/octet-stream";
  const kind = mimeToMediaType(mime);
  if (!kind) throw new ScreenError("unsupported media type", 400);

  await ensureUploadDir();
  const ext = path.extname(file.filename || "") || (kind === "VIDEO" ? ".mp4" : ".bin");
  const storageKey = `${screenId}/${uuidv4()}${ext}`;
  const full = path.join(uploadDir(), storageKey);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await pipeline(file.file, createWriteStream(full));

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
  const itemId = Number((lid as { id: number }[])[0]?.id);
  await bumpScreenRevision(screenId);
  return { id: itemId, type: kind, durationMs, sortOrder: nextOrder, mimeType: mime };
}

export async function reorderItems(screenId: number, input: ReorderItemsInput) {
  const existing = await db
    .select({ id: screenItems.id })
    .from(screenItems)
    .where(eq(screenItems.screenId, screenId));
  const setIds = new Set(existing.map((e) => e.id));
  for (let i = 0; i < input.orderedIds.length; i++) {
    if (!setIds.has(input.orderedIds[i])) {
      throw new ScreenError("invalid item id", 400);
    }
    await db.update(screenItems).set({ sortOrder: i }).where(eq(screenItems.id, input.orderedIds[i]));
  }
  await bumpScreenRevision(screenId);
}

export async function updateItem(screenId: number, itemId: number, input: UpdateItemInput) {
  const row = await db.select().from(screenItems).where(eq(screenItems.id, itemId)).limit(1);
  if (!row[0] || row[0].screenId !== screenId) {
    throw new ScreenError("item not found", 404);
  }
  await db.update(screenItems).set({ durationMs: input.durationMs }).where(eq(screenItems.id, itemId));
  await bumpScreenRevision(screenId);
}

export async function deleteItem(screenId: number, itemId: number) {
  const row = await db.select().from(screenItems).where(eq(screenItems.id, itemId)).limit(1);
  if (!row[0] || row[0].screenId !== screenId) {
    throw new ScreenError("item not found", 404);
  }
  await deleteFile(row[0].storageKey);
  await db.delete(screenItems).where(eq(screenItems.id, itemId));
  await bumpScreenRevision(screenId);
}

export class ScreenError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ScreenError";
  }
}

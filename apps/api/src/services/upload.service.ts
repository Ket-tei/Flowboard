import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";

let _dir: string | null = null;

export function uploadDir(): string {
  if (!_dir) {
    _dir = path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads");
  }
  return _dir;
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(uploadDir(), { recursive: true });
}

export async function deleteFile(storageKey: string): Promise<void> {
  const full = path.join(uploadDir(), storageKey);
  try {
    await fs.unlink(full);
  } catch {
    /* file may already be gone */
  }
}

export function resolveFilePath(storageKey: string): string {
  return path.join(uploadDir(), storageKey);
}

export async function saveFile(stream: Readable, storageKey: string): Promise<void> {
  await ensureUploadDir();
  const full = path.join(uploadDir(), storageKey);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await pipeline(stream, createWriteStream(full));
}

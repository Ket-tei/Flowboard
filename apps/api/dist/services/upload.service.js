import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
let _dir = null;
export function uploadDir() {
    if (!_dir) {
        _dir = path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads");
    }
    return _dir;
}
export async function ensureUploadDir() {
    await fs.mkdir(uploadDir(), { recursive: true });
}
export async function deleteFile(storageKey) {
    const full = path.join(uploadDir(), storageKey);
    try {
        await fs.unlink(full);
    }
    catch {
        /* file may already be gone */
    }
}
export function resolveFilePath(storageKey) {
    return path.join(uploadDir(), storageKey);
}
export async function saveFile(stream, storageKey) {
    await ensureUploadDir();
    const full = path.join(uploadDir(), storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await pipeline(stream, createWriteStream(full));
}

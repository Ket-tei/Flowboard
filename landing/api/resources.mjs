import os from "node:os";
import { statfs } from "node:fs/promises";
import { APP_ROOT } from "./config.mjs";

export const MIN_RAM_BYTES = 0.7 * 1024 ** 3; // 0.7 GB
export const MIN_DISK_BYTES = 2 * 1024 ** 3;  // 2 GB

export async function checkHostResources() {
  const freeRamBytes = os.freemem();

  let freeDiskBytes = Infinity;
  try {
    const stats = await statfs(APP_ROOT);
    freeDiskBytes = stats.bavail * stats.bsize;
  } catch {
    // statfs unavailable on this platform — skip disk check
    console.warn("[resources] fs.statfs unavailable, skipping disk check");
  }

  const ok = freeRamBytes >= MIN_RAM_BYTES && freeDiskBytes >= MIN_DISK_BYTES;
  return { ok, freeRamBytes, freeDiskBytes };
}

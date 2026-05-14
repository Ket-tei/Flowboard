import os from "node:os";
import { statfs, readFile } from "node:fs/promises";
import { APP_ROOT } from "./config.mjs";

export const MIN_RAM_BYTES = 0.7 * 1024 ** 3; // 0.7 GB
export const MIN_DISK_BYTES = 2 * 1024 ** 3;  // 2 GB

// On Linux, prefer MemAvailable from /proc/meminfo: it reflects RAM the kernel
// can actually hand to a new process (free + reclaimable cache), unlike
// os.freemem() which reports only raw free pages.
async function getAvailableRamBytes() {
  try {
    const meminfo = await readFile("/proc/meminfo", "utf8");
    const match = meminfo.match(/^MemAvailable:\s+(\d+)\s+kB/m);
    if (match) return Number(match[1]) * 1024;
  } catch {
    // /proc/meminfo unavailable (macOS, Windows) — fall through
  }
  return os.freemem();
}

export async function checkHostResources() {
  const freeRamBytes = await getAvailableRamBytes();

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

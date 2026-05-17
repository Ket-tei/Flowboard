import { readFile, writeFile } from "node:fs/promises";
import { DB_PATH } from "./config.mjs";

export async function loadDb() {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const accounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
    return { accounts };
  } catch {
    return { accounts: [] };
  }
}

export async function saveDb(db) {
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

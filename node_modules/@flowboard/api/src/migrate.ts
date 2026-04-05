import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "node:path";
import { db } from "./db/index.js";

export async function runMigrate(): Promise<void> {
  const folder = path.join(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder: folder });
}

import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import path from "node:path";

export async function runMigrate(): Promise<void> {
  const folder = path.join(process.cwd(), "drizzle");
  // multipleStatements required so MariaDB can run migration files
  // that contain more than one SQL statement.
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true,
  });
  const migrationDb = drizzle(conn);
  try {
    await migrate(migrationDb, { migrationsFolder: folder });
  } finally {
    await conn.end();
  }
}

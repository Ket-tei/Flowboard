import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";

export async function bootstrapAdmin(): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  const username = process.env.ADMIN_BOOTSTRAP_USERNAME ?? "admin";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    username,
    passwordHash,
    role: "ADMIN",
  });
  console.log(`[bootstrap] Created admin user "${username}"`);
}

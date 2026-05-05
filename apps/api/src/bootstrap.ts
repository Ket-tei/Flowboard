import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { users, instanceConfig } from "./db/schema.js";

export async function bootstrapAdmin(): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length === 0) {
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

  const planId = (process.env.PLAN_ID ?? "FREE") as "FREE" | "PREMIUM" | "PRO";
  await db
    .insert(instanceConfig)
    .values({ id: 1, planId })
    .onDuplicateKeyUpdate({ set: { planId } });
  console.log(`[bootstrap] Plan: ${planId}`);
}

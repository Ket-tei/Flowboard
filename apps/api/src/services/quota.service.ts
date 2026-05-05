import { count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { screens, screenItems, users, instanceConfig } from "../db/schema.js";

export const PLAN_LIMITS = {
  FREE: { screens: 3, mediaPerScreen: 2, users: 1 },
  PREMIUM: { screens: 15, mediaPerScreen: 5, users: Infinity },
  PRO: { screens: Infinity, mediaPerScreen: Infinity, users: Infinity },
} as const;

export async function getInstancePlan(): Promise<"FREE" | "PREMIUM" | "PRO"> {
  const rows = await db.select().from(instanceConfig).where(eq(instanceConfig.id, 1)).limit(1);
  return rows[0]?.planId ?? "FREE";
}

export async function checkScreenLimit(): Promise<void> {
  const plan = await getInstancePlan();
  const limit = PLAN_LIMITS[plan].screens;
  if (limit === Infinity) return;
  const [{ value }] = await db.select({ value: count() }).from(screens);
  if (value >= limit) throw new QuotaError(`Plan ${plan}: max ${limit} écrans`);
}

export async function checkMediaLimit(screenId: number): Promise<void> {
  const plan = await getInstancePlan();
  const limit = PLAN_LIMITS[plan].mediaPerScreen;
  if (limit === Infinity) return;
  const [{ value }] = await db
    .select({ value: count() })
    .from(screenItems)
    .where(eq(screenItems.screenId, screenId));
  if (value >= limit) throw new QuotaError(`Plan ${plan}: max ${limit} médias par écran`);
}

export async function checkUserLimit(): Promise<void> {
  const plan = await getInstancePlan();
  const limit = PLAN_LIMITS[plan].users;
  if (limit === Infinity) return;
  const [{ value }] = await db.select({ value: count() }).from(users);
  if (value >= limit) throw new QuotaError(`Plan ${plan}: max ${limit} utilisateur(s)`);
}

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

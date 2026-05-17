import { count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { screens, users, instanceConfig } from "../db/schema.js";

export const PLAN_LIMITS = {
  FREE: { screens: 1, users: 1 },
  PREMIUM: { screens: 15, users: Infinity },
  PRO: { screens: 30, users: Infinity },
  ENTERPRISE: { screens: Infinity, users: Infinity },
} as const;

export type PlanId = "FREE" | "PREMIUM" | "PRO" | "ENTERPRISE";

interface InstancePlanInfo {
  planId: PlanId;
  customScreenLimit: number | null;
}

export async function getInstancePlanInfo(): Promise<InstancePlanInfo> {
  const rows = await db.select().from(instanceConfig).where(eq(instanceConfig.id, 1)).limit(1);
  return {
    planId: (rows[0]?.planId ?? "FREE") as PlanId,
    customScreenLimit: rows[0]?.customScreenLimit ?? null,
  };
}

export async function getInstancePlan(): Promise<PlanId> {
  const info = await getInstancePlanInfo();
  return info.planId;
}

function resolveScreenLimit(info: InstancePlanInfo): number {
  if (info.planId === "ENTERPRISE" && info.customScreenLimit != null) {
    return info.customScreenLimit;
  }
  return PLAN_LIMITS[info.planId].screens;
}

export async function checkScreenLimit(): Promise<void> {
  const info = await getInstancePlanInfo();
  const limit = resolveScreenLimit(info);
  if (limit === Infinity) return;
  const [{ value }] = await db.select({ value: count() }).from(screens);
  if (value >= limit) throw new QuotaError(`Plan ${info.planId}: max ${limit} écrans`);
}

export async function checkUserLimit(): Promise<void> {
  const info = await getInstancePlanInfo();
  const limit = PLAN_LIMITS[info.planId].users;
  if (limit === Infinity) return;
  const [{ value }] = await db.select({ value: count() }).from(users);
  if (value >= limit) throw new QuotaError(`Plan ${info.planId}: max ${limit} utilisateur(s)`);
}

export async function getInstanceUsage(): Promise<{ screens: number; users: number }> {
  const [screensRow] = await db.select({ value: count() }).from(screens);
  const [usersRow] = await db.select({ value: count() }).from(users);
  return { screens: screensRow.value, users: usersRow.value };
}

export async function getPlanLimits(info: InstancePlanInfo): Promise<{ screens: number | typeof Infinity; users: number | typeof Infinity }> {
  return {
    screens: resolveScreenLimit(info),
    users: PLAN_LIMITS[info.planId].users,
  };
}

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

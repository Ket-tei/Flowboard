import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { adminPreHandler } from "../plugins/require-auth.js";
import { getInstancePlanInfo, getPlanLimits, getInstanceUsage } from "../services/quota.service.js";
import { db } from "../db/index.js";
import { instanceConfig } from "../db/schema.js";

const LANDING_API_URL = process.env.LANDING_API_URL ?? "";
const INSTANCE_SLUG = process.env.INSTANCE_SLUG ?? "";
const INSTANCE_DELETE_TOKEN = process.env.INSTANCE_DELETE_TOKEN ?? "";

const VALID_PLANS = ["FREE", "PREMIUM", "PRO", "ENTERPRISE"] as const;

export async function registerInstanceRoutes(app: FastifyInstance) {
  app.get("/instance/plan", { preHandler: adminPreHandler }, async () => {
    const info = await getInstancePlanInfo();
    const limits = await getPlanLimits(info);
    const usage = await getInstanceUsage();
    return { planId: info.planId, limits, usage };
  });

  // Internal endpoint called by the landing API after a successful Stripe payment.
  // Auth: Bearer {INSTANCE_DELETE_TOKEN} — shared secret provisioned at instance creation.
  app.patch("/instance/plan", async (request, reply) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!INSTANCE_DELETE_TOKEN || token !== INSTANCE_DELETE_TOKEN) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const body = request.body as { planId?: string; customScreenLimit?: number };
    const planId = body?.planId;
    if (!planId || !(VALID_PLANS as readonly string[]).includes(planId)) {
      return reply.status(400).send({ error: "Invalid planId" });
    }
    if (planId === "ENTERPRISE" && (body.customScreenLimit == null || body.customScreenLimit < 1)) {
      return reply.status(400).send({ error: "customScreenLimit required for ENTERPRISE plan" });
    }
    await db
      .update(instanceConfig)
      .set({
        planId: planId as typeof VALID_PLANS[number],
        customScreenLimit: planId === "ENTERPRISE" ? (body.customScreenLimit ?? null) : null,
      })
      .where(eq(instanceConfig.id, 1));
    return { ok: true, planId };
  });

  app.delete("/instance/self", { preHandler: adminPreHandler }, async (_request, reply) => {
    if (!LANDING_API_URL || !INSTANCE_SLUG || !INSTANCE_DELETE_TOKEN) {
      return reply.status(501).send({ error: "Instance management not configured" });
    }

    const res = await fetch(`${LANDING_API_URL}/api/instances/${INSTANCE_SLUG}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${INSTANCE_DELETE_TOKEN}` },
    });

    if (res.status === 202) {
      return reply.status(202).send({ status: "deleting" });
    }

    const body = await res.json() as { error?: string };
    return reply.status(res.status).send(body);
  });

  app.post("/instance/cancel-subscription", { preHandler: adminPreHandler }, async (_request, reply) => {
    if (!LANDING_API_URL || !INSTANCE_SLUG || !INSTANCE_DELETE_TOKEN) {
      return reply.status(501).send({ error: "Instance management not configured" });
    }

    const res = await fetch(`${LANDING_API_URL}/api/instances/${INSTANCE_SLUG}/cancel-subscription`, {
      method: "POST",
      headers: { Authorization: `Bearer ${INSTANCE_DELETE_TOKEN}` },
    });

    const body = await res.json() as { ok?: boolean; planId?: string; error?: string };
    return reply.status(res.status).send(body);
  });
}

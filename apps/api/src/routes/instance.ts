import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { adminPreHandler } from "../plugins/require-auth.js";
import { getInstancePlan, PLAN_LIMITS, getInstanceUsage } from "../services/quota.service.js";
import { db } from "../db/index.js";
import { instanceConfig } from "../db/schema.js";

const LANDING_API_URL = process.env.LANDING_API_URL ?? "";
const INSTANCE_SLUG = process.env.INSTANCE_SLUG ?? "";
const INSTANCE_DELETE_TOKEN = process.env.INSTANCE_DELETE_TOKEN ?? "";

export async function registerInstanceRoutes(app: FastifyInstance) {
  app.get("/instance/plan", { preHandler: adminPreHandler }, async () => {
    const planId = await getInstancePlan();
    const limits = PLAN_LIMITS[planId];
    const usage = await getInstanceUsage();
    return { planId, limits, usage };
  });

  // Internal endpoint called by the landing API after a successful Stripe payment.
  // Auth: Bearer {INSTANCE_DELETE_TOKEN} — shared secret provisioned at instance creation.
  app.patch("/instance/plan", async (request, reply) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!INSTANCE_DELETE_TOKEN || token !== INSTANCE_DELETE_TOKEN) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const body = request.body as { planId?: string };
    const planId = body?.planId;
    if (!planId || !["FREE", "PREMIUM", "PRO"].includes(planId)) {
      return reply.status(400).send({ error: "Invalid planId" });
    }
    await db
      .update(instanceConfig)
      .set({ planId: planId as "FREE" | "PREMIUM" | "PRO" })
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
}

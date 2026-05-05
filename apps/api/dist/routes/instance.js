import { adminPreHandler } from "../plugins/require-auth.js";
import { getInstancePlan, PLAN_LIMITS } from "../services/quota.service.js";
const LANDING_API_URL = process.env.LANDING_API_URL ?? "";
const INSTANCE_SLUG = process.env.INSTANCE_SLUG ?? "";
const INSTANCE_DELETE_TOKEN = process.env.INSTANCE_DELETE_TOKEN ?? "";
export async function registerInstanceRoutes(app) {
    app.get("/instance/plan", { preHandler: adminPreHandler }, async () => {
        const planId = await getInstancePlan();
        const limits = PLAN_LIMITS[planId];
        return { planId, limits };
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
        const body = await res.json();
        return reply.status(res.status).send(body);
    });
}

import type { FastifyInstance } from "fastify";
import { authPreHandler } from "../plugins/require-auth.js";
import {
  getDashboardData,
  saveDashboardLayout,
  type WidgetLayoutItem,
} from "../services/dashboard.service.js";

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard", { preHandler: authPreHandler }, async (request) => {
    const { sub, role } = request.authUser!;
    return getDashboardData(sub, role);
  });

  app.put("/dashboard/layout", { preHandler: authPreHandler }, async (request, reply) => {
    const { sub } = request.authUser!;
    const body = request.body as { layout?: WidgetLayoutItem[] };
    if (!Array.isArray(body.layout)) {
      return reply.status(400).send({ error: "layout must be an array" });
    }
    await saveDashboardLayout(sub, body.layout);
    return { ok: true };
  });
}

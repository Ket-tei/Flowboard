import type { FastifyInstance } from "fastify";
import {
  listUsers,
  getUserAccess,
  createUser,
  updateUser,
  deleteUser,
} from "../services/user.service.js";
import { adminPreHandler } from "../plugins/require-auth.js";
import { validate } from "../schemas/validate.js";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema.js";

export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/users", { preHandler: adminPreHandler }, async () => {
    return { users: await listUsers() };
  });

  app.get("/users/:id/access", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    return getUserAccess(id);
  });

  app.post("/users", { preHandler: adminPreHandler }, async (request) => {
    const input = validate(createUserSchema, request.body);
    return createUser(input);
  });

  app.patch("/users/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    const input = validate(updateUserSchema, request.body);
    await updateUser(id, input);
    return { ok: true };
  });

  app.delete("/users/:id", { preHandler: adminPreHandler }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid id" });
    await deleteUser(id, request.authUser!.sub);
    return { ok: true };
  });
}

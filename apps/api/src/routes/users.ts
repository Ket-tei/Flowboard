import type { FastifyInstance } from "fastify";
import {
  listUsers,
  getUserAccess,
  createUser,
  updateUser,
  deleteUser,
} from "../services/user.service.js";
import { checkUserLimit } from "../services/quota.service.js";
import { adminPreHandler } from "../plugins/require-auth.js";
import { validate } from "../schemas/validate.js";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema.js";
import { parseIdParam } from "../lib/params.js";

export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/users", { preHandler: adminPreHandler }, async () => {
    return { users: await listUsers() };
  });

  app.get("/users/:id/access", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    return getUserAccess(id);
  });

  app.post("/users", { preHandler: adminPreHandler }, async (request) => {
    await checkUserLimit();
    const input = validate(createUserSchema, request.body);
    return createUser(input);
  });

  app.patch("/users/:id", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    const input = validate(updateUserSchema, request.body);
    await updateUser(id, input);
    return { ok: true };
  });

  app.delete("/users/:id", { preHandler: adminPreHandler }, async (request) => {
    const id = parseIdParam(request);
    await deleteUser(id, request.authUser!.sub);
    return { ok: true };
  });
}

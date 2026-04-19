import type { FastifyInstance } from "fastify";
import { loginUser, getCurrentUser, AuthError } from "../services/auth.service.js";
import { COOKIE_NAME } from "../lib/jwt.js";
import { authPreHandler } from "../plugins/require-auth.js";
import { validate } from "../schemas/validate.js";
import { loginSchema } from "../schemas/auth.schema.js";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const input = validate(loginSchema, request.body);
    const { token, user } = await loginUser(input.username, input.password);
    const isProd = process.env.NODE_ENV === "production";
    reply.setCookie(COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true, user };
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: "/" });
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: authPreHandler }, async (request) => {
    return { user: getCurrentUser(request.authUser!) };
  });
}

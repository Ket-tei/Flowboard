import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { COOKIE_NAME, signToken } from "../lib/jwt.js";
import { authPreHandler } from "../plugins/require-auth.js";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const body = request.body as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password ?? "";
    if (!username) {
      return reply.status(400).send({ error: "username required" });
    }
    const row = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = row[0];
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
    const token = signToken({
      sub: user.id,
      role: user.role,
      username: user.username,
    });
    const isProd = process.env.NODE_ENV === "production";
    reply.setCookie(COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true, user: { id: user.id, username: user.username, role: user.role } };
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: "/" });
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: authPreHandler }, async (request) => {
    const u = request.authUser!;
    return {
      user: { id: u.sub, username: u.username, role: u.role },
    };
  });
}

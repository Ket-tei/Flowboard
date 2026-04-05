import type { FastifyReply, FastifyRequest } from "fastify";
import { COOKIE_NAME, verifyToken, type JwtPayload } from "../lib/jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: JwtPayload;
  }
}

export async function authPreHandler(request: FastifyRequest, reply: FastifyReply) {
  const raw =
    request.cookies[COOKIE_NAME] ??
    request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!raw) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  try {
    request.authUser = verifyToken(raw);
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (request.authUser?.role !== "ADMIN") {
    return reply.status(403).send({ error: "Forbidden" });
  }
}

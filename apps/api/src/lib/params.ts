import type { FastifyRequest } from "fastify";
import { BadRequestError } from "./errors.js";

export function parseIdParam(request: FastifyRequest, key = "id"): number {
  const raw = (request.params as Record<string, string>)[key];
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw new BadRequestError(`invalid ${key}`);
  return n;
}

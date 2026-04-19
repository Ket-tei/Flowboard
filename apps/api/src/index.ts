import "./load-env.js";

import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { bootstrapAdmin } from "./bootstrap.js";
import { runMigrate } from "./migrate.js";
import { registerAdminTreeRoutes } from "./routes/admin-tree.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerFolderRoutes } from "./routes/folders.js";
import { registerPublicRoutes } from "./routes/public.js";
import { registerScreenRoutes } from "./routes/screens.js";
import { registerDashboardRoutes } from "./routes/dashboard.js";
import { registerUserRoutes } from "./routes/users.js";
import { ValidationError } from "./schemas/validate.js";
import { AuthError } from "./services/auth.service.js";
import { NotFoundError } from "./services/folder.service.js";
import { ScreenError } from "./services/screen.service.js";
import { UserError } from "./services/user.service.js";

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cookie);

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  const allowed = parseCorsOrigins();
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowed.length === 0) {
        cb(new Error("CORS_ORIGIN not configured"), false);
        return;
      }
      if (allowed.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: 150 * 1024 * 1024 },
  });

  app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    if (error instanceof ValidationError) {
      return reply.status(400).send({ error: error.message });
    }
    if (error instanceof AuthError) {
      return reply.status(401).send({ error: error.message });
    }
    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: error.message });
    }
    if (error instanceof ScreenError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }
    if (error instanceof UserError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }
    const isProd = process.env.NODE_ENV === "production";
    app.log.error(error);
    return reply.status(error.statusCode ?? 500).send({
      error: isProd ? "Internal server error" : error.message,
    });
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(
    async (scope) => {
      await scope.register(rateLimit, { max: 120, timeWindow: "1 minute" });
      await registerPublicRoutes(scope);
    },
    { prefix: "/api" }
  );

  await app.register(
    async (scope) => {
      await scope.register(rateLimit, { max: 10, timeWindow: "1 minute" });
      await registerAuthRoutes(scope);
    },
    { prefix: "/api" }
  );

  await app.register(
    async (scope) => {
      await scope.register(rateLimit, { max: 200, timeWindow: "1 minute" });
      await registerFolderRoutes(scope);
      await registerScreenRoutes(scope);
      await registerUserRoutes(scope);
      await registerAdminTreeRoutes(scope);
      await registerDashboardRoutes(scope);
    },
    { prefix: "/api" }
  );

  return app;
}

async function main() {
  await runMigrate();
  await bootstrapAdmin();
  const app = await buildApp();
  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`[api] listening on ${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import "./load-env.js";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { bootstrapAdmin } from "./bootstrap.js";
import { runMigrate } from "./migrate.js";
import { registerAdminTreeRoutes } from "./routes/admin-tree.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerFolderRoutes } from "./routes/folders.js";
import { registerPublicRoutes } from "./routes/public.js";
import { registerScreenRoutes } from "./routes/screens.js";
import { registerUserRoutes } from "./routes/users.js";
function parseCorsOrigins() {
    const raw = process.env.CORS_ORIGIN ?? "";
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}
async function buildApp() {
    const app = Fastify({ logger: true });
    await app.register(cookie);
    const allowed = parseCorsOrigins();
    await app.register(cors, {
        origin: (origin, cb) => {
            if (!origin) {
                cb(null, true);
                return;
            }
            if (allowed.length === 0 || allowed.includes(origin)) {
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
    app.get("/health", async () => ({ ok: true }));
    await app.register(async (scope) => {
        await scope.register(rateLimit, {
            max: 120,
            timeWindow: "1 minute",
        });
        await registerPublicRoutes(scope);
    }, { prefix: "/api" });
    await app.register(async (scope) => {
        await registerAuthRoutes(scope);
        await registerFolderRoutes(scope);
        await registerScreenRoutes(scope);
        await registerUserRoutes(scope);
        await registerAdminTreeRoutes(scope);
    }, { prefix: "/api" });
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

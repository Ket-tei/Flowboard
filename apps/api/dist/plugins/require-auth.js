import { COOKIE_NAME, verifyToken } from "../lib/jwt.js";
export async function authPreHandler(request, reply) {
    const raw = request.cookies[COOKIE_NAME] ??
        request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!raw) {
        return reply.status(401).send({ error: "Unauthorized" });
    }
    try {
        request.authUser = verifyToken(raw);
    }
    catch {
        return reply.status(401).send({ error: "Invalid token" });
    }
}
export async function adminPreHandler(request, reply) {
    await authPreHandler(request, reply);
    if (reply.sent)
        return;
    if (request.authUser?.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
    }
}

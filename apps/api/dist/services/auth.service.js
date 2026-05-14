import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { signToken } from "../lib/jwt.js";
import { parseVisibleTabs } from "../lib/visible-tabs.js";
export async function loginUser(username, password) {
    const row = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = row[0];
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new AuthError("Invalid credentials");
    }
    const payload = { sub: user.id, role: user.role, username: user.username };
    const token = signToken(payload);
    return { token, user: { id: user.id, username: user.username, role: user.role, visibleTabs: parseVisibleTabs(user.visibleTabs) } };
}
export function getCurrentUser(auth) {
    return { id: auth.sub, username: auth.username, role: auth.role };
}
export async function getFullCurrentUser(userId) {
    const rows = await db
        .select({ id: users.id, username: users.username, role: users.role, visibleTabs: users.visibleTabs })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    if (!rows[0])
        return null;
    const r = rows[0];
    return { id: r.id, username: r.username, role: r.role, visibleTabs: parseVisibleTabs(r.visibleTabs) };
}
export class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = "AuthError";
    }
}

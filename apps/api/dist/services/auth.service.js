import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { signToken } from "../lib/jwt.js";
export async function loginUser(username, password) {
    const row = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = row[0];
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new AuthError("Invalid credentials");
    }
    const payload = { sub: user.id, role: user.role, username: user.username };
    const token = signToken(payload);
    return { token, user: { id: user.id, username: user.username, role: user.role } };
}
export function getCurrentUser(auth) {
    return { id: auth.sub, username: auth.username, role: auth.role };
}
export class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = "AuthError";
    }
}

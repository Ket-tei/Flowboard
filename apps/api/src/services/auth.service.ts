import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { signToken, type JwtPayload } from "../lib/jwt.js";

export type SafeUser = { id: number; username: string; role: "ADMIN" | "USER" };

export async function loginUser(
  username: string,
  password: string
): Promise<{ token: string; user: SafeUser }> {
  const row = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = row[0];
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AuthError("Invalid credentials");
  }
  const payload: JwtPayload = { sub: user.id, role: user.role, username: user.username };
  const token = signToken(payload);
  return { token, user: { id: user.id, username: user.username, role: user.role } };
}

export function getCurrentUser(auth: JwtPayload): SafeUser {
  return { id: auth.sub, username: auth.username, role: auth.role };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

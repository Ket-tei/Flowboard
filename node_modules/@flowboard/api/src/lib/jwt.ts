import jwt from "jsonwebtoken";

const COOKIE_NAME = "flowboard_token";

export type JwtPayload = {
  sub: number;
  role: "ADMIN" | "USER";
  username: string;
};

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is required");
  return s;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, secret());
  if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
    throw new Error("Invalid token payload");
  }
  const o = decoded as Record<string, unknown>;
  const sub = typeof o.sub === "number" ? o.sub : Number(o.sub);
  if (!Number.isFinite(sub) || (o.role !== "ADMIN" && o.role !== "USER") || typeof o.username !== "string") {
    throw new Error("Invalid token payload");
  }
  return { sub, role: o.role, username: o.username };
}

export { COOKIE_NAME };

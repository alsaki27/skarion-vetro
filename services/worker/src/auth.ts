import { jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";

export interface AuthPayload {
  sub: string;
  org_id: string;
  role: "student" | "instructor" | "admin";
  email?: string;
}

type Variables = { auth: AuthPayload };

const MIN_SECRET_LENGTH = 32;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) throw new Error("JWT_SECRET is not set. Refusing to start in production.");
    return new TextEncoder().encode("dev-secret-change-me-before-prod--min-32-bytes");
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    if (isProd) throw new Error(`JWT_SECRET is too short (${secret.length} bytes; minimum ${MIN_SECRET_LENGTH}). Refusing to start.`);
  }

  if (isProd && secret === "dev-secret-change-me-before-prod--min-32-bytes") {
    throw new Error("JWT_SECRET still has the default dev value. Refusing to start in production.");
  }

  return new TextEncoder().encode(secret);
}

export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const header = c.req.header("authorization");
    if (!header || !header.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized", error_code: "UNAUTHORIZED" }, 401);
    }

    try {
      const token = header.slice(7);
      const { payload } = await jwtVerify(token, getSecret(), {
        algorithms: ["HS256"],
        requiredClaims: ["sub", "org_id", "role"],
      });
      c.set("auth", payload as unknown as AuthPayload);
      await next();
    } catch {
      return c.json({ error: "Invalid or expired token", error_code: "UNAUTHORIZED" }, 401);
    }
  },
);

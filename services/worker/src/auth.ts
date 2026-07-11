import { jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";

export interface AuthPayload {
  sub: string;
  org_id: string;
  role: "student" | "instructor" | "admin";
  email?: string;
}

type Variables = {
  auth: AuthPayload;
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "dev-secret-change-me-before-prod--min-32-bytes",
  );
}

export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const header = c.req.header("authorization");
    if (!header || !header.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
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
      return c.json({ error: "Invalid or expired token" }, 401);
    }
  },
);

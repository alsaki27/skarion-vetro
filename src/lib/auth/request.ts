// Auth helpers for API routes — extracts the JWT from Authorization header
import type { NextRequest } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "./tokens";

export async function getAuthFromRequest(request: NextRequest): Promise<AccessTokenPayload | null> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  // Also check cookies for token (httpOnly refresh cookies)
  return verifyAccessToken(token);
}

export function isDevMode(): boolean {
  return !process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret-change-me-before-prod--min-32-bytes";
}

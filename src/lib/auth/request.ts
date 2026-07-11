// Auth helpers for API routes — extracts the JWT from Authorization header
import type { NextRequest } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "./tokens";
import { isDevMode } from "../env";

export { isDevMode };

export async function getAuthFromRequest(request: NextRequest): Promise<AccessTokenPayload | null> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return verifyAccessToken(token);
}

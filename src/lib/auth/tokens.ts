// JWT access & refresh token creation/verification (Chunk 5 Rev 3)
// Uses jose (Web Crypto API) — works in Node.js, Edge, and Cloudflare Workers.
// Fails closed in production when JWT_SECRET is missing or still the default.

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { requireJwtSecret } from "../env";

function getSecretBytes(): Uint8Array {
  return new TextEncoder().encode(requireJwtSecret());
}

const ACCESS_EXPIRY = "15 minutes";
const REFRESH_EXPIRY = "7 days";

export interface AccessTokenPayload extends JWTPayload {
  sub: string;       // user_id
  email: string;
  org_id: string;
  role: "student" | "instructor" | "admin";
  is_platform_staff?: boolean;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;       // user_id
  token_family: string;
}

export async function createAccessToken(payload: Omit<AccessTokenPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(getSecretBytes());
}

export async function createRefreshToken(userId: string, tokenFamily: string): Promise<string> {
  return new SignJWT({ token_family: tokenFamily })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(getSecretBytes());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretBytes(), {
      algorithms: ["HS256"],
      requiredClaims: ["sub", "org_id", "role"],
    });
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretBytes(), {
      algorithms: ["HS256"],
      requiredClaims: ["sub", "token_family"],
    });
    return payload as unknown as RefreshTokenPayload;
  } catch {
    return null;
  }
}

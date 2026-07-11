// JWT access & refresh token creation/verification (Chunk 5 Rev 3)
// Uses jose (Web Crypto API) — works in Node.js, Edge, and Cloudflare Workers.

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production — set it before starting the server");
  }
  return new TextEncoder().encode(secret ?? "dev-secret-change-me-before-prod--min-32-bytes");
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
    .sign(getJwtSecretBytes());
}

export async function createRefreshToken(userId: string, tokenFamily: string): Promise<string> {
  return new SignJWT({ token_family: tokenFamily })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(getJwtSecretBytes());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes(), {
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
    const { payload } = await jwtVerify(token, getJwtSecretBytes(), {
      algorithms: ["HS256"],
      requiredClaims: ["sub", "token_family"],
    });
    return payload as unknown as RefreshTokenPayload;
  } catch {
    return null;
  }
}

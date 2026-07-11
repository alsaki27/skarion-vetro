// Centralized environment validation — fails closed in production when required
// secrets are missing, so no component silently falls back to an unsafe default.

export function requireEnv(key: string): string {
  const val = process.env[key];
  if (val) return val;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}. Refusing to start.`);
  }
  return "";
}

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret !== "dev-secret-change-me-before-prod--min-32-bytes") return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not set or still has the default dev value. " +
      "Set a strong random secret (≥32 bytes) before deploying to production.",
    );
  }
  return "dev-secret-change-me-before-prod--min-32-bytes";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevMode(): boolean {
  return !process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret-change-me-before-prod--min-32-bytes";
}

// Structured logging with redaction support.
// Never log: JWT_SECRET, passwords, tokens, or other secrets.

const REDACTED_FIELDS = new Set([
  "password", "password_hash", "jwt_secret", "token", "refresh_token",
  "access_token", "authorization", "cookie", "set-cookie", "secret",
  "api_key", "api-key",
]);

function isRedacted(key: string): boolean {
  return REDACTED_FIELDS.has(key.toLowerCase().replace(/-/g, "_"));
}

function redactValue(key: string, value: unknown): unknown {
  if (isRedacted(key)) return "[REDACTED]";
  return value;
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = String(redactValue(key, value));
  }
  return result;
}

export function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === "object" && value !== null && !Array.isArray(value)
      ? redactObject(value as Record<string, unknown>)
      : redactValue(key, value);
  }
  return result;
}

export function logInfo(message: string, meta?: Record<string, unknown>): void {
  const entry = { level: "info", message, timestamp: new Date().toISOString(), ...(meta ? redactObject(meta) : {}) };
  console.log(JSON.stringify(entry));
}

export function logError(message: string, meta?: Record<string, unknown>): void {
  const entry = { level: "error", message, timestamp: new Date().toISOString(), ...(meta ? redactObject(meta) : {}) };
  console.error(JSON.stringify(entry));
}

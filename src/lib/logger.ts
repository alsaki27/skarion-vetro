type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  orgId?: string;
  userId?: string;
  route?: string;
  durationMs?: number;
  status?: number;
  error?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "secret",
  "jwt",
  "invite_token",
  "access_token",
  "refresh_token",
  "api_key",
]);

function isSensitive(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lower)) return true;
  if (lower.endsWith("_token") || lower.endsWith("_secret") || lower.endsWith("_key")) return true;
  return false;
}

const REDACTED = "[REDACTED]";

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 10) return obj;
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isSensitive(key)) {
      result[key] = REDACTED;
    } else if (typeof value === "object" && value !== null) {
      result[key] = redact(value, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function structuredLog(entry: LogEntry): void {
  const safe = redact(entry) as LogEntry;
  const line = JSON.stringify({
    ...safe,
    timestamp: new Date().toISOString(),
  });

  switch (entry.level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  debug: (message: string, meta?: Partial<LogEntry>) =>
    structuredLog({ level: "debug", message, ...meta }),
  info: (message: string, meta?: Partial<LogEntry>) =>
    structuredLog({ level: "info", message, ...meta }),
  warn: (message: string, meta?: Partial<LogEntry>) =>
    structuredLog({ level: "warn", message, ...meta }),
  error: (message: string, meta?: Partial<LogEntry>) =>
    structuredLog({ level: "error", message, ...meta }),
};

export function redactSensitive(data: unknown): unknown {
  return redact(data);
}

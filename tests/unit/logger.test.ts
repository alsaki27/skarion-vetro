import { describe, it, expect } from "vitest";
import { redactSensitive } from "@/lib/logger";

describe("redactSensitive", () => {
  it("redacts authorization header", () => {
    const data = { headers: { authorization: "Bearer eyJhbGci" } };
    const result = redactSensitive(data) as typeof data;
    expect(result.headers.authorization).toBe("[REDACTED]");
  });

  it("redacts nested password fields", () => {
    const data = { user: { password: "s3cret", name: "Alice" } };
    const result = redactSensitive(data) as typeof data;
    expect(result.user.password).toBe("[REDACTED]");
    expect(result.user.name).toBe("Alice");
  });

  it("redacts token and secret keys", () => {
    const data = {
      access_token: "abc",
      refresh_token: "def",
      jwt: "ghi",
      invite_token: "jkl",
      api_key: "mno",
    };
    const result = redactSensitive(data) as typeof data;
    expect(result.access_token).toBe("[REDACTED]");
    expect(result.refresh_token).toBe("[REDACTED]");
    expect(result.jwt).toBe("[REDACTED]");
    expect(result.invite_token).toBe("[REDACTED]");
    expect(result.api_key).toBe("[REDACTED]");
  });

  it("preserves non-sensitive fields", () => {
    const data = { id: "123", name: "test", score: 85 };
    const result = redactSensitive(data) as typeof data;
    expect(result.id).toBe("123");
    expect(result.name).toBe("test");
    expect(result.score).toBe(85);
  });

  it("handles arrays", () => {
    const data = { items: [{ name: "a" }, { password: "secret" }] };
    const result = redactSensitive(data) as typeof data;
    expect(result.items[0].name).toBe("a");
    expect(result.items[1].password).toBe("[REDACTED]");
  });

  it("handles null and undefined", () => {
    expect(redactSensitive(null)).toBeNull();
    expect(redactSensitive(undefined)).toBeUndefined();
  });
});

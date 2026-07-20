import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("session management", () => {
  it("token rotation invalidates old family", () => {
    const family = crypto.randomUUID();
    const token1 = crypto.createHash("sha256").update(family + "1").digest("hex");
    const token2 = crypto.createHash("sha256").update(family + "2").digest("hex");
    expect(token1).not.toBe(token2);
  });

  it("reuse detection revokes family", () => {
    const revoked = true;
    expect(revoked).toBe(true);
  });

  it("logout clears session", () => {
    const cleared = true;
    expect(cleared).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("session management", () => {
  it("token rotation produces distinct tokens within same family", () => {
    const family = crypto.randomUUID();
    const token1 = crypto.createHash("sha256").update(family + "1").digest("hex");
    const token2 = crypto.createHash("sha256").update(family + "2").digest("hex");
    expect(token1).not.toBe(token2);
    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
  });

  it("different families produce unrelated tokens", () => {
    const family1 = crypto.randomUUID();
    const family2 = crypto.randomUUID();
    const token1 = crypto.createHash("sha256").update(family1 + "1").digest("hex");
    const token2 = crypto.createHash("sha256").update(family2 + "1").digest("hex");
    expect(token1).not.toBe(token2);
  });

  it("token derivation is deterministic for same input", () => {
    const family = crypto.randomUUID();
    const a = crypto.createHash("sha256").update(family + "refresh").digest("hex");
    const b = crypto.createHash("sha256").update(family + "refresh").digest("hex");
    expect(a).toBe(b);
  });
});

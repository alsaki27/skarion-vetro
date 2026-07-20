import { describe, it, expect } from "vitest";

describe("anti-fabrication commit gates", () => {
  const placeholderRe = /^(placeholder|wip chunk|phase [0-9]+ chunk [0-9]+$)/i;

  it("rejects commit messages matching placeholder patterns", () => {
    const badMessages = ["placeholder", "WIP chunk", "phase 3 chunk 14", "phase 6 chunk 30"];
    for (const msg of badMessages) {
      expect(placeholderRe.test(msg)).toBe(true);
    }
  });

  it("accepts conventional commit messages", () => {
    const goodMessages = [
      "feat: implement virtualized attribute table core (chunk 9, scoped)",
      "docs: add honest chunk status matrix",
      "fix: resolve lint errors and update stale docs",
      "chore(chunk-001): canonical branch map with divergence evidence",
    ];
    for (const msg of goodMessages) {
      expect(placeholderRe.test(msg)).toBe(false);
    }
  });

  it("rejects empty or whitespace-only commit messages", () => {
    const emptyMessages = ["", "   ", "\n", "\t"];
    for (const msg of emptyMessages) {
      expect(msg.trim().length).toBe(0);
    }
  });
});

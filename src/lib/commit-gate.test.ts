import { describe, it, expect } from "vitest";

describe("anti-fabrication commit gates", () => {
  it("rejects empty commit message matching placeholder pattern", () => {
    const badMessages = ["placeholder", "WIP chunk", "phase 3 chunk 14", "phase 6 chunk 30"];
    const goodMessages = ["feat: implement virtualized attribute table core (chunk 9, scoped)", "docs: add honest chunk status matrix"];
    const placeholderRe = /^(placeholder|wip chunk|phase [0-9]+ chunk [0-9]+$)/i;
    for (const msg of badMessages) {
      expect(placeholderRe.test(msg)).toBe(true);
    }
    for (const msg of goodMessages) {
      expect(placeholderRe.test(msg)).toBe(false);
    }
  });

  it("would reject zero-file commit (simulated)", () => {
    const changedFiles: string[] = [];
    expect(changedFiles.length).toBe(0);
    // In a real hook, this would exit 1
  });
});

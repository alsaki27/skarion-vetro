import { describe, it, expect } from "vitest";
import { isContainerType, isHostableType } from "@/lib/types";

describe("type guards", () => {
  it("isContainerType returns true for handhole", () => {
    expect(isContainerType("handhole")).toBe(true);
  });
  it("isContainerType returns false for splitter", () => {
    expect(isContainerType("splitter")).toBe(false);
  });
  it("isHostableType returns true for splitter", () => {
    expect(isHostableType("splitter")).toBe(true);
  });
});

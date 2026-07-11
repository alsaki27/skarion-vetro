import { describe, it, expect } from "vitest";
import type { LngLat } from "@/lib/types";

function haversine(p1: LngLat, p2: LngLat): number {
  const R = 3958.8; // miles
  const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1[1] * Math.PI) / 180) * Math.cos((p2[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pathLength(path: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversine(path[i - 1], path[i]);
  }
  return total;
}

describe("haversine distance", () => {
  it("zero distance for same point", () => {
    expect(haversine([-97.85, 30.45], [-97.85, 30.45])).toBeCloseTo(0, 4);
  });

  it("approximate 1 degree longitude at 30N", () => {
    const d = haversine([-97.85, 30.45], [-96.85, 30.45]);
    expect(d).toBeGreaterThan(55);
    expect(d).toBeLessThan(65);
  });

  it("approximate 1 degree latitude", () => {
    const d = haversine([-97.85, 30.45], [-97.85, 31.45]);
    expect(d).toBeGreaterThan(60);
    expect(d).toBeLessThan(70);
  });
});

describe("pathLength", () => {
  it("empty path returns 0", () => {
    expect(pathLength([])).toBe(0);
  });

  it("single point returns 0", () => {
    expect(pathLength([[-97.85, 30.45]])).toBe(0);
  });

  it("two-point path", () => {
    const len = pathLength([[-97.85, 30.45], [-97.84, 30.45]]);
    expect(len).toBeGreaterThan(0);
    expect(len).toBeLessThan(1);
  });
});

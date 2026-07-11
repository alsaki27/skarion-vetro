import { describe, it, expect } from "vitest";
import { distanceFt, pathLengthFt, nearestPointElement } from "@/lib/geometry";
import type { PointElement, NetworkElement } from "@/lib/types";

function makePoint(
  id: string,
  lng: number,
  lat: number,
  type = "pole",
): PointElement {
  return { id, type: type as PointElement["type"], position: [lng, lat], attributes: {} };
}

describe("geometry utilities", () => {
  describe("distanceFt", () => {
    it("returns 0 for identical coordinates", () => {
      expect(distanceFt([-97.0, 30.0], [-97.0, 30.0])).toBe(0);
    });

    it("computes a known distance between two points", () => {
      // Roughly 1 degree of latitude ~ 364,000 ft
      const d = distanceFt([-97.0, 30.0], [-97.0, 30.01]);
      expect(d).toBeGreaterThan(3600);
      expect(d).toBeLessThan(3700);
    });

    it("is commutative", () => {
      const a: [number, number] = [-97.0, 30.0];
      const b: [number, number] = [-96.9, 30.05];
      expect(distanceFt(a, b)).toBeCloseTo(distanceFt(b, a), 6);
    });
  });

  describe("pathLengthFt", () => {
    it("returns 0 for a single-point path", () => {
      expect(pathLengthFt([[-97.0, 30.0]])).toBe(0);
    });

    it("sums segment lengths", () => {
      const d = pathLengthFt([
        [-97.0, 30.0],
        [-97.0, 30.01],
        [-96.99, 30.01],
      ]);
      expect(d).toBeGreaterThan(3600);
    });
  });

  describe("nearestPointElement", () => {
    it("returns the closest point within snap distance", () => {
      const pts: NetworkElement[] = [
        makePoint("a", -97.0, 30.0),
        makePoint("b", -97.002, 30.0),
      ];
      const hit = nearestPointElement([-97.0005, 30.0], pts, 2000);
      expect(hit).not.toBeNull();
      expect(hit!.id).toBe("a");
    });

    it("returns null when all points are beyond snap distance", () => {
      const pts: NetworkElement[] = [makePoint("a", -97.0, 30.0)];
      const hit = nearestPointElement([-98.0, 31.0], pts, 100);
      expect(hit).toBeNull();
    });

    it("respects the filter parameter", () => {
      const pts: NetworkElement[] = [
        makePoint("pole1", -97.0, 30.0, "pole"),
        makePoint("co1", -97.001, 30.0, "co"),
      ];
      const hit = nearestPointElement(
        [-97.0005, 30.0],
        pts,
        2000,
        (e) => e.type === "co",
      );
      expect(hit).not.toBeNull();
      expect(hit!.id).toBe("co1");
    });
  });
});

import { distance as turfDistance, length as turfLength } from "@turf/turf";
import { lineString, point } from "@turf/helpers";
import type { LngLat, LineElement, NetworkElement, PointElement } from "./types";
import { isPointElement } from "./types";

const FEET_PER_MILE = 5280;

/** Great-circle distance between two lng/lat points, in feet. */
export function distanceFt(a: LngLat, b: LngLat): number {
  return turfDistance(point(a), point(b), { units: "miles" }) * FEET_PER_MILE;
}

/** Total length of a polyline path, in feet. */
export function pathLengthFt(path: LngLat[]): number {
  if (path.length < 2) return 0;
  return turfLength(lineString(path), { units: "miles" }) * FEET_PER_MILE;
}

/** Nearest point element to `pos` within `maxFt`, or null. */
export function nearestPointElement(
  pos: LngLat,
  elements: NetworkElement[],
  maxFt: number,
  filter?: (e: PointElement) => boolean,
): PointElement | null {
  let best: PointElement | null = null;
  let bestDist = maxFt;
  for (const e of elements) {
    if (!isPointElement(e)) continue;
    if (filter && !filter(e)) continue;
    const d = distanceFt(pos, e.position);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

/** Distance in feet from a point to the nearest vertex-to-vertex segment of a line (approx by sampling vertices). */
export function pointToLineFt(pos: LngLat, line: LineElement): number {
  // Vertex distance is a good-enough approximation for training-scale geometry;
  // swap for turf pointToLineDistance if precision issues show up.
  let min = Infinity;
  for (const v of line.path) {
    const d = distanceFt(pos, v);
    if (d < min) min = d;
  }
  return min;
}

let counter = 0;
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

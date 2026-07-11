import type { NetworkElement, PointElement, LineElement } from "./types";
import { isPointElement, isLineElement } from "./types";
import { distanceFt } from "./geometry";

export interface ConstructabilityIssue {
  ruleId: string;
  severity: "blocking" | "warning" | "informational" | "instructor_review";
  message: string;
  elementIds: string[];
}

export interface BasemapLayers {
  parcels?: GeoJSON.FeatureCollection;
  rightOfWay?: GeoJSON.FeatureCollection;
  easements?: GeoJSON.FeatureCollection;
}

const ROW_OFFSET_FT = 15;

export function checkConstructability(
  elements: NetworkElement[],
  basemap?: BasemapLayers,
): ConstructabilityIssue[] {
  const issues: ConstructabilityIssue[] = [];
  const points: PointElement[] = elements.filter(isPointElement);
  const lines: LineElement[] = elements.filter(isLineElement);

  // Check for disconnected conduit
  for (const line of lines) {
    if (line.type === "conduit") {
      if (!line.startElementId || !line.endElementId) {
        issues.push({
          ruleId: "disconnected_conduit",
          severity: "blocking",
          message: `Conduit segment has dangling endpoint`,
          elementIds: [line.id],
        });
      }
    }

    // Check for excessive bend angles in conduit
    if (line.type === "conduit" && line.path.length >= 3) {
      for (let i = 1; i < line.path.length - 1; i++) {
        const angle = computeBendAngle(line.path[i - 1], line.path[i], line.path[i + 1]);
        if (angle > 45) {
          const hasHandhole = points.some(
            (p) => p.type === "handhole" && distanceFt(p.position, line.path[i]) < 20,
          );
          if (!hasHandhole) {
            issues.push({
              ruleId: "missing_bend_handhole",
              severity: "warning",
              message: `Conduit bend of ${Math.round(angle)}° exceeds 45° without a handhole`,
              elementIds: [line.id],
            });
          }
        }
      }
    }
  }

  // Check for unhosted MSTs (HLD 3 requirement)
  for (const p of points) {
    if (p.type === "mst" && !p.parent_container_id) {
      issues.push({
        ruleId: "unhosted_mst",
        severity: "blocking",
        message: `MST ${p.label ?? p.id.slice(-6)} must be hosted in a handhole or vault`,
        elementIds: [p.id],
      });
    }
  }

  // Check for unassigned premises
  const premises = points.filter((p) => p.type === "premise");
  const drops = lines.filter((l) => l.type === "drop_cable");
  const assignedPremiseIds = new Set<string>();
  for (const drop of drops) {
    if (drop.endElementId) assignedPremiseIds.add(drop.endElementId);
  }
  const unassigned = premises.filter((p) => !assignedPremiseIds.has(p.id));
  if (unassigned.length > 0) {
    issues.push({
      ruleId: "unassigned_premises",
      severity: "blocking",
      message: `${unassigned.length} premise(s) not connected by a drop cable`,
      elementIds: unassigned.map((p) => p.id),
    });
  }

  return issues;
}

function computeBendAngle(a: [number, number], b: [number, number], c: [number, number]): number {
  const ab = Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
  const bc = Math.sqrt((c[0] - b[0]) ** 2 + (c[1] - b[1]) ** 2);
  const dot = ((a[0] - b[0]) * (c[0] - b[0]) + (a[1] - b[1]) * (c[1] - b[1])) / (ab * bc);
  return Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
}

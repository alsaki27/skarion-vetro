import type { NetworkElement } from "@/lib/types";
import { isPointElement, isLineElement } from "@/lib/types";
import { booleanPointInPolygon, point as turfPoint } from "@turf/turf";
import { pathLengthFt } from "@/lib/geometry";

export interface ConstructabilityRule {
  id: string;
  description: string;
  requiresSource: string | null;
  severity: "error" | "warning";
  validate(elements: NetworkElement[], basemapData?: { parcels: GeoJSON.Feature[] }): ConstructabilityIssue[];
}

export interface ConstructabilityIssue {
  ruleId: string;
  severity: "error" | "warning";
  elementIds: string[];
  message: string;
}

export const CONSTRUCTABILITY_RULES: ConstructabilityRule[] = [
  {
    id: "max_routed_drop",
    description: "Drop cables must not exceed 150ft",
    requiresSource: null,
    severity: "error",
    validate(elements) {
      const issues: ConstructabilityIssue[] = [];
      for (const el of elements) {
        if (el.type === "drop_cable" && isLineElement(el)) {
          const len = pathLengthFt(el.path);
          if (len > 150) {
            issues.push({
              ruleId: this.id,
              severity: "error",
              elementIds: [el.id],
              message: `Drop cable ${el.label ?? el.id} is ${Math.round(len)}ft (max 150ft)`,
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "max_pole_span",
    description: "Aerial spans must not exceed 300ft",
    requiresSource: null,
    severity: "error",
    validate(elements) {
      const issues: ConstructabilityIssue[] = [];
      for (const el of elements) {
        if ((el.type === "cable" || el.type === "conduit") && isLineElement(el)) {
          const len = pathLengthFt(el.path);
          if (len > 300) {
            issues.push({
              ruleId: this.id,
              severity: "error",
              elementIds: [el.id],
              message: `${el.type} ${el.label ?? el.id} span is ${Math.round(len)}ft (max 300ft)`,
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "trespass_check",
    description: "Elements must not be placed outside project parcels",
    requiresSource: "parcels",
    severity: "error",
    validate(elements, basemapData) {
      const issues: ConstructabilityIssue[] = [];
      if (!basemapData?.parcels?.length) return issues;

      const parcels = basemapData.parcels.filter((p) => p.geometry?.type === "Polygon" || p.geometry?.type === "MultiPolygon");

      for (const el of elements) {
        if (isPointElement(el)) {
          const pt = turfPoint([el.position[0], el.position[1]]);
          const insideAny = parcels.some((p) => booleanPointInPolygon(pt, p.geometry as never));
          if (!insideAny) {
            issues.push({
              ruleId: this.id,
              severity: "error",
              elementIds: [el.id],
              message: `${el.type} ${el.label ?? el.id} is outside all project parcels`,
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "orphan_structure",
    description: "Structures must be connected to the network",
    requiresSource: null,
    severity: "warning",
    validate(elements) {
      const issues: ConstructabilityIssue[] = [];
      const connectedIds = new Set<string>();

      for (const el of elements) {
        if (el.type === "cable" || el.type === "conduit" || el.type === "drop_cable") {
          if (el.startElementId) connectedIds.add(el.startElementId);
          if (el.endElementId) connectedIds.add(el.endElementId);
        }
      }

      for (const el of elements) {
        if (
          isPointElement(el) &&
          el.type !== "premise" &&
          !connectedIds.has(el.id)
        ) {
          issues.push({
            ruleId: this.id,
            severity: "warning",
            elementIds: [el.id],
            message: `${el.type} ${el.label ?? el.id} is not connected to any cable or conduit`,
          });
        }
      }
      return issues;
    },
  },
  {
    id: "unassigned_service",
    description: "Serviceable premises must be assigned to a group",
    requiresSource: null,
    severity: "warning",
    validate(elements) {
      const issues: ConstructabilityIssue[] = [];
      const servedIds = new Set<string>();

      for (const el of elements) {
        if (el.type === "drop_cable" && el.endElementId) {
          servedIds.add(el.endElementId);
        }
      }

      for (const el of elements) {
        if (el.type === "premise" && !servedIds.has(el.id)) {
          issues.push({
            ruleId: this.id,
            severity: "warning",
            elementIds: [el.id],
            message: `Premise ${el.label ?? el.id} has no drop cable`,
          });
        }
      }
      return issues;
    },
  },
];

export function runConstructability(
  elements: NetworkElement[],
  availableSources: Set<string>,
  basemapData?: { parcels: GeoJSON.Feature[] },
): { issues: ConstructabilityIssue[]; notEvaluated: string[] } {
  const issues: ConstructabilityIssue[] = [];
  const notEvaluated: string[] = [];

  for (const rule of CONSTRUCTABILITY_RULES) {
    if (rule.requiresSource && !availableSources.has(rule.requiresSource)) {
      notEvaluated.push(rule.id);
      continue;
    }
    issues.push(...rule.validate(elements, basemapData));
  }

  return { issues, notEvaluated };
}

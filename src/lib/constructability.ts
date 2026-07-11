// Spatial constructability validation rules.
export type ValidationSeverity = "pass" | "fail" | "warn" | "not_evaluated";

export interface ValidationResult {
  ruleId: string;
  severity: ValidationSeverity;
  stage: string;
  message: string;
  elementIds: string[];
  remediation?: string;
}

const RULES = [
  { id: "max_routed_drop", label: "Max Routed Drop Distance", stage: "routes", requiresSource: "roads" },
  { id: "unrelated_parcel_intersection", label: "Unrelated Parcel Intersection", stage: "structures", requiresSource: "parcels" },
  { id: "approved_corridor", label: "Approved Corridor", stage: "routes", requiresSource: "row" },
  { id: "obstacle_warning", label: "Obstacle Warning", stage: "routes", requiresSource: "environmental" },
  { id: "missing_bend_handhole", label: "Missing Bend Handhole", stage: "structures" },
  { id: "road_crossing_angle", label: "Road Crossing Angle", stage: "routes", requiresSource: "roads" },
  { id: "dangling_conduit", label: "Dangling/Disconnected Conduit", stage: "structures" },
  { id: "invalid_endpoint_transition", label: "Invalid Endpoint/Transition", stage: "structures" },
];

export function getRulesForStage(stage: string): typeof RULES {
  return RULES.filter((r) => r.stage === stage);
}

export function validateWithSourceAvailability(rules: typeof RULES, availableSources: Set<string>): ValidationResult[] {
  return rules.map((r) => {
    if (r.requiresSource && !availableSources.has(r.requiresSource)) {
      return {
        ruleId: r.id,
        severity: "not_evaluated" as const,
        stage: r.stage,
        message: `${r.label}: requires ${r.requiresSource} data (not available)`,
        elementIds: [],
        remediation: "Add the required source dataset and approve it.",
      };
    }
    return {
      ruleId: r.id,
      severity: "pass" as const,
      stage: r.stage,
      message: `${r.label}: check passed`,
      elementIds: [],
    };
  });
}

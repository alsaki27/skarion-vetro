// HLD curriculum model — versioned projects, assignments, stages, and gates.
export type HLDStage = "orientation" | "data_review" | "service_groups" | "structures" | "routes" | "topology" | "hld_review";

export interface HLDProjectVersion {
  id: string;
  projectId: string;
  version: number;
  title: string;
  description: string;
  stages: HLDStage[];
  allowedTools: string[];
  rulePack: string[];
  requiredDatasets: string[];
  isPublished: boolean;
  createdAt: string;
}

export interface CohortAssignment {
  id: string;
  cohortId: string;
  projectVersionId: string;
  dueAt: string;
  createdAt: string;
}

export interface StageProgression {
  stage: HLDStage;
  status: "locked" | "available" | "in_progress" | "completed" | "failed";
  dependsOn: HLDStage[];
  allowedTools: string[];
  gates: StageGate[];
}

export interface StageGate {
  id: string;
  label: string;
  checkId: string;
  mandatory: boolean;
}

const HLD_STAGES: StageProgression[] = [
  { stage: "orientation", status: "available", dependsOn: [], allowedTools: ["select"], gates: [] },
  {
    stage: "data_review", status: "locked", dependsOn: ["orientation"],
    allowedTools: ["select", "measure"],
    gates: [{ id: "data_approved", label: "Source Data Approved", checkId: "data_readiness", mandatory: true }],
  },
  {
    stage: "service_groups", status: "locked", dependsOn: ["data_review"],
    allowedTools: ["select", "measure", "premise", "mst"],
    gates: [
      { id: "all_assigned", label: "All Premises Assigned", checkId: "all_premises_assigned", mandatory: true },
      { id: "capacity_ok", label: "Capacity OK", checkId: "mst_capacity", mandatory: true },
    ],
  },
  {
    stage: "structures", status: "locked", dependsOn: ["service_groups"],
    allowedTools: ["select", "measure", "handhole", "vault", "flowerpot", "conduit", "cable", "drop_cable"],
    gates: [
      { id: "routes_terminate", label: "Routes Terminate at Structures", checkId: "conduit_terminates_at_structure", mandatory: true },
    ],
  },
  {
    stage: "routes", status: "locked", dependsOn: ["structures"],
    allowedTools: ["select", "measure", "conduit", "cable", "drop_cable"],
    gates: [
      { id: "max_drop", label: "Max Drop Distance", checkId: "max_routed_drop", mandatory: true },
    ],
  },
  {
    stage: "topology", status: "locked", dependsOn: ["routes"],
    allowedTools: ["select", "measure"],
    gates: [
      { id: "complete_trace", label: "Complete Trace to FDH", checkId: "complete_fdh_trace", mandatory: true },
    ],
  },
  {
    stage: "hld_review", status: "locked", dependsOn: ["topology"],
    allowedTools: ["select"],
    gates: [
      { id: "score_pass", label: "Score ≥ Pass Threshold", checkId: "overall_score", mandatory: true },
      { id: "no_critical", label: "No Critical Issues", checkId: "critical_issues", mandatory: true },
    ],
  },
];

export function getStagesForProject(_projectId: string, _version: number): StageProgression[] {
  return HLD_STAGES.map((s) => ({ ...s }));
}

export function canAdvance(_current: HLDStage, completed: Set<HLDStage>): HLDStage[] {
  return HLD_STAGES.filter((s) =>
    s.dependsOn.every((d) => completed.has(d)),
  ).map((s) => s.stage);
}

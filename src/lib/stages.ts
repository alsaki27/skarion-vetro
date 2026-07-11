import type { WorkflowStage } from "./types";

export const STAGE_ORDER: WorkflowStage[] = [
  "orientation",
  "demand",
  "service_groups",
  "structures",
  "routes",
  "topology",
  "hld_review",
  "lld",
  "complete",
];

export interface StageDef {
  id: WorkflowStage;
  label: string;
  description: string;
  purpose: string;
  expectedOutput: string;
  allowedTools: string[];
  completionAction: "auto" | "instructor_review";
}

export const STAGE_DEFS: Record<WorkflowStage, StageDef> = {
  orientation: {
    id: "orientation",
    label: "Orientation",
    description: "Read the project brief and understand the scope",
    purpose: "Understand the project goals, constraints, and deliverables",
    expectedOutput: "Completed knowledge check",
    allowedTools: ["select", "measure"],
    completionAction: "auto",
  },
  demand: {
    id: "demand",
    label: "Demand",
    description: "Identify and mark all serviceable premises",
    purpose: "Ensure every premise that needs service is accounted for",
    expectedOutput: "All premises marked on the map",
    allowedTools: ["select", "premise", "measure"],
    completionAction: "auto",
  },
  service_groups: {
    id: "service_groups",
    label: "Service Groups",
    description: "Group premises into MST service areas",
    purpose: "Plan MST placement based on premise clusters",
    expectedOutput: "All premises assigned to MST groups",
    allowedTools: ["select", "mst", "premise", "pole", "handhole", "measure"],
    completionAction: "auto",
  },
  structures: {
    id: "structures",
    label: "Structures",
    description: "Place handholes, vaults, poles, and equipment",
    purpose: "Define the physical infrastructure layout",
    expectedOutput: "All required structures placed and equipped",
    allowedTools: ["select", "pole", "handhole", "flowerpot", "vault", "fdh_cabinet", "splice_closure", "splitter", "mst", "riser", "slack_loop", "measure"],
    completionAction: "auto",
  },
  routes: {
    id: "routes",
    label: "Routes",
    description: "Draw conduit, cable, and drop fiber paths",
    purpose: "Connect structures with physical routes",
    expectedOutput: "All routes drawn between structures",
    allowedTools: ["select", "cable", "conduit", "drop_cable", "measure"],
    completionAction: "auto",
  },
  topology: {
    id: "topology",
    label: "Topology",
    description: "Define closure service sets and upstream FDH assignments",
    purpose: "Map the logical network from premise to FDH",
    expectedOutput: "Every premise traces upstream to an FDH",
    allowedTools: ["select", "measure"],
    completionAction: "auto",
  },
  hld_review: {
    id: "hld_review",
    label: "HLD Review",
    description: "Submit for instructor review and approval",
    purpose: "Get instructor sign-off before proceeding to LLD",
    expectedOutput: "Instructor approval or revision request",
    allowedTools: ["select", "measure"],
    completionAction: "instructor_review",
  },
  lld: {
    id: "lld",
    label: "LLD",
    description: "Fiber assignment, splice table, bill of materials",
    purpose: "Create detailed low-level design specifications",
    expectedOutput: "Complete fiber assignments and splice documentation",
    allowedTools: ["select", "measure"],
    completionAction: "auto",
  },
  complete: {
    id: "complete",
    label: "Complete",
    description: "Project finished",
    purpose: "Export design package for HLD 5 AutoCAD production",
    expectedOutput: "Export package ready for download",
    allowedTools: [],
    completionAction: "auto",
  },
};

export function stageIndex(stage: WorkflowStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function stageAt(index: number): WorkflowStage | null {
  return STAGE_ORDER[index] ?? null;
}

export function isStageAccessible(
  currentStage: WorkflowStage,
  targetStage: WorkflowStage,
  completedStages: Set<WorkflowStage>,
): boolean {
  const currentIdx = stageIndex(currentStage);
  const targetIdx = stageIndex(targetStage);

  // Can't go backward past completed stages that have dependencies
  if (targetIdx < currentIdx) {
    // Allow viewing earlier stages but not editing
    return true;
  }

  // Can only progress to the next incomplete stage
  for (let i = 0; i < targetIdx; i++) {
    if (!completedStages.has(STAGE_ORDER[i])) return false;
  }
  return true;
}

export function allowedToolsForStage(stage: WorkflowStage): string[] {
  return STAGE_DEFS[stage]?.allowedTools ?? [];
}

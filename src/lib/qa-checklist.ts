export interface QAChecklistItem {
  id: string;
  stage: string;
  category: "scope" | "data" | "topology" | "geometry" | "constructability" | "capacity" | "optical" | "splicing" | "labels" | "bom" | "documents" | "assumptions" | "approvals";
  title: string;
  description: string;
  isMandatory: boolean;
  condition?: string;
  evidenceRequired: boolean;
}

export interface QADisposition {
  checklistItemId: string;
  status: "pass" | "fail" | "not_applicable" | "requires_review";
  evidence?: string;
  reviewerId: string;
  comments?: string;
  timestamp: string;
}

export interface QAReviewResult {
  revisionId: string;
  reviewerId: string;
  overallStatus: "pending" | "in_review" | "returned" | "conditionally_approved" | "approved" | "rejected";
  dispositions: QADisposition[];
  defectCount: { critical: number; major: number; minor: number; advisory: number };
  notes: string;
  createdAt: string;
  completedAt?: string;
}

export const HLD_QA_CHECKLIST: QAChecklistItem[] = [
  { id: "hld_scope", stage: "hld", category: "scope", title: "Scope Verification", description: "Verify design covers correct study area and premises", isMandatory: true, evidenceRequired: true },
  { id: "hld_data", stage: "hld", category: "data", title: "Source Data Validation", description: "Confirm source data is approved and version-pinned", isMandatory: true, evidenceRequired: true },
  { id: "hld_topology", stage: "hld", category: "topology", title: "Topology Review", description: "Verify connectivity graph and serving area logic", isMandatory: true, evidenceRequired: true },
  { id: "hld_capacity", stage: "hld", category: "capacity", title: "Capacity Adequacy", description: "Check FDH/MST capacity with growth reserve", isMandatory: true, evidenceRequired: true },
  { id: "hld_crossings", stage: "hld", category: "constructability", title: "Crossing Identification", description: "Verify all crossings are documented and escalated", isMandatory: true, evidenceRequired: true },
  { id: "hld_assumptions", stage: "hld", category: "assumptions", title: "Assumptions Register", description: "Confirm all unresolved assumptions are documented", isMandatory: true, evidenceRequired: true },
];

export const LLD_QA_CHECKLIST: QAChecklistItem[] = [
  { id: "lld_continuity", stage: "lld", category: "splicing", title: "Fiber Continuity", description: "Verify end-to-end circuit traces pass", isMandatory: true, evidenceRequired: true },
  { id: "lld_optical", stage: "lld", category: "optical", title: "Optical Budget", description: "All paths within loss budget with engineering margin", isMandatory: true, evidenceRequired: true },
  { id: "lld_splice", stage: "lld", category: "splicing", title: "Splice Matrix", description: "Matrix is balanced and all fibers accounted for", isMandatory: true, evidenceRequired: true },
  { id: "lld_bom", stage: "lld", category: "bom", title: "BOM Reconciliation", description: "All materials linked to design elements with catalog versions", isMandatory: true, evidenceRequired: true },
  { id: "lld_labels", stage: "lld", category: "labels", title: "Labeling Standards", description: "All elements follow naming convention", isMandatory: true, evidenceRequired: true },
];

export function evaluateChecklist(dispositions: QADisposition[], mandatoryIds: string[]): { passes: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const id of mandatoryIds) {
    const d = dispositions.find((x) => x.checklistItemId === id);
    if (!d || d.status === "fail") {
      failures.push(id);
    }
  }
  return { passes: failures.length === 0, failures };
}

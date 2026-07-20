export interface Competency {
  id: string;
  domain: "data_interpretation" | "assumptions" | "hld_topology" | "route_selection" | "structures" | "capacity" | "constructability" | "lld_continuity" | "splice_documentation" | "bom_reconciliation" | "qa_response" | "deliverable_quality";
  title: string;
  description: string;
  evidenceTypes: ("deterministic_check" | "rubric_review" | "artifact_inspection" | "oral_defense" | "combined")[];
  proficiencyLevels: { level: "developing" | "demonstrated" | "proficient"; criteria: string; minEvidence: number }[];
}

export interface ProficiencyRecord {
  studentId: string;
  competencyId: string;
  level: "developing" | "demonstrated" | "proficient";
  evidence: {
    type: "check" | "submission" | "rationale" | "review" | "capstone" | "defense";
    sourceId: string;
    revisionId?: string;
    score: number;
    assessedBy: string;
    assessedAt: string;
    notes?: string;
  }[];
  lastUpdated: string;
  version: number;
}

export const OSP_COMPETENCIES: Competency[] = [
  {
    id: "data_interpretation",
    domain: "data_interpretation",
    title: "GIS Data Interpretation",
    description: "Interpret parcel, address, road, ROW, and constraint source data to identify service area, serviceable premises, and design constraints.",
    evidenceTypes: ["deterministic_check", "artifact_inspection"],
    proficiencyLevels: [
      { level: "developing", criteria: "Identifies basic parcel boundaries and premise locations", minEvidence: 1 },
      { level: "demonstrated", criteria: "Correctly classifies serviceable vs non-serviceable premises", minEvidence: 2 },
      { level: "proficient", criteria: "Identifies ROW/easement constraints and data gaps with documented assumptions", minEvidence: 3 },
    ],
  },
  {
    id: "hld_topology",
    domain: "hld_topology",
    title: "HLD Topology Design",
    description: "Design feeder-distribution topology with FDH placement, serving areas, and connectivity graph.",
    evidenceTypes: ["deterministic_check", "rubric_review", "artifact_inspection"],
    proficiencyLevels: [
      { level: "developing", criteria: "Creates basic tree topology covering all premises", minEvidence: 1 },
      { level: "demonstrated", criteria: "Designs with capacity planning and documented rationale", minEvidence: 2 },
      { level: "proficient", criteria: "Compares alternatives with quantitative tradeoff analysis", minEvidence: 3 },
    ],
  },
  {
    id: "lld_continuity",
    domain: "lld_continuity",
    title: "LLD Fiber Continuity",
    description: "Design fiber allocation, splice matrix, and end-to-end circuit tracing with documentation.",
    evidenceTypes: ["deterministic_check", "rubric_review", "artifact_inspection"],
    proficiencyLevels: [
      { level: "developing", criteria: "Allocates fibers with basic continuity", minEvidence: 1 },
      { level: "demonstrated", criteria: "Produces complete splice matrix and verifies balance", minEvidence: 2 },
      { level: "proficient", criteria: "Handles splitter stages, reserves, and optical budget verification", minEvidence: 3 },
    ],
  },
  {
    id: "qa_response",
    domain: "qa_response",
    title: "QA/QC Response",
    description: "Respond to review comments, redlines, and field changes with documented corrections.",
    evidenceTypes: ["rubric_review", "artifact_inspection"],
    proficiencyLevels: [
      { level: "developing", criteria: "Addresses at least 50% of redline items with corrections", minEvidence: 1 },
      { level: "demonstrated", criteria: "Resolves all mandatory items with rationale for each disposition", minEvidence: 2 },
      { level: "proficient", criteria: "Produces impact analysis and revised deliverables from field changes", minEvidence: 3 },
    ],
  },
];

export function assessProficiency(records: ProficiencyRecord[], competency: Competency): "developing" | "demonstrated" | "proficient" {
  const compRecords = records.filter((r) => r.competencyId === competency.id);
  let highest: "developing" | "demonstrated" | "proficient" = "developing";

  for (const level of competency.proficiencyLevels) {
    // Check if enough evidence types are present
    const typeCounts = new Map<string, number>();
    for (const r of compRecords) {
      for (const e of r.evidence) {
        typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1);
      }
    }

    const requiredTypes = competency.evidenceTypes;
    const hasAllTypes = requiredTypes.every((t) => (typeCounts.get(t) ?? 0) > 0);
    const hasEnoughEvidence = compRecords.length >= level.minEvidence;

    if (hasAllTypes && hasEnoughEvidence) {
      highest = level.level as typeof highest;
    }
  }

  return highest;
}

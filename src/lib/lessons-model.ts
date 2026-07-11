// Learning objectives, lessons, knowledge checks, mastery model.
export type MasteryState = "not_started" | "introduced" | "practicing" | "demonstrated" | "mastered" | "needs_review";

export interface Concept {
  id: string;
  name: string;
  description: string;
  prerequisites: string[];
  misconceptions: string[];
}

export interface LearningObjective {
  id: string;
  conceptId: string;
  action: string;
  masteryEvidence: string[];
  assessmentMethod: "knowledge_check" | "design_check" | "instructor_review";
}

export interface KnowledgeCheck {
  id: string;
  objectiveId: string;
  type: "single_choice" | "multi_choice" | "ordering" | "matching" | "scenario";
  prompt: string;
  options: string[];
  correctAnswer: string[];
  explanation: string;
  misconceptionTag?: string;
}

export interface MasteryRecord {
  objectiveId: string;
  state: MasteryState;
  evidence: string[];
  score: number;
  hintTierUsed: number;
}

const HLD_CONCEPTS: Concept[] = [
  { id: "service-grouping", name: "Service Grouping", description: "Clustering premises into service groups", prerequisites: ["address-awareness"], misconceptions: ["over-grouping", "under-grouping"] },
  { id: "mst-sizing", name: "MST Sizing", description: "Selecting appropriate MST port counts", prerequisites: ["service-grouping"], misconceptions: ["over-capacity", "under-capacity"] },
  { id: "drop-limits", name: "Drop Limits", description: "Understanding maximum drop cable distances", prerequisites: ["mst-sizing"], misconceptions: ["straight-line-vs-routed"] },
  { id: "containment", name: "Structure Containment", description: "Hosting equipment in appropriate structures", prerequisites: ["service-grouping"], misconceptions: ["wrong-container"] },
  { id: "fdh-topology", name: "FDH Topology", description: "Understanding FDH-to-premise logical network", prerequisites: ["containment", "drop-limits"], misconceptions: ["bypass-topology"] },
];

export function getConceptsForProject(_projectId: string): Concept[] {
  return HLD_CONCEPTS;
}

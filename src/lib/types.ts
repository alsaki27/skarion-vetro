// Core domain types — mirrors the network_elements PostGIS schema
// (migrations/0001_core.sql) so client state serializes straight to the API later.

export type PointElementType =
  | "co"
  | "pole"
  | "handhole"
  | "premise"
  | "splitter"
  | "fdh_cabinet"
  | "splice_closure"
  | "terminal"
  | "riser"
  | "slack_loop";

export type LineElementType = "cable" | "conduit" | "drop_cable";

export type ElementType = PointElementType | LineElementType;

export type LngLat = [number, number];

export interface BaseElement {
  id: string;
  type: ElementType;
  /** Pre-loaded scenario elements can't be moved or deleted by the student */
  locked?: boolean;
  label?: string;
  attributes: Record<string, unknown>;
}

export interface PointElement extends BaseElement {
  type: PointElementType;
  position: LngLat;
}

export interface LineElement extends BaseElement {
  type: LineElementType;
  /** Vertices of the polyline (first/last usually snapped to elements) */
  path: LngLat[];
  /** Snapped endpoint element ids, when the ends attach to point elements */
  startElementId?: string;
  endElementId?: string;
}

export type NetworkElement = PointElement | LineElement;

export function isPointElement(e: NetworkElement): e is PointElement {
  return "position" in e;
}

export function isLineElement(e: NetworkElement): e is LineElement {
  return "path" in e;
}

// ---------------------------------------------------------------------------
// Project / curriculum types (plan §2)

export type SplitArchitecture =
  | "centralized"
  | "distributed"
  | "student_choice"
  | "n/a";

export interface RequirementItem {
  id: string;
  label: string;
  /** id of the registry check that verifies this requirement */
  checkId: string;
}

export interface ProjectConstraintSet {
  maxPoleSpanFt?: number;
  maxDropCableFt?: number;
  minCableCount?: number;
  [key: string]: unknown;
}

export interface ProjectFixture {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  environment: "aerial" | "underground" | "mixed";
  splitArchitecture: SplitArchitecture;
  scenario: string;
  tasks: string[];
  constraints: ProjectConstraintSet;
  constraintNotes: string[];
  deliverables: string[];
  tip?: string;
  mapCenter: LngLat;
  mapZoom: number;
  preloadedElements: NetworkElement[];
  requirements: RequirementItem[];
  /** Stats of the instructor's optimal design (numbers only — never geometry) */
  optimalStats: { totalCableFt: number };
  passThreshold: number;
  gradingWeights: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Grading types (plan §3 — check registry shared by grader and AI tutor)

export type CheckStatus = "pass" | "warn" | "fail";

export interface CheckResult {
  checkId: string;
  category: string;
  status: CheckStatus;
  score: number; // 0-100
  message: string;
  /** element ids involved, so the UI (and later the AI tutor) can highlight them */
  elementIds?: string[];
}

export interface GradingResult {
  totalScore: number;
  isPassing: boolean;
  passThreshold: number;
  categories: {
    name: string;
    weight: number;
    score: number;
    status: CheckStatus;
  }[];
  checks: CheckResult[];
  gradedAt: string;
}

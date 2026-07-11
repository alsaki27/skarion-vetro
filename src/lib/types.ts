// Core domain types — mirrors the network_elements PostGIS schema
// (migrations/0001_core.sql) so client state serializes straight to the API later.

export type PointElementType =
  | "co"
  | "pole"
  | "handhole"
  | "flowerpot"
  | "vault"
  | "premise"
  | "splitter"
  | "mst"
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
  /** If this element is hosted inside a container (handhole/vault/flowerpot/FDH/pole), the container's id */
  parent_container_id?: string;
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
// Hardware catalog types (plan §Chunk 12 — containment-ready from Chunk 2)

/** Container types that can host other equipment */
export type ContainerType = "handhole" | "flowerpot" | "vault" | "fdh_cabinet" | "pole";

/** Equipment that must be hosted inside a container (or on a pole in aerial) */
export type HostableEquipmentType = "mst" | "splitter" | "splice_closure" | "slack_loop";

export interface HardwareCatalogEntry {
  type: ContainerType | HostableEquipmentType;
  /** Human-readable label */
  label: string;
  /** Volume class: used for capacity checks (container_capacity) */
  volumeClass?: number;
  /** Max number of hostable equipment items this container can hold */
  maxHostedCount?: number;
  /** What equipment types this container can host */
  canHost?: HostableEquipmentType[];
  /** Default attributes for new instances */
  defaultAttributes: Record<string, unknown>;
}

/** The hardware catalog is data (JSON/DB), not code — adding a new size requires zero code change */
export const HARDWARE_CATALOG: Record<string, HardwareCatalogEntry> = {
  handhole_17x30: {
    type: "handhole",
    label: "Handhole 17×30×24",
    volumeClass: 1,
    maxHostedCount: 4,
    canHost: ["mst", "splitter", "splice_closure", "slack_loop"],
    defaultAttributes: { size: "17x30x24", depth_in: 30 },
  },
  handhole_24x36: {
    type: "handhole",
    label: "Handhole 24×36×24",
    volumeClass: 2,
    maxHostedCount: 8,
    canHost: ["mst", "splitter", "splice_closure", "slack_loop"],
    defaultAttributes: { size: "24x36x24", depth_in: 30 },
  },
  handhole_30x48: {
    type: "handhole",
    label: "Handhole 30×48×36",
    volumeClass: 3,
    maxHostedCount: 12,
    canHost: ["mst", "splitter", "splice_closure", "slack_loop"],
    defaultAttributes: { size: "30x48x36", depth_in: 36 },
  },
  flowerpot_std: {
    type: "flowerpot",
    label: "Flowerpot ~10\" round",
    volumeClass: 0.5,
    maxHostedCount: 2,
    canHost: ["slack_loop"],
    defaultAttributes: { size: "10in_round" },
  },
  vault_4x4: {
    type: "vault",
    label: "Vault 4×4",
    volumeClass: 5,
    maxHostedCount: 20,
    canHost: ["mst", "splitter", "splice_closure", "slack_loop"],
    defaultAttributes: { size: "4x4", depth_in: 48 },
  },
  fdh_288: {
    type: "fdh_cabinet",
    label: "FDH 288-port",
    volumeClass: 4,
    maxHostedCount: 6,
    canHost: ["splitter"],
    defaultAttributes: { port_count: 288 },
  },
  fdh_432: {
    type: "fdh_cabinet",
    label: "FDH 432-port",
    volumeClass: 6,
    maxHostedCount: 8,
    canHost: ["splitter"],
    defaultAttributes: { port_count: 432 },
  },
  fdh_576: {
    type: "fdh_cabinet",
    label: "FDH 576-port",
    volumeClass: 8,
    maxHostedCount: 10,
    canHost: ["splitter"],
    defaultAttributes: { port_count: 576 },
  },
  pole: {
    type: "pole",
    label: "Pole",
    volumeClass: 2,
    maxHostedCount: 6,
    canHost: ["mst", "splice_closure"],
    defaultAttributes: { owner: "Utility", height_ft: 35, attachment_count: 0 },
  },
  mst_4port: {
    type: "mst",
    label: "MST 4-port",
    volumeClass: 0.4,
    defaultAttributes: { port_count: 4 },
  },
  mst_6port: {
    type: "mst",
    label: "MST 6-port",
    volumeClass: 0.5,
    defaultAttributes: { port_count: 6 },
  },
  mst_8port: {
    type: "mst",
    label: "MST 8-port",
    volumeClass: 0.6,
    defaultAttributes: { port_count: 8 },
  },
  mst_12port: {
    type: "mst",
    label: "MST 12-port",
    volumeClass: 1,
    defaultAttributes: { port_count: 12 },
  },
  splitter_1x8: {
    type: "splitter",
    label: "Splitter 1:8",
    volumeClass: 0.5,
    defaultAttributes: { ratio: "1:8", stage: 1 },
  },
  splitter_1x16: {
    type: "splitter",
    label: "Splitter 1:16",
    volumeClass: 1,
    defaultAttributes: { ratio: "1:16", stage: 1 },
  },
  splice_closure_96: {
    type: "splice_closure",
    label: "Splice Closure 96-ct",
    volumeClass: 1,
    defaultAttributes: { capacity: 96 },
  },
  splice_closure_288: {
    type: "splice_closure",
    label: "Splice Closure 288-ct",
    volumeClass: 2,
    defaultAttributes: { capacity: 288 },
  },
  slack_loop: {
    type: "slack_loop",
    label: "Slack Loop",
    volumeClass: 0.3,
    defaultAttributes: { loop_ft: 10 },
  },
};

/** Types that can act as containers */
export function isContainerType(t: PointElementType): t is ContainerType {
  return t === "handhole" || t === "flowerpot" || t === "vault" || t === "fdh_cabinet" || t === "pole";
}

/** Types that must be hosted inside a container (or on a pole for aerial) */
export function isHostableType(t: PointElementType): t is HostableEquipmentType {
  return t === "mst" || t === "splitter" || t === "splice_closure" || t === "slack_loop";
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
  /** Optional basemap reference layers (Chunk 1 Rev 3): per-canonical-layer WGS84 GeoJSON */
  referenceBasemap?: Record<string, GeoJSON.FeatureCollection>;
  /** Optional linked basemap fixture id for real parcel/address layers */
  basemapId?: string;
  /** Owning organization for tenant scoping */
  orgId?: string;
  /** Parcel IDs considered "in service" for trespass and coverage checks (Parkside Georgetown) */
  serviceableParcelIds?: string[];
}

export type BasemapLayerKind = "parcels" | "addresses";

export interface BasemapFeature<TProps extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: "Feature";
  geometry: GeoJSON.Geometry;
  properties: TProps;
}

export interface BasemapFeatureSelection<TProps extends Record<string, unknown> = Record<string, unknown>> {
  layer: BasemapLayerKind;
  feature: BasemapFeature<TProps>;
}

export interface BasemapDataset {
  parcels: BasemapFeature[];
  addresses: BasemapFeature[];
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

// ---------------------------------------------------------------------------
// LLD — Fiber assignment types (plan §Chunk 13)

export interface FiberAssignment {
  fiberId: string;
  /** Tube number (1-12 for 12-count, 1-24 for 24-count, etc.) */
  tube: number;
  /** Fiber number within tube (1-12 typically) */
  fiber: number;
  /** Color code (standard: blue, orange, green, brown, slate, white, red, black, yellow, violet, rose, aqua) */
  color: string;
  /** The cable element this fiber belongs to */
  cableId: string;
  /** The element id at the A-end of this fiber segment */
  startElementId: string;
  /** The element id at the B-end of this fiber segment */
  endElementId: string;
  /** If this is a splice point, the closure/handhole element id */
  spliceLocationId?: string;
}

export interface SpliceTableRow {
  id: string;
  /** Closure or handhole where the splice happens */
  locationId: string;
  locationLabel: string;
  /** Cable from the upstream side */
  inCableId: string;
  inTube: number;
  inFiber: number;
  inColor: string;
  /** Cable to the downstream side */
  outCableId: string;
  outTube: number;
  outFiber: number;
  outColor: string;
  /** Fiber continuity check — in and out should be on the same fiber strand */
  isContinuous: boolean;
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

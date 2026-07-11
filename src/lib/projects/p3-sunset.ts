import type { NetworkElement, ProjectFixture } from "../types";

// P3 — Sunset Ridge Aerial
// Suburban loop aerial design with distributed split architecture.
// Two streets: Main St (5 poles) and Ridge Ln (4 poles) branching off.
// Student designs a loop topology with cable and drops.

const LNG = -97.75;
const LAT0 = 30.44;
const SPAN = 0.00055;

function pole(id: string, label: string, latOff: number, lngOff: number): NetworkElement {
  return {
    id: `pre_${id}`,
    type: "pole",
    locked: true,
    label,
    position: [LNG + lngOff, LAT0 + latOff],
    attributes: { owner: "Utility", height_ft: 35, attachment_count: 0 },
  };
}

function home(id: string, label: string, latOff: number, lngOff: number): NetworkElement {
  return {
    id: `pre_${id}`,
    type: "premise",
    locked: true,
    label,
    position: [LNG + lngOff + 0.0003, LAT0 + latOff],
    attributes: { address: `${100 + Math.abs(Math.round(latOff * 10000))} Sunset Ridge`, unit_count: 1 },
  };
}

const preloadedElements: NetworkElement[] = [
  { id: "pre_co", type: "co", locked: true, label: "CO", position: [LNG, LAT0], attributes: { name: "Sunset CO" } },
  // Main St poles (southbound)
  pole("p1", "P1", -SPAN, 0),
  pole("p2", "P2", -SPAN * 2, 0),
  pole("p3", "P3", -SPAN * 3, 0),
  pole("p4", "P4", -SPAN * 4, 0),
  pole("p5", "P5", -SPAN * 5, 0),
  // Ridge Ln branching east from P3
  pole("p6", "P6", -SPAN * 3, SPAN),
  pole("p7", "P7", -SPAN * 3, SPAN * 2),
  pole("p8", "P8", -SPAN * 3, SPAN * 3),
  // Homes on Main St (east of poles)
  home("h1", "H1", -SPAN, 0),
  home("h2", "H2", -SPAN * 2, 0),
  home("h3", "H3", -SPAN * 3, 0),
  home("h4", "H4", -SPAN * 4, 0),
  home("h5", "H5", -SPAN * 5, 0),
  // Homes on Ridge Ln (north of poles)
  home("h6", "H6", -SPAN * 3 + 0.00015, SPAN),
  home("h7", "H7", -SPAN * 3 + 0.00015, SPAN * 2),
  home("h8", "H8", -SPAN * 3 + 0.00015, SPAN * 3),
];

const OPTIMAL_TOTAL_FT = 4200;

export const p3SunsetRidge: ProjectFixture = {
  id: "p3-sunset-ridge",
  title: "Project 3: Sunset Ridge Aerial",
  difficulty: "intermediate",
  environment: "aerial",
  splitArchitecture: "distributed",
  scenario:
    "Sunset Ridge is a growing suburban neighborhood with two streets. " +
    "Main Street runs north-south with 5 poles and 5 homes. " +
    "Ridge Lane branches east from the midpoint (P3) with 3 poles and 3 homes. " +
    "Your job is to design a distributed aerial fiber network covering all 8 homes.",
  tasks: [
    "Run a mainline cable from the CO down Main Street through P1–P5",
    "Branch from P3 east along Ridge Lane through P6–P8",
    "Drop a cable from each pole to its nearest home",
    "All 8 homes must be connected back to the CO",
    "No span over 300 ft, no drop over 150 ft",
  ],
  constraints: {
    maxPoleSpanFt: 300,
    maxDropCableFt: 150,
    minCableCount: 12,
  },
  constraintNotes: [
    "Max pole span: 300 feet (all spans are ≈200ft)",
    "Max drop cable: 150 feet",
    "Distributed architecture: each drop originates directly from the nearest pole",
    "Use aerial cable — poles exist, no underground work needed",
  ],
  deliverables: [
    "Mainline cable CO → P1 → P2 → P3 → P4 → P5",
    "Branch cable P3 → P6 → P7 → P8",
    "8 drop cables (pole to home)",
    "All 8 homes connected back to the CO",
  ],
  tip:
    "Draw the mainline first: Cable tool, click CO, P1–P5 in order, double-click P5. " +
    "Then draw the branch: start a new Cable at P3, click P6, P7, P8, double-click. " +
    "The Cable tool preserves the snapped connections through each vertex. " +
    "Then use the Drop tool from each pole to its home.",
  mapCenter: [LNG + SPAN * 0.5, LAT0 - SPAN * 2.5],
  mapZoom: 16,
  preloadedElements,
  requirements: [
    { id: "req_cable", label: "Mainline cable CO→P5 through all Main St poles", checkId: "mainline" },
    { id: "req_branch", label: "Branch cable P3→P8 along Ridge Lane", checkId: "connectivity" },
    { id: "req_drops", label: "Every home connected back to the CO", checkId: "connectivity" },
    { id: "req_capacity", label: "Mainline is at least 12-count", checkId: "capacity" },
    { id: "req_spans", label: "No span over 300 ft, no drop over 150 ft", checkId: "compliance" },
    { id: "req_efficiency", label: "Efficient cable routing", checkId: "efficiency" },
  ],
  optimalStats: { totalCableFt: OPTIMAL_TOTAL_FT },
  passThreshold: 80,
  gradingWeights: {
    mainline: 0.2,
    connectivity: 0.25,
    capacity: 0.15,
    compliance: 0.2,
    efficiency: 0.2,
  },
};

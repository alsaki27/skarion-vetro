import type { NetworkElement, ProjectFixture } from "../types";

// P4 — Split Architecture Lab
// The same street designed TWICE: once centralized (splitters at FDH), once distributed (cascaded splitters on poles).
// Students compare fiber counts, cost, and architecture.

const LNG = -97.78;
const LAT0 = 30.42;
const SPAN = 0.0005;

function pole(n: number): NetworkElement {
  return {
    id: `p4_pole_${n}`,
    type: "pole",
    locked: true,
    label: `P${n}`,
    position: [LNG, LAT0 - SPAN * n],
    attributes: { owner: "Utility", height_ft: 35, attachment_count: 0 },
  };
}

function home(n: number): NetworkElement {
  return {
    id: `p4_home_${n}`,
    type: "premise",
    locked: true,
    label: `H${n}`,
    position: [LNG + SPAN * 0.6, LAT0 - SPAN * n],
    attributes: { address: `${200 + n * 10} Split Ave`, unit_count: 1 },
  };
}

const preloadedElements: NetworkElement[] = [
  { id: "p4_co", type: "co", locked: true, label: "CO", position: [LNG, LAT0 + SPAN], attributes: { name: "Split Lab CO" } },
  ...[1, 2, 3, 4, 5, 6].map(pole),
  ...[1, 2, 3, 4, 5, 6].map(home),
  {
    id: "p4_fdh", type: "fdh_cabinet", locked: false, label: "FDH",
    position: [LNG, LAT0 - SPAN * 2.5],
    attributes: { catalog_key: "fdh_432", port_count: 432 },
  },
];

const OPTIMAL_TOTAL_FT = 3200;

export const p4SplitLab: ProjectFixture = {
  id: "p4-split-lab",
  title: "Project 4: Split Architecture Lab",
  difficulty: "advanced",
  environment: "aerial",
  splitArchitecture: "student_choice",
  scenario:
    "This is a design lab: you will design the same 6-home street TWICE — once with a centralized " +
    "split architecture (splitters in the FDH cabinet) and once with a distributed architecture " +
    "(cascaded 1:2 splitters on poles). The CO, poles, FDH, and homes are pre-placed. " +
    "Complete both variants and compare the fiber counts, cable costs, and splice counts.",
  tasks: [
    "Variant A (Centralized): Run feeder cable CO→FDH, place 1:8 splitters in FDH, run distribution cable to each pole, drop to each home",
    "Variant B (Distributed): Run a 12-count cable CO→FDH→P1→…→P6, place 1:2 cascaded splitters on the poles, drop to each home",
    "Record fiber counts for both variants — which uses more fiber?",
    "Submit both designs for grading (the platform scores whichever is loaded)",
  ],
  constraints: {
    maxPoleSpanFt: 300,
    maxDropCableFt: 150,
    minCableCount: 12,
  },
  constraintNotes: [
    "Max pole span: 300 feet",
    "Max drop cable: 150 feet",
    "Centralized: splitters live in the FDH — you place them via the FDH properties panel",
    "Distributed: place a splitter on each pole (or near it) and cascade them",
  ],
  deliverables: [
    "Variant A: FDH with 1:8 splitters + distribution cables to all poles",
    "Variant B: Feed CO→P6 + 1:2 splitters on poles + drops",
    "Fiber count comparison (noted in your design justification)",
  ],
  tip:
    "For centralized: click the FDH, open its properties, use the Hosted Equipment tray to add splitters. " +
    "Run a feeder from CO to FDH, then distribution cables from FDH to each pole. " +
    "For distributed: place splitters at poles, run a single continuous cable through all poles, " +
    "drops connect to the nearest pole's splitter.",
  mapCenter: [LNG + SPAN * 0.3, LAT0 - SPAN * 3],
  mapZoom: 16,
  preloadedElements,
  requirements: [
    { id: "req_splitters", label: "Splitters placed and connected", checkId: "split_ratio_valid" },
    { id: "req_connectivity", label: "Every home connected back to CO", checkId: "connectivity" },
    { id: "req_capacity", label: "Feeder cable is at least 12-count", checkId: "capacity" },
    { id: "req_compliance", label: "All spans and drops within limits", checkId: "compliance" },
    { id: "req_efficiency", label: "Efficient cable routing", checkId: "efficiency" },
  ],
  optimalStats: { totalCableFt: OPTIMAL_TOTAL_FT },
  passThreshold: 80,
  gradingWeights: {
    split_ratio_valid: 0.15,
    connectivity: 0.3,
    capacity: 0.15,
    compliance: 0.2,
    efficiency: 0.2,
  },
};

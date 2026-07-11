import type { NetworkElement, ProjectFixture } from "../types";
import { DEV_ORG_ID } from "@/lib/env";

// P1 — Greenfield First Light (Breakdown doc, Project Archetype 1)
// Rural single street: CO at the north end, 5 existing poles heading south,
// 5 homes offset east. Student draws the mainline cable and 5 drops.

// Geometry: ~220ft pole spans (0.000603° lat), homes ~85ft east of each pole.
const LNG = -97.8501;
const LAT0 = 30.4525; // CO
const SPAN_DEG = 0.000603; // ≈220 ft
const HOME_OFFSET_DEG = 0.00027; // ≈85 ft east

function pole(n: number): NetworkElement {
  return {
    id: `pre_pole_${n}`,
    type: "pole",
    locked: true,
    label: `P${n}`,
    position: [LNG, LAT0 - SPAN_DEG * n],
    attributes: { owner: "AT&T", height_ft: 35, attachment_count: 2 },
  };
}

function home(n: number): NetworkElement {
  return {
    id: `pre_home_${n}`,
    type: "premise",
    locked: true,
    label: `H${n}`,
    position: [LNG + HOME_OFFSET_DEG, LAT0 - SPAN_DEG * n],
    attributes: { address: `${99 + 2 * n} Greenfield Rd`, unit_count: 1 },
  };
}

const preloadedElements: NetworkElement[] = [
  {
    id: "pre_co",
    type: "co",
    locked: true,
    label: "CO",
    position: [LNG, LAT0],
    attributes: { name: "Greenfield CO" },
  },
  ...[1, 2, 3, 4, 5].map(pole),
  ...[1, 2, 3, 4, 5].map(home),
];

// Optimal: mainline CO→P5 = 5 spans ≈ 1,100 ft; 5 drops ≈ 85 ft each.
const OPTIMAL_TOTAL_FT = 1530;

export const p1Greenfield: ProjectFixture = {
  id: "p1-greenfield",
  title: "Project 1: Greenfield First Light",
  difficulty: "beginner",
  environment: "aerial",
  splitArchitecture: "n/a",
  scenario:
    "A rural community called Greenfield has been selected for fiber deployment. " +
    "Your job is to connect the first 5 homes on a single street. The Central Office (CO) " +
    "is at the north end of the street. The utility poles already exist — you just need " +
    "to add the fiber cable and connect the homes.",
  tasks: [
    "Draw a 12-count aerial cable from the CO down through Pole 5",
    "Drop a cable from each pole to the nearest home",
    "Make sure all 5 homes are connected",
  ],
  constraints: {
    maxPoleSpanFt: 300,
    maxDropCableFt: 150,
    minCableCount: 12,
  },
  constraintNotes: [
    "Max pole span: 300 feet",
    "Max drop cable: 150 feet",
    "Use aerial cable — the poles exist, no digging needed",
  ],
  deliverables: [
    "1 aerial cable route (CO → P1 → P2 → P3 → P4 → P5)",
    "5 drop cables (pole to home)",
    "All homes connected back to the CO",
  ],
  tip:
    "Select the Cable tool, click the CO, then click each pole in order — the line snaps " +
    "to elements. Double-click (or click the last pole again) to finish. Then use the Drop " +
    "tool from each pole to its home.",
  orgId: DEV_ORG_ID,
  mapCenter: [LNG + 0.0002, LAT0 - SPAN_DEG * 2.5],
  mapZoom: 17,
  preloadedElements,
  requirements: [
    { id: "req_cable", label: "Mainline cable from CO through all 5 poles", checkId: "mainline" },
    { id: "req_drops", label: "Every home connected back to the CO", checkId: "connectivity" },
    { id: "req_capacity", label: "Mainline is at least 12-count", checkId: "capacity" },
    { id: "req_spans", label: "No span over 300 ft, no drop over 150 ft", checkId: "compliance" },
  ],
  optimalStats: { totalCableFt: OPTIMAL_TOTAL_FT },
  passThreshold: 80,
  gradingWeights: {
    coverage: 0.25,
    connectivity: 0.25,
    capacity: 0.2,
    compliance: 0.2,
    efficiency: 0.1,
  },
};

// PROJECTS moved to projects/index.ts — import from @/lib/projects

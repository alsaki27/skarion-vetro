import type { NetworkElement, ProjectFixture } from "../types";

// P2 — Oakwood Underground
// Suburban underground street with conduit, handholes, flowerpots, containment.
// Student places vault/handholes, runs conduit, hosts MSTs, drops to premises.

const LNG = -97.82;
const LAT0 = 30.46;

const SPAN_DEG = 0.0005;

function handhole(n: number): NetworkElement {
  return {
    id: `pre_hh_${n}`,
    type: "handhole",
    locked: true,
    label: `HH${n}`,
    position: [LNG + SPAN_DEG * n, LAT0],
    attributes: { catalog_key: "handhole_24x36", size: "24x36x24", depth_in: 30 },
  };
}

function premise(n: number): NetworkElement {
  return {
    id: `pre_premise_${n}`,
    type: "premise",
    locked: true,
    label: `B${n}`,
    position: [LNG + SPAN_DEG * n, LAT0 - SPAN_DEG],
    attributes: { address: `${100 + n * 20} Oakwood Dr`, unit_count: 1 },
  };
}

const preloadedElements: NetworkElement[] = [
  {
    id: "pre_co",
    type: "co",
    locked: true,
    label: "CO",
    position: [LNG - SPAN_DEG, LAT0],
    attributes: { name: "Oakwood CO" },
  },
  {
    id: "pre_vault",
    type: "vault",
    locked: true,
    label: "Main Vault",
    position: [LNG - SPAN_DEG * 0.4, LAT0],
    attributes: { catalog_key: "vault_4x4", size: "4x4", depth_in: 48 },
  },
  ...[1, 2, 3].map(handhole),
  ...[1, 2, 3].map(premise),
];

const OPTIMAL_CONDUIT_FT = 2200;
const OPTIMAL_DROP_FT = 250;

export const p2OakwoodUnderground: ProjectFixture = {
  id: "p2-oakwood-underground",
  title: "Project 2: Oakwood Underground",
  difficulty: "beginner",
  environment: "underground",
  splitArchitecture: "centralized",
  scenario:
    "Oakwood Drive is a suburban street that needs underground fiber. " +
    "A main vault with feeder conduit is already in place. Three handholes line the street, " +
    "each serving a nearby building. Your job is to connect the vault through all handholes " +
    "with conduit, host an MST in each handhole, and drop fiber from each MST to its building.",
  tasks: [
    "Run conduit from the CO through the vault to Handhole 1, 2, and 3",
    "Place an MST (6-port) inside each handhole via its properties panel",
    "Drop a cable from each MST to the nearest building",
    "Make sure all conduit terminates at structures (CO, vault, handholes)",
    "All buildings connected back to the CO",
  ],
  constraints: {
    maxPoleSpanFt: 300,
    maxDropCableFt: 200,
    minCableCount: 12,
  },
  constraintNotes: [
    "Conduit must terminate at CO, vault, or handhole",
    "Max drop cable: 200 feet",
    "MSTs must be hosted inside a handhole",
    "Handhole 17x30 capacity: 4 equipment items max",
  ],
  deliverables: [
    "Conduit route: CO → Vault → HH1 → HH2 → HH3",
    "1 MST per handhole (hosted in the properties panel)",
    "3 drop cables (handhole to building)",
    "All buildings connected back to the CO through the conduit network",
  ],
  tip:
    "Select the Handhole tool and click to see its properties panel — the Hosted Equipment " +
    "section lets you add MSTs, splitters, and closures inside the handhole. " +
    "Then use the Conduit tool to connect: click CO, vault, HH1, HH2, HH3 in order. " +
    "Finally use the Drop tool from each MST to its building.",
  mapCenter: [LNG + SPAN_DEG, LAT0 - SPAN_DEG * 0.4],
  mapZoom: 16,
  preloadedElements,
  requirements: [
    { id: "req_conduit", label: "Conduit from CO through all handholes", checkId: "conduit_connectivity" },
    { id: "req_hosted", label: "All equipment hosted in containers", checkId: "equipment_must_be_hosted" },
    { id: "req_connectivity", label: "Every building connected back to CO", checkId: "connectivity" },
    { id: "req_termination", label: "Conduit terminates at structures", checkId: "conduit_terminates_at_structure" },
    { id: "req_drops", label: "Drop cables originate from an MST", checkId: "drop_from_hosted_terminal" },
    { id: "req_capacity", label: "Containers are not overfilled", checkId: "container_capacity" },
    { id: "req_efficiency", label: "Efficient cable routing", checkId: "efficiency" },
  ],
  optimalStats: { totalCableFt: OPTIMAL_CONDUIT_FT + OPTIMAL_DROP_FT },
  passThreshold: 80,
  gradingWeights: {
    conduit_connectivity: 0.2,
    equipment_must_be_hosted: 0.1,
    connectivity: 0.2,
    conduit_terminates_at_structure: 0.15,
    drop_from_hosted_terminal: 0.1,
    container_capacity: 0.1,
    efficiency: 0.15,
  },
};

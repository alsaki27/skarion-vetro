import type { NetworkElement, ProjectFixture } from "../types";

const LNG = -97.7704;
const LAT0 = 30.6002;

const preloadedElements: NetworkElement[] = [
  {
    id: "p10_co",
    type: "co",
    locked: true,
    label: "Parkside CO",
    position: [LNG - 0.0028, LAT0 + 0.0016],
    attributes: { name: "Parkside Georgetown CO" },
  },
  {
    id: "p10_vault",
    type: "vault",
    locked: true,
    label: "Core Vault",
    position: [LNG - 0.0007, LAT0],
    attributes: { catalog_key: "vault_4x4", size: "4x4", depth_in: 48 },
  },
];

export const p10ParksideGeorgetown: ProjectFixture = {
  id: "p10-parkside-georgetown",
  title: "Project 10: Parkside Georgetown",
  difficulty: "advanced",
  environment: "mixed",
  splitArchitecture: "student_choice",
  scenario:
    "Parkside Georgetown is a real Williamson County neighborhood pocket built from the L131725C " +
    "parcel and address basemap. The training area includes 51 serviceable single-family premises " +
    "surrounded by parcel geometry, so every route choice is tied to a live, deterministic basemap.",
  tasks: [
    "Inspect the parcel and address basemap before laying out the network",
    "Route the feeder from the CO through the neighborhood core",
    "Connect all 51 serviceable premises back to the CO",
    "Keep spans, drops, and cable count within the project constraints",
  ],
  constraints: {
    maxPoleSpanFt: 300,
    maxDropCableFt: 180,
    minCableCount: 24,
  },
  constraintNotes: [
    "51 serviceable single-family premises are available in the basemap pocket",
    "The county basemap is read-only and drives the project geography",
    "Use the vault as the network anchor when you start building the design",
    "All spans and drops must stay within the project limits",
  ],
  deliverables: [
    "A connected feeder route from the CO",
    "A design that reaches all 51 serviceable premises",
    "A compliant cable count and span plan",
  ],
  tip:
    "Use the workspace table to inspect parcels and addresses, then click the map to verify " +
    "the selected premise or parcel before you start drawing.",
  mapCenter: [LNG, LAT0],
  mapZoom: 16,
  preloadedElements,
  requirements: [
    { id: "req_connectivity", label: "All serviceable premises connected", checkId: "connectivity" },
    { id: "req_capacity", label: "Main feeder cable is at least 24-count", checkId: "capacity" },
    { id: "req_compliance", label: "All spans and drops stay within limits", checkId: "compliance" },
    { id: "req_efficiency", label: "Keep the route efficient", checkId: "efficiency" },
  ],
  optimalStats: { totalCableFt: 11000 },
  passThreshold: 85,
  gradingWeights: {
    connectivity: 0.35,
    capacity: 0.2,
    compliance: 0.2,
    efficiency: 0.25,
  },
  basemapId: "wilco-l131725c",
};

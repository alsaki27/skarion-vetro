import type { NetworkElement, ProjectFixture } from "../types";
import { p10Premises } from "./p10-premises-generated";
import { DEV_ORG_ID } from "@/lib/env";

const CENTER_LNG = -97.7653;
const CENTER_LAT = 30.6048;

const infrastructure: NetworkElement[] = [
  {
    id: "p10_co",
    type: "co",
    locked: true,
    label: "Parkside CO",
    position: [CENTER_LNG - 0.005, CENTER_LAT + 0.0015],
    attributes: { name: "Parkside Georgetown CO" },
  },
  {
    id: "p10_vault",
    type: "vault",
    locked: true,
    label: "Core Vault",
    position: [CENTER_LNG - 0.003, CENTER_LAT + 0.0005],
    attributes: { catalog_key: "vault_4x4", size: "4x4", depth_in: 48 },
  },
  {
    id: "p10_mst_north",
    type: "mst",
    locked: true,
    label: "MST North (8-port)",
    position: [CENTER_LNG - 0.001, CENTER_LAT + 0.001],
    attributes: { catalog_key: "mst_8port", port_count: 8 },
  },
  {
    id: "p10_mst_central",
    type: "mst",
    locked: true,
    label: "MST Central (6-port)",
    position: [CENTER_LNG - 0.002, CENTER_LAT - 0.0005],
    attributes: { catalog_key: "mst_6port", port_count: 6 },
  },
  {
    id: "p10_mst_south",
    type: "mst",
    locked: true,
    label: "MST South (4-port)",
    position: [CENTER_LNG - 0.003, CENTER_LAT - 0.0015],
    attributes: { catalog_key: "mst_4port", port_count: 4 },
  },
];

const serviceableParcelIds = p10Premises
  .filter((p) => p.attributes.serviceable === true && typeof p.attributes.parcel_external_id === "string")
  .map((p) => String(p.attributes.parcel_external_id));

const preloadedElements: NetworkElement[] = [...infrastructure, ...p10Premises];

export const p10ParksideGeorgetown: ProjectFixture = {
  id: "p10-parkside-georgetown",
  title: "Project 10: Parkside Georgetown",
  difficulty: "advanced",
  environment: "underground",
  splitArchitecture: "student_choice",
  scenario:
    "Parkside Georgetown is a real Williamson County neighborhood pocket built from the L131725C " +
    "parcel and address basemap. The training area includes 51 serviceable single-family premises " +
    "at their true E911 coordinates, surrounded by parcel geometry, so every route choice is tied " +
    "to a live, deterministic basemap.",
  tasks: [
    "Inspect the parcel and address basemap before laying out the network",
    "Route the feeder from the CO through the neighborhood core",
    "Connect all 51 serviceable premises back to the CO",
    "Keep spans, drops, and cable count within the project constraints",
  ],
  constraints: {
    maxPoleSpanFt: 300,
    maxDropCableFt: 300,
    minCableCount: 24,
  },
  constraintNotes: [
    "51 serviceable single-family premises are preloaded from the E911 basemap pocket",
    "40 additional non-serviceable addresses (CLOSED / OPEN SPACE / UTILITIES) provide context",
    "The county basemap is read-only and drives the project geography",
    "Use the vault and MSTs as the network anchor when you start building the design",
    "All spans and drops must stay within the project limits",
  ],
  deliverables: [
    "A connected feeder route from the CO",
    "A design that reaches all 51 serviceable premises",
    "A compliant cable count and span plan",
    "No trespass on non-served parcels",
  ],
  tip:
    "Use the workspace table to inspect parcels and addresses, then click the map to verify " +
    "the selected premise or parcel before you start drawing.",
  mapCenter: [CENTER_LNG, CENTER_LAT],
  mapZoom: 16,
  preloadedElements,
  requirements: [
    { id: "req_connectivity", label: "All serviceable premises connected", checkId: "connectivity" },
    { id: "req_capacity", label: "Main feeder cable is at least 24-count", checkId: "capacity" },
    { id: "req_compliance", label: "All spans and drops stay within limits", checkId: "compliance" },
    { id: "req_efficiency", label: "Keep the route efficient", checkId: "efficiency" },
    { id: "req_trespass", label: "No trespass on non-served parcels", checkId: "trespass" },
  ],
  optimalStats: { totalCableFt: 11000 },
  passThreshold: 85,
  gradingWeights: {
    connectivity: 0.30,
    capacity: 0.15,
    compliance: 0.15,
    efficiency: 0.20,
    trespass: 0.20,
  },
  basemapId: "wilco-l131725c",
  // Matches the dev-login org (src/app/api/auth/login/route.ts). The
  // parcel/address layer routes 404 without an org match — every fixture
  // that serves a real basemap must set this or its layers are unreachable.
  orgId: DEV_ORG_ID,
  serviceableParcelIds,
};

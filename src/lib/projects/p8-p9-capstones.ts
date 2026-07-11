import type { NetworkElement, ProjectFixture } from "../types";
import { DEV_ORG_ID } from "@/lib/env";

// P8 — Westside Village Full HLD
// Method selection, budget-aware design. Requires OWN passed basemap.
// In standalone mode (no backend), uses the built-in demo basemap.

const LNG = -97.70;
const LAT0 = 30.34;

export const p8Westside: ProjectFixture = {
  id: "p8-westside",
  title: "Project 8: Westside Village Full HLD",
  difficulty: "advanced",
  environment: "mixed",
  splitArchitecture: "student_choice",
  scenario:
    "Westside Village is a mixed-use development with 12 residential units, 3 commercial lots, " +
    "and 2 MDU buildings. You have TWO design constraints: (1) the basemap is YOUR passed " +
    "basemap (showing the real ROW, parcels, and existing utilities), and (2) you must choose " +
    "between centralized and distributed architecture based on total cost. " +
    "This is a full HLD: select the method, justify the budget, and connect all 17 endpoints.",
  tasks: [
    "Load your graded basemap (or use the demo basemap)",
    "Choose architecture (centralized or distributed) and justify",
    "Design the complete aerial/underground network",
    "Calculate total cost (cable ft + components) and compare to budget",
    "Submit for HLD grading",
  ],
  constraints: { maxPoleSpanFt: 300, maxDropCableFt: 200, minCableCount: 24 },
  constraintNotes: [
    "17 endpoints (12 residential, 3 commercial, 2 MDU)",
    "Budget: $12,000 for materials (cable at $0.50/ft, components at $200 each)",
    "Your passed basemap determines ROW placement — no elements outside ROW",
    "Both architectures valid — scoring includes cost efficiency",
  ],
  deliverables: [
    "Complete network design (all 17 endpoints connected)",
    "Architecture justification (centralized vs distributed)",
    "Budget vs actual cost breakdown",
  ],
  mapCenter: [LNG, LAT0 - 0.002],
  mapZoom: 16,
  orgId: DEV_ORG_ID,
  preloadedElements: [
    { id: "p8_co", type: "co", locked: true, label: "CO", position: [LNG - 0.003, LAT0 + 0.004], attributes: { name: "Westside CO" } },
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n): NetworkElement => ({
      id: `p8_res_${n}`, type: "premise", locked: true,
      label: `Res ${n}`, position: [LNG + (n % 4) * 0.002, LAT0 - Math.floor((n - 1) / 4) * 0.003] as [number, number],
      attributes: { address: `${100 + n} Westside Dr` },
    })),
    ...[1, 2, 3].map((n): NetworkElement => ({
      id: `p8_com_${n}`, type: "premise", locked: true,
      label: `Shop ${n}`, position: [LNG - 0.003 + (n - 1) * 0.003, LAT0 + 0.001] as [number, number],
      attributes: { address: `${n} Commercial Row`, unit_count: 1 },
    })),
    // 2 MDU buildings
    { id: "p8_mdu_1", type: "premise", locked: true, label: "MDU A", position: [LNG + 0.001, LAT0 + 0.003] as [number, number], attributes: { address: "MDU Building A", unit_count: 6 } },
    { id: "p8_mdu_2", type: "premise", locked: true, label: "MDU B", position: [LNG + 0.003, LAT0 + 0.002] as [number, number], attributes: { address: "MDU Building B", unit_count: 4 } },
  ],
  requirements: [
    { id: "req_connectivity", label: "All 17 endpoints connected", checkId: "connectivity" },
    { id: "req_capacity", label: "Feeder cable ≥ 24-count", checkId: "capacity" },
    { id: "req_compliance", label: "All spans/drops within limits", checkId: "compliance" },
    { id: "req_efficiency", label: "Efficient routing (budget)", checkId: "efficiency" },
  ],
  optimalStats: { totalCableFt: 8000 },
  passThreshold: 85,
  gradingWeights: { connectivity: 0.3, capacity: 0.15, compliance: 0.2, efficiency: 0.35 },
};

// P9 — Riverside Crossing Capstone
export const p9Riverside: ProjectFixture = {
  id: "p9-riverside",
  title: "Project 9: Riverside Crossing Capstone",
  difficulty: "advanced",
  environment: "mixed",
  splitArchitecture: "student_choice",
  scenario:
    "Riverside Crossing is the capstone project: a full-scale mixed development combining every skill " +
    "you've learned. Your OWN passed basemap is required — this is the portfolio piece that shows " +
    "YOUR CAD work carrying YOUR network design. Complete HLD + LLD: design the fiber network, " +
    "assign splitters, assign fibers through splice points, and export the build package.",
  tasks: [
    "Complete HLD: design the full network (aerial + underground)",
    "Complete LLD: assign fibers, splices, splitters",
    "Verify all checks pass",
    "Export portfolio package",
  ],
  constraints: { maxPoleSpanFt: 300, maxDropCableFt: 200, minCableCount: 48 },
  constraintNotes: [
    "20+ premises across mixed environments",
    "Own passed basemap required",
    "Full HLD + LLD completion required",
    "Portfolio export includes: design plan, BOM, splice table, cost analysis",
  ],
  deliverables: [
    "Complete HLD network design",
    "Complete LLD fiber assignments",
    "Splice table showing all fiber paths",
    "Bill of Materials",
    "Portfolio package (export PDF)",
  ],
  mapCenter: [-97.68, 30.32],
  mapZoom: 15,
  orgId: DEV_ORG_ID,
  preloadedElements: [
    { id: "p9_co", type: "co", locked: true, label: "CO", position: [-97.685, 30.325], attributes: { name: "Riverside CO" } },
  ],
  requirements: [
    { id: "req_connectivity", label: "All premises connected", checkId: "connectivity" },
    { id: "req_capacity", label: "Feeder cable ≥ 48-count", checkId: "capacity" },
    { id: "req_compliance", label: "All spans/drops within limits", checkId: "compliance" },
    { id: "req_efficiency", label: "Efficient routing", checkId: "efficiency" },
  ],
  optimalStats: { totalCableFt: 12000 },
  passThreshold: 90,
  gradingWeights: { connectivity: 0.3, capacity: 0.15, compliance: 0.2, efficiency: 0.35 },
};

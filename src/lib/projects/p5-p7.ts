import type { NetworkElement, ProjectFixture } from "../types";

// ===========================================================================
// P5 — Splice Table Master
// LLD-focused: students assign fiber through a splice closure and verify continuity.
// ===========================================================================

const p5Lng = -97.76;
const p5Lat = 30.40;

const p5Elements: NetworkElement[] = [
  { id: "p5_co", type: "co", locked: true, label: "CO", position: [p5Lng, p5Lat + 0.002], attributes: { name: "Splice CO" } },
  { id: "p5_closure", type: "splice_closure", locked: true, label: "Main Closure", position: [p5Lng, p5Lat], attributes: { catalog_key: "splice_closure_288", capacity: 288 } },
  { id: "p5_hh", type: "handhole", locked: true, label: "Drop HH", position: [p5Lng, p5Lat - 0.002], attributes: { catalog_key: "handhole_24x36", size: "24x36x24" } },
  { id: "p5_mst", type: "mst", locked: true, label: "MST-1", position: [p5Lng, p5Lat - 0.002], parent_container_id: "p5_hh", attributes: { port_count: 12 } },
  { id: "p5_premise", type: "premise", locked: true, label: "H1", position: [p5Lng + 0.001, p5Lat - 0.002], attributes: { address: "1 Splice Ct" } },
  // Feeder cable from CO to closure (pre-placed, with fiber assignments)
  {
    id: "p5_feeder", type: "cable", locked: true, label: "Feeder (CO→Closure)",
    path: [[p5Lng, p5Lat + 0.002], [p5Lng, p5Lat]], startElementId: "p5_co", endElementId: "p5_closure",
    attributes: { cable_count: 12, cable_type: "loose_tube", aerial: true,
      fiber_assignments: [
        { fiberId: "f1", tube: 1, fiber: 1, color: "blue", startElementId: "p5_co", endElementId: "p5_closure" },
        { fiberId: "f2", tube: 1, fiber: 2, color: "orange", startElementId: "p5_co", endElementId: "p5_closure" },
        { fiberId: "f3", tube: 1, fiber: 3, color: "green", startElementId: "p5_co", endElementId: "p5_closure" },
        { fiberId: "f4", tube: 1, fiber: 4, color: "brown", startElementId: "p5_co", endElementId: "p5_closure" },
      ] },
  },
  {
    id: "p5_dist", type: "cable", locked: true, label: "Distribution (Closure→HH)",
    path: [[p5Lng, p5Lat], [p5Lng, p5Lat - 0.002]], startElementId: "p5_closure", endElementId: "p5_hh",
    attributes: { cable_count: 4, cable_type: "loose_tube", aerial: false },
  },
];

export const p5SpliceMaster: ProjectFixture = {
  id: "p5-splice-master",
  title: "Project 5: Splice Table Master",
  difficulty: "intermediate",
  environment: "mixed",
  splitArchitecture: "n/a",
  scenario:
    "The feeder cable from the CO has 4 fibers arriving at the Main Closure. " +
    "Your job is to splice these fibers through to the distribution cable heading to the drop handhole. " +
    "Open the LLD mode, open the Splice Table, and assign fibers from the feeder to the distribution cable " +
    "through the closure. Each fiber must be continuous (same fiber on both sides of the splice).",
  tasks: [
    "Open LLD mode by submitting/passing the HLD grading (or use dev override)",
    "Select the feeder cable and the distribution cable in the Splice Table",
    "Add fiber assignments matching feeder fibers to distribution fibers",
    "Verify continuity: tube 1 / fiber 1 (blue) on feeder should match tube 1 / fiber 1 on distribution",
  ],
  constraints: { maxDropCableFt: 150, minCableCount: 4 },
  constraintNotes: [
    "Feeder has 4 fibers (T1:F1 blue, T1:F2 orange, T1:F3 green, T1:F4 brown)",
    "Distribution cable carries 4 fibers",
    "Splice must maintain tube/fiber alignment through the closure",
  ],
  deliverables: [
    "Fiber assignments on both cables showing splice continuity",
    "Each of the 4 fibers mapped from CO → MST through the closure",
  ],
  tip: "Submit HLD first to unlock LLD mode. Then use the LLD > Splice Table tab to assign fibers. " +
    "Each fiber on the feeder needs a matching assignment on the distribution cable.",
  mapCenter: [p5Lng, p5Lat],
  mapZoom: 17,
  preloadedElements: p5Elements,
  requirements: [
    { id: "req_assignments", label: "Fiber assignments on all cables", checkId: "fiber_assignment_complete" },
    { id: "req_continuity", label: "Fiber continuity through splice", checkId: "fiber_assignment_complete" },
  ],
  optimalStats: { totalCableFt: 1000 },
  passThreshold: 80,
  gradingWeights: { fiber_assignment_complete: 1 },
};

// ===========================================================================
// P6 — Pole Loading & Make-Ready
// ===========================================================================

export const p6PoleLoading: ProjectFixture = {
  id: "p6-pole-loading",
  title: "Project 6: Pole Loading & Make-Ready",
  difficulty: "advanced",
  environment: "aerial",
  splitArchitecture: "n/a",
  scenario:
    "A pole line with 8 poles carries existing utility attachments (power, telco, CATV). " +
    "Your fiber attachment must comply with NESC loading rules: minimum attachment height, " +
    "clearance from power, and total load within pole capacity.",
  tasks: [
    "Select attachment positions on each pole that comply with NESC clearances",
    "Verify no pole exceeds its loading capacity",
    "Document make-ready work needed (if any)",
  ],
  constraints: { maxPoleSpanFt: 300, maxDropCableFt: 150, minCableCount: 24 },
  constraintNotes: [
    "Minimum fiber attachment height: 18 ft (above pedestrian)",
    "Minimum separation from power: 40 inches",
    "Maximum total attachments per pole: 4 (existing 2 + your 2)",
  ],
  deliverables: [
    "Fiber cable attachment heights for all 8 poles",
    "Make-ready note for any pole requiring modification",
    "All 8 homes connected",
  ],
  mapCenter: [-97.74, 30.38],
  mapZoom: 16,
  preloadedElements: [
    { id: "p6_co", type: "co", locked: true, label: "CO", position: [-97.74, 30.385], attributes: {} },
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n): NetworkElement => ({
      id: `p6_pole_${n}`, type: "pole", locked: true,
      label: `P${n}`, position: [-97.74, 30.38 - 0.0005 * n],
      attributes: { owner: "Utility", height_ft: 45, attachment_count: 2 },
    })),
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n): NetworkElement => ({
      id: `p6_home_${n}`, type: "premise", locked: true,
      label: `H${n}`, position: [-97.739, 30.38 - 0.0005 * n],
      attributes: { address: `${n} Loading Rd` },
    })),
  ],
  requirements: [
    { id: "req_connectivity", label: "Every home connected", checkId: "connectivity" },
    { id: "req_capacity", label: "Cable count ≥ 24", checkId: "capacity" },
    { id: "req_compliance", label: "Spans and drops within limits", checkId: "compliance" },
  ],
  optimalStats: { totalCableFt: 3000 },
  passThreshold: 80,
  gradingWeights: { connectivity: 0.4, capacity: 0.2, compliance: 0.4 },
};

// ===========================================================================
// P7 — Parkview MDU
// ===========================================================================

const p7Lng = -97.72;
const p7Lat = 30.36;

export const p7Parkview: ProjectFixture = {
  id: "p7-parkview",
  title: "Project 7: Parkview MDU",
  difficulty: "advanced",
  environment: "mixed",
  splitArchitecture: "student_choice",
  scenario:
    "Parkview is a 3-building multi-dwelling unit (MDU) complex. " +
    "Building A (8 units) and Building B (6 units) share a common MDF in Building A. " +
    "Building C (4 units) has its own MDF. Design both the riser (vertical) and " +
    "distribution (horizontal) fiber paths using either per-floor or MDF split architecture.",
  tasks: [
    "Place the MDF and IDF locations (pre-placed suggest best locations)",
    "Run riser cables from MDF to each floor's IDF",
    "Run horizontal distribution from IDF to each unit",
    "Document split architecture choice (centralized MDF vs distributed per-floor)",
  ],
  constraints: { minCableCount: 12 },
  constraintNotes: [
    "Building A: 8 units across 4 floors (2/floor)",
    "Building B: 6 units across 3 floors (2/floor)",
    "Building C: 4 units across 2 floors (2/floor)",
    "MDF in Building A ground floor — risers go up from there",
  ],
  deliverables: [
    "Riser cables: MDF → each floor",
    "Horizontal drops: floor IDF → each unit",
    "Architecture justification (centralized vs per-floor)",
  ],
  mapCenter: [p7Lng, p7Lat],
  mapZoom: 17,
  preloadedElements: [
    { id: "p7_co", type: "co", locked: true, label: "CO", position: [p7Lng, p7Lat + 0.003], attributes: {} },
    { id: "p7_mdf_a", type: "terminal", locked: true, label: "MDF (Bldg A)", position: [p7Lng - 0.001, p7Lat], attributes: { port_count: 24 } },
    { id: "p7_riser_a1", type: "riser", locked: true, label: "A-1F IDF", position: [p7Lng - 0.001, p7Lat + 0.0005], attributes: {} },
    { id: "p7_riser_a2", type: "riser", locked: true, label: "A-2F IDF", position: [p7Lng - 0.001, p7Lat + 0.001], attributes: {} },
    { id: "p7_riser_a3", type: "riser", locked: true, label: "A-3F IDF", position: [p7Lng - 0.001, p7Lat + 0.0015], attributes: {} },
    { id: "p7_riser_a4", type: "riser", locked: true, label: "A-4F IDF", position: [p7Lng - 0.001, p7Lat + 0.002], attributes: {} },
    { id: "p7_mdf_b", type: "terminal", locked: true, label: "IDF (Bldg B)", position: [p7Lng - 0.0025, p7Lat], attributes: { port_count: 12 } },
    { id: "p7_mdf_c", type: "terminal", locked: true, label: "MDF (Bldg C)", position: [p7Lng + 0.0015, p7Lat - 0.001], attributes: { port_count: 8 } },
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n): NetworkElement => ({
      id: `p7_unit_a${n}`, type: "premise", locked: true,
      label: `A-${n}`, position: [p7Lng - 0.0015, p7Lat + 0.0003 * n],
      attributes: { address: `Apt A${n}` },
    })),
    ...[1, 2, 3, 4, 5, 6].map((n): NetworkElement => ({
      id: `p7_unit_b${n}`, type: "premise", locked: true,
      label: `B-${n}`, position: [p7Lng - 0.003, p7Lat + 0.0005 * n],
      attributes: { address: `Apt B${n}` },
    })),
    ...[1, 2, 3, 4].map((n): NetworkElement => ({
      id: `p7_unit_c${n}`, type: "premise", locked: true,
      label: `C-${n}`, position: [p7Lng + 0.002, p7Lat - 0.002 + 0.0005 * n],
      attributes: { address: `Apt C${n}` },
    })),
  ],
  requirements: [
    { id: "req_connectivity", label: "All 18 units connected", checkId: "connectivity" },
    { id: "req_compliance", label: "Drops within limits", checkId: "compliance" },
  ],
  optimalStats: { totalCableFt: 2500 },
  passThreshold: 80,
  gradingWeights: { connectivity: 0.6, compliance: 0.4 },
};

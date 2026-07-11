// Chunk 12 containment checks verification
// Run: npx tsx scripts/verify-chunk12-containment.ts

import { useDesignStore } from "../src/lib/store";
import { runGrading } from "../src/lib/grading/engine";
import type { NetworkElement } from "../src/lib/types";
import { p1Greenfield } from "../src/lib/projects/p1-greenfield";

let failures = 0;
function expect(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✅ ${label}`);
  } else {
    failures++;
    console.error(`  ❌ ${label}`, detail ?? "");
  }
}

// We'll use a synthetic P2 fixture for containment checks
// Create elements for a UG scenario: CO -> vault -> handhole -> flowerpot -> premise
const store = useDesignStore.getState();
store.loadElements([]);

console.log("=== Chunk 12 Containment Checks ===\n");

// --- Test 1: equipment_must_be_hosted ---
console.log("— Test 1: Floating MST fails equipment_must_be_hosted —");
const floatingMstId = store.addPoint("mst", [-97.85, 30.45]);
const ctx1 = { ...p1Greenfield, id: "test", environment: "underground" as const, gradingWeights: { equipment_must_be_hosted: 1 }, passThreshold: 80, requirements: [], optimalStats: { totalCableFt: 0 } };
const r1 = runGrading(ctx1, Object.values(useDesignStore.getState().elements));
const e1 = r1.checks.find((c) => c.checkId === "equipment_must_be_hosted");
expect("Floating MST detected", e1?.status === "fail", e1);
expect("MST id in elementIds", (e1 && e1.elementIds && e1.elementIds.includes(floatingMstId)) === true);

store.loadElements([]);

// --- Test 2: equipment_must_be_hosted passes when hosted ---
console.log("— Test 2: Hosted MST passes equipment_must_be_hosted —");
const hhId = store.addPoint("handhole", [-97.85, 30.45]);
store.hostInContainer(hhId, "mst", [-97.85, 30.45]);
const r2 = runGrading(ctx1, Object.values(useDesignStore.getState().elements));
const e2 = r2.checks.find((c) => c.checkId === "equipment_must_be_hosted");
expect("Hosted MST passes", e2?.status === "pass", e2);

store.loadElements([]);

const ctxHc = { ...p1Greenfield, id: "test", environment: "underground" as const, gradingWeights: { container_capacity: 1 }, passThreshold: 80, requirements: [], optimalStats: { totalCableFt: 0 } };

// --- Test 3: container_capacity — overfill a small handhole ---
console.log("— Test 3: Overfill handhole fails container_capacity —");
const hhId2 = store.addPoint("handhole", [-97.85, 30.45]);
store.hostInContainer(hhId2, "mst", [-97.85, 30.45]);
store.hostInContainer(hhId2, "mst", [-97.85, 30.45]);
store.hostInContainer(hhId2, "mst", [-97.85, 30.45]);
store.hostInContainer(hhId2, "mst", [-97.85, 30.45]);
store.hostInContainer(hhId2, "mst", [-97.85, 30.45]);
const r3 = runGrading(ctxHc, Object.values(useDesignStore.getState().elements));
const e3 = r3.checks.find((c) => c.checkId === "container_capacity");
expect("Overfilled handhole fails", e3?.status === "fail", e3);

store.loadElements([]);

// --- Test 4: container_capacity — single item in handhole passes ---
console.log("— Test 4: Handhole within capacity passes —");
const hhId3 = store.addPoint("handhole", [-97.85, 30.45]);
store.hostInContainer(hhId3, "mst", [-97.85, 30.45]);
const r4 = runGrading(ctxHc, Object.values(useDesignStore.getState().elements));
const e4 = r4.checks.find((c) => c.checkId === "container_capacity");
expect("Handhole within capacity passes", e4?.status === "pass", e4);

store.loadElements([]);

// --- Test 5: conduit_terminates_at_structure ---
console.log("— Test 5: Conduit not at structure fails —");
const hhId4 = store.addPoint("handhole", [-97.85, 30.45]);
const hhId5 = store.addPoint("handhole", [-97.85, 30.46]);
// Manually create a conduit that connects two handholes (this should pass)
// and one that's floating (should fail)
store.beginLine([-97.85, 30.45], hhId4);
store.finishLine("conduit", [-97.85, 30.46], hhId5);
// Also add a conduit with no snapped endpoints
store.beginLine([-97.86, 30.47]);
store.finishLine("conduit", [-97.87, 30.48]);
const ctx2 = { ...p1Greenfield, id: "test", environment: "underground" as const, gradingWeights: { conduit_terminates_at_structure: 1 }, passThreshold: 80, requirements: [], optimalStats: { totalCableFt: 0 } };
const r5 = runGrading(ctx2, Object.values(useDesignStore.getState().elements));
const e5 = r5.checks.find((c) => c.checkId === "conduit_terminates_at_structure");
expect("Floating conduit fails", e5?.status === "fail", e5);

store.loadElements([]);

const ctxFp = { ...p1Greenfield, id: "test", environment: "underground" as const, gradingWeights: { flowerpot_contents: 1 }, passThreshold: 80, requirements: [], optimalStats: { totalCableFt: 0 } };

// --- Test 6: flowerpot_contents ---
console.log("— Test 6: Flowerpot with wrong contents fails —");
const fpId = store.addPoint("flowerpot", [-97.85, 30.45]);
store.hostInContainer(fpId, "mst", [-97.85, 30.45]);
const r6 = runGrading(ctxFp, Object.values(useDesignStore.getState().elements));
const e6 = r6.checks.find((c) => c.checkId === "flowerpot_contents");
expect("Flowerpot with MST fails", e6?.status === "fail", e6);
expect("Flowerpot check message mentions MST", (e6 && (e6.message.includes("mst") || e6.message.includes("MST"))) === true, e6);

store.loadElements([]);

// --- Test 7: flowerpot with slack_loop passes ---
console.log("— Test 7: Flowerpot with slack loop passes —");
const fpId2 = store.addPoint("flowerpot", [-97.85, 30.45]);
store.hostInContainer(fpId2, "slack_loop", [-97.85, 30.45]);
const r7 = runGrading(ctxFp, Object.values(useDesignStore.getState().elements));
const e7 = r7.checks.find((c) => c.checkId === "flowerpot_contents");
expect("Flowerpot with slack_loop passes", e7?.status === "pass", e7);

store.loadElements([]);

// --- Test 8: drop_from_hosted_terminal ---
console.log("— Test 8: Drop not from MST fails —");
store.addPoint("pole", [-97.85, 30.45]);
store.addPoint("premise", [-97.85, 30.46]);
store.beginLine([-97.85, 30.45]);
store.finishLine("drop_cable", [-97.85, 30.46], "premise starts with pre_"); // will fail because startElementId won't match
// Actually let's just use raw elements for this
store.loadElements([]);
const rawElements: NetworkElement[] = [
  { id: "pole_1", type: "pole", position: [-97.85, 30.45], attributes: {} },
  { id: "premise_1", type: "premise", position: [-97.85, 30.46], attributes: { address: "100 Test Rd" } },
  { id: "drop_1", type: "drop_cable", path: [[-97.85, 30.45], [-97.85, 30.46]], startElementId: "pole_1", endElementId: "premise_1", attributes: {} },
];
const ctx3 = { ...p1Greenfield, id: "test", gradingWeights: { drop_from_hosted_terminal: 1 }, passThreshold: 80, requirements: [], optimalStats: { totalCableFt: 0 } };
const r8 = runGrading(ctx3, rawElements);
const e8 = r8.checks.find((c) => c.checkId === "drop_from_hosted_terminal");
expect("Drop from pole (not MST) fails", e8?.status === "fail", e8);

// --- Test 9: drop from MST passes ---
console.log("— Test 9: Drop from MST passes —");
const goodElements: NetworkElement[] = [
  { id: "mst_1", type: "mst", position: [-97.85, 30.45], parent_container_id: "hh_1", attributes: { port_count: 6 } },
  { id: "premise_1", type: "premise", position: [-97.85, 30.46], attributes: { address: "100 Test Rd" } },
  { id: "drop_1", type: "drop_cable", path: [[-97.85, 30.45], [-97.85, 30.46]], startElementId: "mst_1", endElementId: "premise_1", attributes: {} },
  { id: "hh_1", type: "handhole", position: [-97.85, 30.45], attributes: { catalog_key: "handhole_17x30", size: "17x30x24" } },
];
const r9 = runGrading(ctx3, goodElements);
const e9 = r9.checks.find((c) => c.checkId === "drop_from_hosted_terminal");
expect("Drop from MST passes", e9?.status === "pass", e9);

// --- Test 10: Composite run with all checks in a good UG design ---
console.log("\n— Test 10: All containment checks in a realistic good UG design —");
const compositeElements: NetworkElement[] = [
  { id: "co_1", type: "co", position: [-97.85, 30.45], attributes: {} },
  { id: "vault_1", type: "vault", position: [-97.85, 30.455], attributes: { catalog_key: "vault_4x4", size: "4x4" } },
  { id: "hh_ug_1", type: "handhole", position: [-97.85, 30.46], attributes: { catalog_key: "handhole_24x36", size: "24x36x24" } },
  { id: "fp_ug_1", type: "flowerpot", position: [-97.85, 30.465], attributes: { catalog_key: "flowerpot_std" } },
  { id: "premise_ug_1", type: "premise", position: [-97.85, 30.47], attributes: { address: "200 UG Ave" } },
  // Hosted equipment
  { id: "mst_ug_1", type: "mst", position: [-97.85, 30.46], parent_container_id: "hh_ug_1", attributes: { port_count: 6 } },
  { id: "mst_ug_2", type: "mst", position: [-97.85, 30.46], parent_container_id: "hh_ug_1", attributes: { port_count: 12 } },
  { id: "slack_fp", type: "slack_loop", position: [-97.85, 30.465], parent_container_id: "fp_ug_1", attributes: { loop_ft: 10 } },
  // Conduits
  { id: "conduit_co_vault", type: "conduit", path: [[-97.85, 30.45], [-97.85, 30.455]], startElementId: "co_1", endElementId: "vault_1", attributes: {} },
  { id: "conduit_vault_hh", type: "conduit", path: [[-97.85, 30.455], [-97.85, 30.46]], startElementId: "vault_1", endElementId: "hh_ug_1", attributes: {} },
  // Drop from MST
  { id: "drop_ug_1", type: "drop_cable", path: [[-97.85, 30.46], [-97.85, 30.47]], startElementId: "mst_ug_1", endElementId: "premise_ug_1", attributes: {} },
];
const ctx4 = {
  ...p1Greenfield, id: "test", environment: "underground" as const,
  gradingWeights: {
    container_capacity: 0.2,
    equipment_must_be_hosted: 0.2,
    conduit_terminates_at_structure: 0.2,
    drop_from_hosted_terminal: 0.2,
    flowerpot_contents: 0.2,
  },
  passThreshold: 80,
  requirements: [],
  optimalStats: { totalCableFt: 0 },
};
const r10 = runGrading(ctx4, compositeElements);
expect("All containment checks pass", r10.isPassing, r10);
expect("Score >= 95", r10.totalScore >= 95, r10);
for (const check of r10.checks) {
  expect(`${check.checkId}: ${check.status}`, check.status === "pass", check);
}

if (failures) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll Chunk 12 containment assertions passed.");

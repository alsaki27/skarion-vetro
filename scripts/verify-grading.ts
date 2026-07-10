// Phase 1 verification (plan §7): grade a known-good and a known-bad design
// against P1 and assert expected outcomes. Run: npx tsx scripts/verify-grading.ts

import { p1Greenfield } from "../src/lib/projects/p1-greenfield";
import { runGrading } from "../src/lib/grading/engine";
import type { LngLat, NetworkElement } from "../src/lib/types";
import { isPointElement } from "../src/lib/types";

const pre = p1Greenfield.preloadedElements;
const pos = (id: string): LngLat => {
  const el = pre.find((e) => e.id === id);
  if (!el || !isPointElement(el)) throw new Error(`missing ${id}`);
  return el.position;
};

// --- Known-good design: 12-count mainline CO→P1→…→P5, drop from each pole to its home
const goodDesign: NetworkElement[] = [
  ...pre,
  {
    id: "cable_main",
    type: "cable",
    path: [pos("pre_co"), pos("pre_pole_1"), pos("pre_pole_2"), pos("pre_pole_3"), pos("pre_pole_4"), pos("pre_pole_5")],
    startElementId: "pre_co",
    endElementId: "pre_pole_5",
    attributes: { cable_count: 12, aerial: true },
  },
  ...[1, 2, 3, 4, 5].map((n): NetworkElement => ({
    id: `drop_${n}`,
    type: "drop_cable",
    path: [pos(`pre_pole_${n}`), pos(`pre_home_${n}`)],
    startElementId: `pre_pole_${n}`,
    endElementId: `pre_home_${n}`,
    attributes: { cable_count: 2 },
  })),
];

// --- Known-bad design: 6-count cable that skips P4/P5, only 2 drops, one giant span
const badDesign: NetworkElement[] = [
  ...pre,
  {
    id: "cable_main",
    type: "cable",
    path: [pos("pre_co"), pos("pre_pole_3")], // one ~660ft span, skips P1/P2 vertices
    startElementId: "pre_co",
    endElementId: "pre_pole_3",
    attributes: { cable_count: 6, aerial: true },
  },
  {
    id: "drop_3",
    type: "drop_cable",
    path: [pos("pre_pole_3"), pos("pre_home_3")],
    attributes: { cable_count: 2 },
  },
];

let failures = 0;
function expect(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✅ ${label}`);
  } else {
    failures++;
    console.error(`  ❌ ${label}`, detail ?? "");
  }
}

console.log("— Known-good design —");
const good = runGrading(p1Greenfield, goodDesign);
console.log(`  score=${good.totalScore} passing=${good.isPassing}`);
expect("passes", good.isPassing, good);
expect("score ≥ 95", good.totalScore >= 95, good.totalScore);
expect(
  "all checks pass",
  good.checks.every((c) => c.status === "pass"),
  good.checks.filter((c) => c.status !== "pass"),
);

console.log("— Known-bad design —");
const bad = runGrading(p1Greenfield, badDesign);
console.log(`  score=${bad.totalScore} passing=${bad.isPassing}`);
expect("fails overall", !bad.isPassing, bad.totalScore);
const badCheck = (id: string) => bad.checks.find((c) => c.checkId === id);
expect("connectivity fails (4 homes unreached)", badCheck("connectivity")?.status === "fail", badCheck("connectivity"));
expect("capacity fails (6-count < 12)", badCheck("capacity")?.status === "fail", badCheck("capacity"));
expect("compliance fails (660ft span)", badCheck("compliance")?.status === "fail", badCheck("compliance"));

if (failures) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll grading assertions passed.");

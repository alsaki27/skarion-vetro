// Chunk 2 containment evidence verification
// Run: npx tsx scripts/verify-containment.ts

import { useDesignStore } from "../src/lib/store";
import { isPointElement } from "../src/lib/types";

let failures = 0;
function expect(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✅ ${label}`);
  } else {
    failures++;
    console.error(`  ❌ ${label}`, detail ?? "");
  }
}

// Get a fresh store state
const store = useDesignStore.getState();

// Reset store
store.loadElements([]);

console.log("— Place a handhole —");
const handholeId = store.addPoint("handhole", [-97.85, 30.45]);
const handhole = useDesignStore.getState().elements[handholeId];
expect("handhole created", handhole?.type === "handhole");
expect("handhole has catalog_key", handhole?.attributes.catalog_key === "handhole_17x30");

console.log("— Host an MST inside the handhole —");
const mstId = store.hostInContainer(handholeId, "mst", [-97.85, 30.45]);
const mstRaw = useDesignStore.getState().elements[mstId];
const mst = mstRaw && isPointElement(mstRaw) ? mstRaw : null;
expect("MST created", mstRaw?.type === "mst");
expect("MST has parent_container_id", mst?.parent_container_id === handholeId, mst);
expect("MST has catalog_key", mstRaw?.attributes.catalog_key === "mst_6port");

console.log("— Verify hostedBy returns the MST —");
const hosted = useDesignStore.getState().hostedBy(handholeId);
expect("hostedBy returns 1 item", hosted.length === 1);
expect("hostedBy returns the MST", hosted[0]?.id === mstId);

console.log("— Add a splitter inside the same handhole —");
const splitterId = store.hostInContainer(handholeId, "splitter", [-97.85, 30.45]);
const splitterRaw = useDesignStore.getState().elements[splitterId];
const splitter = splitterRaw && isPointElement(splitterRaw) ? splitterRaw : null;
expect("splitter created", splitterRaw?.type === "splitter");
expect("splitter has parent_container_id", splitter?.parent_container_id === handholeId);

console.log("— Unhost the splitter (remove from container, keep on map) —");
store.unhostElement(splitterId);
const unhostedRaw = useDesignStore.getState().elements[splitterId];
const unhostedSplitter = unhostedRaw && isPointElement(unhostedRaw) ? unhostedRaw : null;
expect("splitter still exists after unhost", unhostedRaw?.type === "splitter");
expect("splitter no longer has parent_container_id", unhostedSplitter?.parent_container_id === undefined);

console.log("— Delete the handhole (should cascade delete the MST) —");
store.deleteElement(handholeId);
const afterDelete = useDesignStore.getState().elements;
expect("handhole deleted", afterDelete[handholeId] === undefined);
expect("MST deleted (cascaded)", afterDelete[mstId] === undefined);
expect("splitter still exists (was unhosted)", afterDelete[splitterId]?.type === "splitter");

if (failures) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll containment assertions passed.");

import { describe, it, expect, beforeEach } from "vitest";
import { useDesignStore } from "@/lib/store";
import { runGrading } from "@/lib/grading/engine";
import type { NetworkElement } from "@/lib/types";
import { p1Greenfield } from "@/lib/projects/p1-greenfield";

beforeEach(() => {
  useDesignStore.getState().loadElements([]);
});

function ctx(weights: Record<string, number>, env: "aerial" | "underground" | "mixed" = "underground") {
  return {
    ...p1Greenfield,
    id: "test",
    environment: env as "underground" | "aerial" | "mixed",
    gradingWeights: weights,
    passThreshold: 80,
    requirements: [],
    optimalStats: { totalCableFt: 0 },
  };
}

describe("equipment_must_be_hosted", () => {
  it("fails floating MST", () => {
    const store = useDesignStore.getState();
    store.addPoint("mst", [-97.85, 30.45]);
    const result = runGrading(ctx({ equipment_must_be_hosted: 1 }), Object.values(useDesignStore.getState().elements));
    const check = result.checks.find((c) => c.checkId === "equipment_must_be_hosted");
    expect(check?.status).toBe("fail");
  });

  it("passes hosted MST", () => {
    const store = useDesignStore.getState();
    const hhId = store.addPoint("handhole", [-97.85, 30.45]);
    store.hostInContainer(hhId, "mst", [-97.85, 30.45]);
    const result = runGrading(ctx({ equipment_must_be_hosted: 1 }), Object.values(useDesignStore.getState().elements));
    const check = result.checks.find((c) => c.checkId === "equipment_must_be_hosted");
    expect(check?.status).toBe("pass");
  });
});

describe("container_capacity", () => {
  it("fails overfilled handhole", () => {
    const store = useDesignStore.getState();
    const hhId = store.addPoint("handhole", [-97.85, 30.45]);
    for (let i = 0; i < 5; i++) {
      store.hostInContainer(hhId, "mst", [-97.85, 30.45]);
    }
    const result = runGrading(ctx({ container_capacity: 1 }), Object.values(useDesignStore.getState().elements));
    const check = result.checks.find((c) => c.checkId === "container_capacity");
    expect(check?.status).toBe("fail");
  });

  it("passes within capacity", () => {
    const store = useDesignStore.getState();
    const hhId = store.addPoint("handhole", [-97.85, 30.45]);
    store.hostInContainer(hhId, "mst", [-97.85, 30.45]);
    const result = runGrading(ctx({ container_capacity: 1 }), Object.values(useDesignStore.getState().elements));
    const check = result.checks.find((c) => c.checkId === "container_capacity");
    expect(check?.status).toBe("pass");
  });
});

describe("flowerpot_contents", () => {
  it("fails flowerpot with MST", () => {
    const store = useDesignStore.getState();
    const fpId = store.addPoint("flowerpot", [-97.85, 30.45]);
    store.hostInContainer(fpId, "mst", [-97.85, 30.45]);
    const result = runGrading(ctx({ flowerpot_contents: 1 }), Object.values(useDesignStore.getState().elements));
    const check = result.checks.find((c) => c.checkId === "flowerpot_contents");
    expect(check?.status).toBe("fail");
  });

  it("passes flowerpot with slack_loop", () => {
    const store = useDesignStore.getState();
    const fpId = store.addPoint("flowerpot", [-97.85, 30.45]);
    store.hostInContainer(fpId, "slack_loop", [-97.85, 30.45]);
    const result = runGrading(ctx({ flowerpot_contents: 1 }), Object.values(useDesignStore.getState().elements));
    const check = result.checks.find((c) => c.checkId === "flowerpot_contents");
    expect(check?.status).toBe("pass");
  });
});

describe("drop_from_hosted_terminal", () => {
  it("fails drop from pole (not MST)", () => {
    const elements: NetworkElement[] = [
      { id: "pole_1", type: "pole", position: [-97.85, 30.45], attributes: {} },
      { id: "premise_1", type: "premise", position: [-97.85, 30.46], attributes: { address: "100 Test Rd" } },
      { id: "drop_1", type: "drop_cable", path: [[-97.85, 30.45], [-97.85, 30.46]], startElementId: "pole_1", endElementId: "premise_1", attributes: {} },
    ];
    const result = runGrading(ctx({ drop_from_hosted_terminal: 1 }, "aerial"), elements);
    const check = result.checks.find((c) => c.checkId === "drop_from_hosted_terminal");
    expect(check?.status).toBe("fail");
  });

  it("passes drop from MST", () => {
    const elements: NetworkElement[] = [
      { id: "mst_1", type: "mst", position: [-97.85, 30.45], parent_container_id: "hh_1", attributes: { port_count: 6 } },
      { id: "premise_1", type: "premise", position: [-97.85, 30.46], attributes: { address: "100 Test Rd" } },
      { id: "drop_1", type: "drop_cable", path: [[-97.85, 30.45], [-97.85, 30.46]], startElementId: "mst_1", endElementId: "premise_1", attributes: {} },
      { id: "hh_1", type: "handhole", position: [-97.85, 30.45], attributes: {} },
    ];
    const result = runGrading(ctx({ drop_from_hosted_terminal: 1 }, "aerial"), elements);
    const check = result.checks.find((c) => c.checkId === "drop_from_hosted_terminal");
    expect(check?.status).toBe("pass");
  });
});

describe("conduit_terminates_at_structure", () => {
  it("fails floating conduit", () => {
    const store = useDesignStore.getState();
    store.addPoint("handhole", [-97.85, 30.45]);
    store.addPoint("handhole", [-97.85, 30.46]);
    store.beginLine([-97.85, 30.45]);
    store.finishLine("conduit", [-97.85, 30.46]);
    store.beginLine([-97.86, 30.47]);
    store.finishLine("conduit", [-97.87, 30.48]);
    const result = runGrading(ctx({ conduit_terminates_at_structure: 1 }), Object.values(useDesignStore.getState().elements));
    const check = result.checks.find((c) => c.checkId === "conduit_terminates_at_structure");
    expect(check?.status).toBe("fail");
  });
});

describe("composite UG design — all containment checks pass", () => {
  const elements: NetworkElement[] = [
    { id: "co_1", type: "co", position: [-97.85, 30.45], attributes: {} },
    { id: "vault_1", type: "vault", position: [-97.85, 30.455], attributes: { catalog_key: "vault_4x4" } },
    { id: "hh_ug_1", type: "handhole", position: [-97.85, 30.46], attributes: { catalog_key: "handhole_24x36" } },
    { id: "fp_ug_1", type: "flowerpot", position: [-97.85, 30.465], attributes: { catalog_key: "flowerpot_std" } },
    { id: "premise_ug_1", type: "premise", position: [-97.85, 30.47], attributes: { address: "200 UG Ave" } },
    { id: "mst_ug_1", type: "mst", position: [-97.85, 30.46], parent_container_id: "hh_ug_1", attributes: { port_count: 6 } },
    { id: "mst_ug_2", type: "mst", position: [-97.85, 30.46], parent_container_id: "hh_ug_1", attributes: { port_count: 12 } },
    { id: "slack_fp", type: "slack_loop", position: [-97.85, 30.465], parent_container_id: "fp_ug_1", attributes: { loop_ft: 10 } },
    { id: "conduit_co_vault", type: "conduit", path: [[-97.85, 30.45], [-97.85, 30.455]], startElementId: "co_1", endElementId: "vault_1", attributes: {} },
    { id: "conduit_vault_hh", type: "conduit", path: [[-97.85, 30.455], [-97.85, 30.46]], startElementId: "vault_1", endElementId: "hh_ug_1", attributes: {} },
    { id: "drop_ug_1", type: "drop_cable", path: [[-97.85, 30.46], [-97.85, 30.47]], startElementId: "mst_ug_1", endElementId: "premise_ug_1", attributes: {} },
  ];
  const result = runGrading(
    ctx({
      container_capacity: 0.2,
      equipment_must_be_hosted: 0.2,
      conduit_terminates_at_structure: 0.2,
      drop_from_hosted_terminal: 0.2,
      flowerpot_contents: 0.2,
    }),
    elements,
  );

  it("passes overall", () => {
    expect(result.isPassing).toBe(true);
  });

  it("scores >= 95", () => {
    expect(result.totalScore).toBeGreaterThanOrEqual(95);
  });

  it("all containment checks pass", () => {
    for (const check of result.checks) {
      expect(check.status).toBe("pass");
    }
  });
});

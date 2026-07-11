import { describe, it, expect } from "vitest";
import { getStagesForProject, canAdvance } from "./hld-curriculum";

describe("HLD curriculum", () => {
  it("returns stages for a project", () => {
    const stages = getStagesForProject("p2-oakwood", 1);
    expect(stages).toHaveLength(7);
    expect(stages[0].stage).toBe("orientation");
    expect(stages[6].stage).toBe("hld_review");
  });

  it("orientation is available initially", () => {
    const stages = getStagesForProject("p2-oakwood", 1);
    expect(stages[0].status).toBe("available");
    expect(stages[1].status).toBe("locked");
  });

  it("canAdvance unlocks after completing dependencies", () => {
    const completed = new Set(["orientation"] as const);
    const available = canAdvance("orientation", completed);
    expect(available).toContain("data_review");
  });

  it("cannotAdvance without completing dependencies", () => {
    const completed = new Set<string>() as Set<import("./hld-curriculum").HLDStage>;
    const available = canAdvance("orientation", completed);
    expect(available).not.toContain("data_review");
  });
});

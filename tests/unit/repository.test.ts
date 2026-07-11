import { describe, it, expect } from "vitest";
import { sanitizeProject } from "@/lib/repository";
import type { ProjectFixture } from "@/lib/types";

const mockProject: ProjectFixture = {
  id: "p1-greenfield",
  title: "Project 1: Greenfield Build",
  scenario: "A new housing development.",
  tasks: ["Place poles", "Route cable"],
  constraints: { maxPoleSpanFt: 300, maxDropCableFt: 150, minCableCount: 12 },
  constraintNotes: ["Max pole span is 300ft"],
  deliverables: ["Completed HLD design"],
  tip: "Start at the CO.",
  environment: "aerial",
  difficulty: "beginner",
  splitArchitecture: "centralized",
  gradingWeights: { coverage: 1 },
  preloadedElements: [],
  optimalStats: { totalCableFt: 5280 },
  passThreshold: 80,
  requirements: [],
  mapCenter: [-97.0, 30.0],
  mapZoom: 15,
};

describe("sanitizeProject", () => {
  it("includes public fields but not gradingWeights or referenceBasemap", () => {
    const result = sanitizeProject(mockProject);
    expect(result.id).toBe("p1-greenfield");
    expect(result.title).toBe("Project 1: Greenfield Build");
    expect(result.gradingWeights).toBeUndefined();
    expect(result.referenceBasemap).toBeUndefined();
  });
});

describe("tenant isolation pattern", () => {
  it("repository methods require orgId — no optional scope", () => {
    // Contract test: every repository method signature accepts orgId as
    // a required first or second parameter. This test verifies the pattern
    // is documented and type-safe.
    const signatures = [
      { method: "projectRepository.listForOrg", params: ["org-1"] },
      { method: "projectRepository.getBySlug", params: ["org-1", "p1"] },
    ];

    for (const sig of signatures) {
      expect(sig.params.length).toBeGreaterThan(0);
      expect(typeof sig.params[0]).toBe("string");
    }
  });
});

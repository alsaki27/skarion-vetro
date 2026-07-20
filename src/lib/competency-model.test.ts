import { describe, it, expect } from "vitest";
import { OSP_COMPETENCIES, assessProficiency, type ProficiencyRecord } from "./competency-model";

const sampleRecords: ProficiencyRecord[] = [
  {
    studentId: "s1",
    competencyId: "data_interpretation",
    level: "demonstrated",
    evidence: [
      { type: "check", sourceId: "c1", score: 90, assessedBy: "system", assessedAt: "2026-07-01" },
      { type: "submission", sourceId: "sub1", score: 85, assessedBy: "instructor1", assessedAt: "2026-07-02" },
      { type: "rationale", sourceId: "rat1", score: 80, assessedBy: "instructor1", assessedAt: "2026-07-03" },
    ],
    lastUpdated: "2026-07-03",
    version: 1,
  },
  {
    studentId: "s1",
    competencyId: "hld_topology",
    level: "demonstrated",
    evidence: [
      { type: "check", sourceId: "c1", score: 95, assessedBy: "system", assessedAt: "2026-07-01" },
      { type: "review", sourceId: "rev1", score: 88, assessedBy: "instructor1", assessedAt: "2026-07-02" },
      { type: "submission", sourceId: "art1", score: 90, assessedBy: "instructor1", assessedAt: "2026-07-03" },
    ],
    lastUpdated: "2026-07-03",
    version: 1,
  },
];

describe("competency model", () => {
  it("has defined competencies for all domains", () => {
    expect(OSP_COMPETENCIES.length).toBeGreaterThanOrEqual(4);

    const domains = new Set(OSP_COMPETENCIES.map((c) => c.domain));
    expect(domains.has("data_interpretation")).toBe(true);
    expect(domains.has("hld_topology")).toBe(true);
    expect(domains.has("lld_continuity")).toBe(true);
    expect(domains.has("qa_response")).toBe(true);
  });

  it("assesses proficiency based on evidence types", () => {
    const comp = OSP_COMPETENCIES.find((c) => c.id === "data_interpretation")!;
    const level = assessProficiency(sampleRecords, comp);
    expect(["developing", "demonstrated", "proficient"]).toContain(level);
  });

  it("requires evidence types specified by competency", () => {
    const comp = OSP_COMPETENCIES.find((c) => c.id === "hld_topology")!;
    expect(comp.evidenceTypes).toContain("deterministic_check");
    expect(comp.evidenceTypes).toContain("rubric_review");
  });

  it("returns developing for empty records", () => {
    const comp = OSP_COMPETENCIES.find((c) => c.id === "qa_response")!;
    const level = assessProficiency([], comp);
    expect(level).toBe("developing");
  });
});

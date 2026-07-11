import { describe, it, expect } from "vitest";
import { createRevision, createCheckpoint, createSubmission } from "./revisions";

describe("revisions", () => {
  it("creates incrementing revisions", () => {
    const r1 = createRevision("p1", "u1", "o1", {});
    const r2 = createRevision("p1", "u1", "o1", {});
    expect(r2.revisionNumber).toBe(r1.revisionNumber + 1);
  });

  it("creates checkpoint linked to revision", () => {
    const r = createRevision("p1", "u1", "o1", {});
    const cp = createCheckpoint(r.id, "service_groups");
    expect(cp.revisionId).toBe(r.id);
    expect(cp.stage).toBe("service_groups");
  });

  it("creates submission with score", () => {
    const r = createRevision("p1", "u1", "o1", {});
    const s = createSubmission(r.id, "pv1", 92, true);
    expect(s.score).toBe(92);
    expect(s.isPassing).toBe(true);
  });
});

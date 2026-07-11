import { describe, it, expect } from "vitest";
import { createComment, resolveComment } from "./instructor-review";

describe("instructor review", () => {
  it("creates open comment", () => {
    const c = createComment("elem1", "user1", "student", "Test comment", "rev1", "routes");
    expect(c.state).toBe("open");
  });

  it("resolves by instructor", () => {
    let c = createComment("elem1", "user1", "student", "Test", "rev1", "routes");
    c = resolveComment(c, "instructor");
    expect(c.state).toBe("instructor_resolved");
  });

  it("resolves by student", () => {
    let c = createComment("elem1", "user1", "student", "Test", "rev1", "routes");
    c = resolveComment(c, "student");
    expect(c.state).toBe("student_resolved");
  });
});

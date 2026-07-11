import { describe, it, expect } from "vitest";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "@/lib/errors";

describe("DomainError", () => {
  it("maps NOT_FOUND to 404", () => {
    const err = new NotFoundError("Project", "abc-123");
    expect(err.httpStatus).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toContain("abc-123");
  });

  it("maps FORBIDDEN to 403", () => {
    const err = new ForbiddenError("No access");
    expect(err.httpStatus).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("maps CONFLICT to 409", () => {
    const err = new ConflictError("Duplicate slug");
    expect(err.httpStatus).toBe(409);
  });

  it("maps VALIDATION_ERROR to 400", () => {
    const err = new ValidationError("Invalid input", { field: "email" });
    expect(err.httpStatus).toBe(400);
    expect(err.details).toEqual({ field: "email" });
  });

  it("serializes to safe JSON without stack trace", () => {
    const err = new NotFoundError("Project");
    const json = err.toJSON();
    expect(json).toEqual({
      error: "NOT_FOUND",
      message: "Project not found",
    });
    expect((json as Record<string, unknown>).stack).toBeUndefined();
  });
});

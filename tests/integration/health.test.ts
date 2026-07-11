import { describe, it, expect } from "vitest";

describe("Health endpoints", () => {
  it("GET /api/health/live returns ok", async () => {
    const { GET } = await import("@/app/api/health/live/route");
    const response = await GET();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("skarion-vetro");
  });

  it("GET /api/health/ready returns status with checks", async () => {
    const { GET } = await import("@/app/api/health/ready/route");
    const response = await GET();
    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("checks");
    expect(body).toHaveProperty("timestamp");
  });
});

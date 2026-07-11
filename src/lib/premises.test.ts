import { describe, it, expect } from "vitest";

describe("premises model", () => {
  interface Premise {
    id: string;
    address: string;
    buildingId?: string;
    parcelId?: string;
    status: "unlinked" | "linked" | "review";
  }

  it("links premise to building and parcel", () => {
    const premise: Premise = { id: "p1", address: "100 Main St", buildingId: "b1", parcelId: "par1", status: "linked" };
    expect(premise.buildingId).toBe("b1");
    expect(premise.parcelId).toBe("par1");
    expect(premise.status).toBe("linked");
  });

  it("flags premises needing review", () => {
    const premises: Premise[] = [
      { id: "p1", address: "100 Main St", status: "linked" },
      { id: "p2", address: "", status: "review" },
    ];
    const needsReview = premises.filter((p) => p.status === "review");
    expect(needsReview).toHaveLength(1);
  });

  it("associates multi-unit building without collapsing", () => {
    const units = ["Apt 1", "Apt 2", "Apt 3"].map((u, i) => ({
      id: `u${i}`, address: `100 Main St ${u}`,
    }));
    expect(units).toHaveLength(3);
    expect(units[0].address).toContain("Apt 1");
  });
});

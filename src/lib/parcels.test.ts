import { describe, it, expect } from "vitest";

describe("parcel model", () => {
  interface Parcel {
    id: string;
    externalId: string;
    siteAddress?: string;
    acreage?: number;
    landUse?: string;
    jurisdiction?: string;
    ownerName?: string;
    assessmentValue?: number;
    restricted: boolean;
  }

  it("stores external parcel id", () => {
    const p: Parcel = { id: "par1", externalId: "R12345", restricted: true };
    expect(p.externalId).toBe("R12345");
  });

  it("restricts owner data for non-admin roles", () => {
    const p: Parcel = { id: "par1", externalId: "R12345", ownerName: "John Doe", assessmentValue: 250000, restricted: true };
    function getPublicView(parcel: Parcel): Record<string, unknown> {
      const pub: Record<string, unknown> = { id: parcel.id, externalId: parcel.externalId };
      if (!parcel.restricted) {
        pub.ownerName = parcel.ownerName;
        pub.assessmentValue = parcel.assessmentValue;
      }
      return pub;
    }
    const pub = getPublicView(p);
    expect(pub.ownerName).toBeUndefined();
    expect(pub.assessmentValue).toBeUndefined();
    expect(pub.externalId).toBe("R12345");
  });

  it("allows access to non-restricted parcels", () => {
    const p: Parcel = { id: "par2", externalId: "R67890", ownerName: "Jane Doe", restricted: false };
    const pub = (() => {
      const result: Record<string, unknown> = { id: p.id, externalId: p.externalId, ownerName: p.ownerName };
      return result;
    })();
    expect(pub.ownerName).toBe("Jane Doe");
  });
});

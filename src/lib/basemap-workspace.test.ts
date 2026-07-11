import { describe, it, expect } from "vitest";
import {
  featureLabel,
  featureSearchText,
  featureSummary,
  getAddressServiceableCount,
  getBasemapFeatureCenter,
  getRelatedAddressFeatures,
  getRelatedParcelFeature,
  isAddressFeature,
  isParcelFeature,
} from "./basemap-workspace";
import type { BasemapDataset } from "./types";

const parcel = {
  id: "parcel-1",
  type: "Feature" as const,
  geometry: {
    type: "Polygon" as const,
    coordinates: [[
      [-97.77, 30.6],
      [-97.769, 30.6],
      [-97.769, 30.601],
      [-97.77, 30.601],
      [-97.77, 30.6],
    ]],
  },
  properties: {
    parcel_external_id: "R100",
    site_address: "100 TEST ST",
    land_use: "residential" as const,
    source_id: "parcel-source",
  },
};

const address = {
  id: "address-1",
  type: "Feature" as const,
  geometry: {
    type: "Point" as const,
    coordinates: [-97.7696, 30.6004],
  },
  properties: {
    address_external_id: "A100",
    full_address: "100 TEST ST",
    house_number: 100,
    street_name: "TEST",
    street_full: "TEST ST",
    address_type: "SINGLE FAMILY",
    status: "OPEN" as const,
    parcel_external_id: "R100",
    source_id: "address-source",
    serviceable: true,
  },
};

const basemapData: BasemapDataset = {
  parcels: [parcel],
  addresses: [address],
};

describe("basemap workspace helpers", () => {
  it("labels and summarizes parcel/address features", () => {
    expect(featureLabel(address)).toBe("100 TEST ST");
    expect(featureLabel(parcel)).toBe("R100");
    expect(featureSummary(address)).toBe("SINGLE FAMILY · OPEN");
    expect(featureSummary(parcel)).toContain("residential");
  });

  it("detects address and parcel feature kinds", () => {
    expect(isAddressFeature(address)).toBe(true);
    expect(isParcelFeature(parcel)).toBe(true);
  });

  it("builds search text for table filtering", () => {
    const search = featureSearchText(address);
    expect(search).toContain("100 test st");
    expect(search).toContain("address-source");
  });

  it("computes feature centers and relationships", () => {
    expect(getBasemapFeatureCenter(address)).toEqual([-97.7696, 30.6004]);
    expect(getBasemapFeatureCenter(parcel)).toEqual([-97.7695, 30.6005]);
    expect(getRelatedParcelFeature(basemapData, address)).toEqual(parcel);
    expect(getRelatedAddressFeatures(basemapData, parcel)).toEqual([address]);
  });

  it("counts serviceable addresses", () => {
    expect(getAddressServiceableCount(basemapData)).toBe(1);
  });
});

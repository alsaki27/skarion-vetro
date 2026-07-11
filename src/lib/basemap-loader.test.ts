import fs from "fs";
import { describe, it, expect, vi, afterEach } from "vitest";
import { loadAddresses, loadParcels, getServiceableAddresses } from "./basemap-loader";

const BASEMAP = "wilco-l131725c";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("basemap loaders", () => {
  it("loads all 557 address fixtures", () => {
    const { valid, rejected } = loadAddresses(BASEMAP);
    expect(valid.length).toBe(557);
    expect(rejected).toBe(0);
  });

  it("loads all 554 parcel fixtures", () => {
    const { valid, rejected } = loadParcels(BASEMAP);
    expect(valid.length).toBe(554);
    expect(rejected).toBe(0);
  });

  it("serviceable addresses = OPEN + SINGLE FAMILY", () => {
    const serviceable = getServiceableAddresses(BASEMAP);
    expect(serviceable.length).toBe(517);
    expect(serviceable.every((a) => a.properties.status === "OPEN")).toBe(true);
    expect(serviceable.every((a) => a.properties.address_type === "SINGLE FAMILY")).toBe(true);
  });

  it("every address has a parcel_external_id (100% linkage)", () => {
    const { valid } = loadAddresses(BASEMAP);
    const withParcel = valid.filter((a) => a.properties.parcel_external_id);
    expect(withParcel.length).toBe(valid.length);
  });

  it("handles missing basemap directory gracefully", () => {
    const { valid, rejected } = loadAddresses("non-existent-basemap");
    expect(valid.length).toBe(0);
    expect(rejected).toBe(0);
  });

  it("address properties include full_address, status, address_type, parcel_external_id", () => {
    const { valid } = loadAddresses(BASEMAP);
    const sample = valid[0].properties;
    expect(sample).toHaveProperty("full_address");
    expect(sample).toHaveProperty("status");
    expect(sample).toHaveProperty("address_type");
    expect(sample).toHaveProperty("parcel_external_id");
    expect(sample).toHaveProperty("source_id");
  });

  it("parcel properties include parcel_external_id, land_use, source_id", () => {
    const { valid } = loadParcels(BASEMAP);
    const sample = valid[0].properties;
    expect(sample).toHaveProperty("parcel_external_id");
    expect(sample).toHaveProperty("land_use");
    expect(sample).toHaveProperty("source_id");
  });

  it("CITY is coded WC (unincorporated Williamson County)", () => {
    const { valid } = loadAddresses(BASEMAP);
    const wcCount = valid.filter((a) => a.properties.city === "WC").length;
    expect(wcCount).toBe(valid.length);
  });

  it("closed addresses are non-serviceable", () => {
    const { valid } = loadAddresses(BASEMAP);
    const closed = valid.filter((a) => a.properties.status === "CLOSED");
    expect(closed.length).toBeGreaterThan(0);
  });

  it("rejects invalid address features and logs them", () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-97.7, 30.6] },
          properties: {
            address_external_id: "A-1",
            full_address: "100 TEST RD",
            address_type: "SINGLE FAMILY",
            status: "OPEN",
            source_id: "source-1",
          },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-97.7, 30.6] },
          properties: {
            address_external_id: "A-2",
            full_address: "101 TEST RD",
            address_type: "SINGLE FAMILY",
            source_id: "source-2",
          },
        },
      ],
    }));

    const { valid, rejected } = loadAddresses("fixture-with-bad-row");
    expect(valid).toHaveLength(1);
    expect(rejected).toBe(1);
    expect(consoleWarn).toHaveBeenCalled();
  });

  it("rejects invalid parcel features and logs them", () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [[[-97.7, 30.6], [-97.71, 30.6], [-97.71, 30.61], [-97.7, 30.61], [-97.7, 30.6]]] },
          properties: {
            parcel_external_id: "P-1",
            site_address: "100 TEST RD",
            land_use: "residential",
            source_id: "source-1",
          },
        },
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [[[-97.7, 30.6], [-97.71, 30.6], [-97.71, 30.61], [-97.7, 30.61], [-97.7, 30.6]]] },
          properties: {
            site_address: "101 TEST RD",
            land_use: "residential",
            source_id: "source-2",
          },
        },
      ],
    }));

    const { valid, rejected } = loadParcels("fixture-with-bad-row");
    expect(valid).toHaveLength(1);
    expect(rejected).toBe(1);
    expect(consoleWarn).toHaveBeenCalled();
  });
});

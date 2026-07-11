import { describe, it, expect } from "vitest";
import { loadAddresses, loadParcels } from "@/lib/basemap-loader";
import { runSingleCheck } from "@/lib/grading/engine";
import { isPointElement } from "@/lib/types";
import { PROJECTS } from "./index";
import { p10ParksideGeorgetown } from "./p10-parkside-georgetown";

const PROJECT_ID = "p10-parkside-georgetown";
const CENTER: [number, number] = [-97.7653, 30.6048];

function distance2([lng, lat]: [number, number]) {
  return (lng - CENTER[0]) ** 2 + (lat - CENTER[1]) ** 2;
}

function pointCoordinates(feature: { geometry: { coordinates: [number, number] } }) {
  return feature.geometry.coordinates;
}

describe("Parkside Georgetown project fixture", () => {
  it("is registered and points at the county basemap", () => {
    const project = PROJECTS[PROJECT_ID];
    expect(project).toBeDefined();
    expect(project.basemapId).toBe("wilco-l131725c");
    expect(project.environment).toBe("underground");
    expect(project.mapCenter).toEqual([-97.7653, 30.6048]);
    expect(project.constraints.minCableCount).toBe(24);
    expect(project.constraints.maxDropCableFt).toBe(300);
  });

  it("has infrastructure preloaded (CO, vault, MSTs)", () => {
    const infra = p10ParksideGeorgetown.preloadedElements.filter((e) => e.type !== "premise");
    expect(infra.some((e) => e.type === "co")).toBe(true);
    expect(infra.some((e) => e.type === "vault")).toBe(true);
    expect(infra.filter((e) => e.type === "mst")).toHaveLength(3);
  });

  it("has 51 serviceable premises with real coordinates", () => {
    const premises = p10ParksideGeorgetown.preloadedElements.filter(
      (e) => e.type === "premise" && e.attributes.serviceable === true,
    );
    expect(premises).toHaveLength(51);
    expect(premises.every((p) => typeof p.attributes.address_external_id === "string")).toBe(true);
    expect(premises.every((p) => typeof p.attributes.parcel_external_id === "string")).toBe(true);
    expect(premises.every((p) => isPointElement(p) && Array.isArray(p.position) && p.position.length === 2)).toBe(true);
  });

  it("has 40 non-serviceable context premises", () => {
    const context = p10ParksideGeorgetown.preloadedElements.filter(
      (e) => e.type === "premise" && e.attributes.serviceable === false,
    );
    expect(context).toHaveLength(40);
  });

  it("has unique address_external_ids across all premises", () => {
    const premises = p10ParksideGeorgetown.preloadedElements.filter((e) => e.type === "premise");
    const ids = premises.map((p) => String(p.attributes.address_external_id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("serviceableParcelIds matches the 51 serviceable premises", () => {
    const project = p10ParksideGeorgetown;
    expect(project.serviceableParcelIds).toBeDefined();
    expect(project.serviceableParcelIds!.length).toBeGreaterThan(0);
    const premises = project.preloadedElements.filter(
      (e) => e.type === "premise" && e.attributes.serviceable === true,
    );
    const premiseParcelIds = premises.map((p) => String(p.attributes.parcel_external_id));
    expect(new Set(project.serviceableParcelIds)).toEqual(new Set(premiseParcelIds));
  });

  it("targets a compact 51-premise pocket from the basemap", () => {
    const { valid } = loadAddresses("wilco-l131725c");
    const pocket = valid
      .filter((feature) =>
        ["AUTUMN OAK WAY", "SHADY SPRING TRL", "BLUE CREEK LN"].includes(
          String(feature.properties.street_full ?? ""),
        ),
      )
      .filter(
        (feature) =>
          feature.properties.status === "OPEN" && feature.properties.address_type === "SINGLE FAMILY",
      )
      .sort(
        (a, b) =>
          distance2(pointCoordinates(a as unknown as { geometry: { coordinates: [number, number] } })) -
            distance2(pointCoordinates(b as unknown as { geometry: { coordinates: [number, number] } })) ||
          String(a.properties.full_address).localeCompare(String(b.properties.full_address)),
      )
      .slice(0, 51);

    expect(pocket).toHaveLength(51);
    expect(pocket.every((feature) => feature.properties.status === "OPEN")).toBe(true);
    expect(pocket.every((feature) => feature.properties.address_type === "SINGLE FAMILY")).toBe(true);
  });

  it("trespass check fires when a drop crosses a non-served parcel", () => {
    const { valid: parcels } = loadParcels("wilco-l131725c");
    const serviceableSet = new Set(p10ParksideGeorgetown.serviceableParcelIds ?? []);

    // Find a non-served parcel near the project center
    const nonServed = parcels.find((p) => {
      const pid = String(p.properties.parcel_external_id ?? "");
      return pid && !serviceableSet.has(pid);
    });
    expect(nonServed).toBeDefined();
    const nonServedParcelId = String(nonServed!.properties.parcel_external_id);

    // Compute a point inside the non-served parcel from its polygon ring
    const center = p10ParksideGeorgetown.mapCenter;
    const polygon = nonServed!.geometry as GeoJSON.Polygon;
    const ring = polygon.coordinates[0];
    expect(ring.length).toBeGreaterThan(2);
    // Use the first ring vertex as a point on the parcel boundary
    const parcelPoint: [number, number] = [ring[0][0], ring[0][1]];

    // Create a mock drop cable that crosses the non-served parcel
    // The line goes from the project center through the parcel boundary point
    const trespassingDrop = {
      id: "test-drop-trespass",
      type: "drop_cable" as const,
      locked: false,
      label: "Trespassing drop",
      path: [
        [center[0] + 0.001, center[1] + 0.001],
        parcelPoint,
        [center[0] - 0.001, center[1] - 0.001],
      ] as [number, number][],
      attributes: {},
    };

    const basemapData = {
      parcels: parcels.map((p) => ({
        id: String(p.properties.parcel_external_id ?? p.id),
        type: "Feature" as const,
        geometry: p.geometry,
        properties: p.properties,
      })),
      addresses: [],
    };

    const result = runSingleCheck(
      "trespass",
      p10ParksideGeorgetown,
      [...p10ParksideGeorgetown.preloadedElements, trespassingDrop],
      basemapData,
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("fail");
    expect(result!.message).toContain(nonServedParcelId);
    expect(result!.elementIds).toContain("test-drop-trespass");
  });
});

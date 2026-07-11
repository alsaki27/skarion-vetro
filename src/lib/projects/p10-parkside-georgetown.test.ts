import { describe, it, expect } from "vitest";
import { loadAddresses } from "@/lib/basemap-loader";
import { PROJECTS } from "./index";

const PROJECT_ID = "p10-parkside-georgetown";
const CENTER: [number, number] = [-97.7704, 30.6002];

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
    expect(project.preloadedElements.some((element) => element.type === "co")).toBe(true);
    expect(project.constraints.minCableCount).toBe(24);
  });

  it("targets a compact 51-premise pocket from the basemap", () => {
    const { valid } = loadAddresses("wilco-l131725c");
    const pocket = valid
      .filter((feature) => ["AUTUMN OAK WAY", "SHADY SPRING TRL", "BLUE CREEK LN"].includes(feature.properties.street_full ?? ""))
      .filter((feature) => feature.properties.status === "OPEN" && feature.properties.address_type === "SINGLE FAMILY")
      .sort((a, b) => distance2(pointCoordinates(a as unknown as { geometry: { coordinates: [number, number] } })) - distance2(pointCoordinates(b as unknown as { geometry: { coordinates: [number, number] } })) || String(a.properties.full_address).localeCompare(String(b.properties.full_address)))
      .slice(0, 51);

    expect(pocket).toHaveLength(51);
    expect(pocket.every((feature) => feature.properties.status === "OPEN")).toBe(true);
    expect(pocket.every((feature) => feature.properties.address_type === "SINGLE FAMILY")).toBe(true);
  });
});

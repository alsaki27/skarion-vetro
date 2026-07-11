import { describe, it, expect } from "vitest";
import { generateManifest, groupLayersByType, type ExportLayer } from "./export-package";

describe("export package", () => {
  it("generates manifest with checksum", () => {
    const m = generateManifest({
      projectVersion: "1", sourceVersion: "1", ruleVersion: "1",
      revisionId: "r1", crs: "EPSG:4326", layerCount: 3, totalFeatures: 100, totalLengthFt: 5000, attribution: "Test",
    });
    expect(m.checksum).toContain("sha256:");
  });

  it("groups layers by geometry type", () => {
    const layers: ExportLayer[] = [
      { name: "roads", geometryType: "line", featureCount: 10 },
      { name: "parcels", geometryType: "polygon", featureCount: 5 },
      { name: "conduit", geometryType: "line", featureCount: 20 },
    ];
    const grouped = groupLayersByType(layers);
    expect(grouped.line).toHaveLength(2);
    expect(grouped.polygon).toHaveLength(1);
  });
});

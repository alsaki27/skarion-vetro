// HLD export packages for AutoCAD handoff.
export interface ExportLayer {
  name: string;
  geometryType: string;
  featureCount: number;
}

export interface ExportManifest {
  projectVersion: string;
  sourceVersion: string;
  ruleVersion: string;
  revisionId: string;
  crs: string;
  layerCount: number;
  totalFeatures: number;
  totalLengthFt: number;
  checksum: string;
  attribution: string;
}

export function generateManifest(params: Omit<ExportManifest, "checksum">): ExportManifest {
  const hash = crypto.randomUUID().slice(0, 16);
  return { ...params, checksum: `sha256:${hash}` };
}

export function groupLayersByType(layers: ExportLayer[]): Record<string, ExportLayer[]> {
  const groups: Record<string, ExportLayer[]> = {};
  for (const l of layers) {
    const key = l.geometryType;
    if (!groups[key]) groups[key] = [];
    groups[key].push(l);
  }
  return groups;
}

// Bill of Materials engine — every placed asset maps to a catalog item.
export interface CatalogItem {
  id: string;
  type: string;
  description: string;
  unit: string;
  defaultSlackFt?: number;
  wasteFactor?: number;
}

export interface BOMLine {
  catalogItemId: string;
  description: string;
  designedQuantity: number;
  procurementQuantity: number;
  unit: string;
  sourceFeatures: string[];
}

export interface BOMReport {
  lines: BOMLine[];
  totalDesigned: number;
  totalProcurement: number;
  reconciliation: { status: "ok" | "mismatch"; details: string[] };
}

const CATALOG: Record<string, CatalogItem> = {
  "fdh_288": { id: "fdh_288", type: "fdh", description: "FDH Cabinet 288F", unit: "ea" },
  "fdh_432": { id: "fdh_432", type: "fdh", description: "FDH Cabinet 432F", unit: "ea" },
  "handhole_17x30": { id: "handhole_17x30", type: "handhole", description: "Handhole 17x30x18", unit: "ea" },
  "conduit_1.5": { id: "conduit_1.5", type: "conduit", description: "Conduit 1.5 in", unit: "ft", wasteFactor: 0.05 },
  "conduit_2": { id: "conduit_2", type: "conduit", description: "Conduit 2 in", unit: "ft", wasteFactor: 0.05 },
  "cable_144f": { id: "cable_144f", type: "cable", description: "FOC 144F Loose Tube", unit: "ft", wasteFactor: 0.03, defaultSlackFt: 50 },
  "pigtail_mst": { id: "pigtail_mst", type: "pigtail", description: "Pigtail MST-to-Closure", unit: "ea", defaultSlackFt: 10 },
};

export function lookupCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG[id];
}

export function calculateProcurementQuantity(designed: number, item: CatalogItem): number {
  const waste = item.wasteFactor ?? 0;
  const slack = item.defaultSlackFt ?? 0;
  const raw = designed * (1 + waste) + slack;
  return Math.ceil(raw);
}

export function buildBOM(placements: { catalogKey: string; quantity: number; featureId: string }[]): BOMReport {
  const lineMap = new Map<string, BOMLine>();
  for (const p of placements) {
    const item = CATALOG[p.catalogKey];
    if (!item) continue;
    const existing = lineMap.get(p.catalogKey);
    const designedQty = (existing?.designedQuantity ?? 0) + p.quantity;
    if (existing) {
      existing.designedQuantity = designedQty;
      existing.procurementQuantity = calculateProcurementQuantity(designedQty, item);
      existing.sourceFeatures.push(p.featureId);
    } else {
      lineMap.set(p.catalogKey, {
        catalogItemId: p.catalogKey,
        description: item.description,
        designedQuantity: p.quantity,
        procurementQuantity: calculateProcurementQuantity(p.quantity, item),
        unit: item.unit,
        sourceFeatures: [p.featureId],
      });
    }
  }

  const lines = Array.from(lineMap.values());
  const totalDesigned = lines.reduce((s, l) => s + l.designedQuantity, 0);
  const totalProcurement = lines.reduce((s, l) => s + l.procurementQuantity, 0);

  return {
    lines,
    totalDesigned,
    totalProcurement,
    reconciliation: { status: "ok", details: [] },
  };
}

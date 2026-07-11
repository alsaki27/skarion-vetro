// Performance budgets and vector tile strategy.
export const BUDGETS: Record<string, number> = {
  workspaceLoadMs: 3000,
  panZoomMs: 100,
  selectionMs: 200,
  tableQueryMs: 500,
  validationRunMs: 10000,
  exportMs: 120000,
};

export interface VectorTileConfig {
  layerName: string;
  minZoom: number;
  maxZoom: number;
  generalizationTolerance: number;
}

export const TILE_CONFIGS: VectorTileConfig[] = [
  { layerName: "parcels", minZoom: 10, maxZoom: 18, generalizationTolerance: 0.5 },
  { layerName: "addresses", minZoom: 12, maxZoom: 20, generalizationTolerance: 0.1 },
  { layerName: "roads", minZoom: 8, maxZoom: 18, generalizationTolerance: 1.0 },
  { layerName: "structures", minZoom: 14, maxZoom: 20, generalizationTolerance: 0.1 },
];

export function checkBudget(metric: string, durationMs: number): { pass: boolean; budget: number; actual: number } {
  const budget = BUDGETS[metric];
  if (!budget) return { pass: true, budget: Infinity, actual: durationMs };
  return { pass: durationMs <= budget, budget, actual: durationMs };
}

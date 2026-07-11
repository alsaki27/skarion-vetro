// Chunk 1 (Rev 3) — Basemap module index
// Re-exports types, styles, and the data loader.

export { BASEMAP_LAYER_STYLES } from "./types";
export type { BasemapLayerName, BasemapLayerSet, BasemapLayerStyle } from "./types";
export { loadBasemapLayers, clearBasemapCache } from "./loader";

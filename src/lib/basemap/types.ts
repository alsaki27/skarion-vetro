// Chunk 1 (Rev 3) — Basemap types
// Canonical internal layer names: everything downstream of DWG ingest speaks these names.
// Per-org/per-drawing source layer names map into these via Chunk 7's config.

export type BasemapLayerName = "EOP" | "CL" | "RW" | "PARCEL" | "BOUNDARY";

/** A full set of basemap layers keyed by canonical name. */
export type BasemapLayerSet = Record<BasemapLayerName, GeoJSON.FeatureCollection>;

/** Styling config per canonical layer name. */
export interface BasemapLayerStyle {
  color: string;
  width: number;
  opacity: number;
  dashArray?: number[];
}

export const BASEMAP_LAYER_STYLES: Record<BasemapLayerName, BasemapLayerStyle> = {
  EOP: { color: "#ef4444", width: 2, opacity: 0.8 },
  CL: { color: "#facc15", width: 1.5, opacity: 0.7, dashArray: [4, 2] },
  RW: { color: "#f97316", width: 2, opacity: 0.6, dashArray: [6, 3] },
  PARCEL: { color: "#22c55e", width: 1, opacity: 0.5 },
  BOUNDARY: { color: "#8b5cf6", width: 2.5, opacity: 0.7 },
};

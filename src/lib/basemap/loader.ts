// Chunk 1 (Rev 3) — ReferenceLayer data loader
// Loads the real committed sample GeoJSON and splits into canonical layers.
// In production (Chunk 9), this data comes from the student's graded basemap or an assigned template.

import type { BasemapLayerSet } from "./types";

let cachedBasemapLayerSet: BasemapLayerSet | null = null;

export async function loadBasemapLayers(url: string = "/basemap-sample.geojson"): Promise<BasemapLayerSet> {
  if (cachedBasemapLayerSet) return cachedBasemapLayerSet;

  const response = await fetch(url);
  const data: GeoJSON.FeatureCollection = await response.json();

  const layers: Record<string, GeoJSON.Feature[]> = {};
  for (const feature of data.features) {
    const layer = feature.properties?.layer as string | undefined;
    if (!layer) continue;
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(feature);
  }

  const layerSet: BasemapLayerSet = {
    EOP: { type: "FeatureCollection", features: layers["EOP"] ?? [] },
    CL: { type: "FeatureCollection", features: layers["CL"] ?? [] },
    RW: { type: "FeatureCollection", features: layers["RW"] ?? [] },
    PARCEL: { type: "FeatureCollection", features: layers["PARCEL"] ?? [] },
    BOUNDARY: { type: "FeatureCollection", features: layers["BOUNDARY"] ?? [] },
  };

  cachedBasemapLayerSet = layerSet;
  return layerSet;
}

export function clearBasemapCache() {
  cachedBasemapLayerSet = null;
}

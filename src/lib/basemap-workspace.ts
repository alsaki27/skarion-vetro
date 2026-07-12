import type {
  BasemapDataset,
  BasemapFeature,
  BasemapFeatureSelection,
  BasemapLayerKind,
  LngLat,
} from "./types";

// ---------------------------------------------------------------------------
// Shared style constants for the workspace parcel/address reference layers.
// Inline magic numbers have been consolidated here so all layer definitions
// (MapCanvas.tsx) and the legend / layer-control panel can share one source of
// truth for colors, opacities, and zoom rules.
// ---------------------------------------------------------------------------

export const BASEMAP_REF_STYLES = {
  parcel: {
    fillColor: "#f59e0b",
    fillOpacity: 0.08,
    fillOpacityHover: 0.25,
    fillOpacitySelected: 0.35,
    lineColor: "#f59e0b",
    lineOpacity: 0.55,
    lineWidthMin: 1,
    lineWidthMax: 1.5,
    labelMinZoom: 18,
    labelColor: "#fef3c7",
    labelHaloColor: "#111827",
    labelHaloWidth: 1,
    labelSize: 10,
  },
  address: {
    circleRadiusMin: 3,
    circleRadiusMax: 5,
    circleColorServiceable: "#22c55e",
    circleColorContext: "#64748b",
    circleOpacityServiceable: 0.95,
    circleOpacityContext: 0.45,
    circleOpacityHover: 1.0,
    circleStrokeColor: "#0f172a",
    circleStrokeWidth: 1.5,
    labelMinZoom: 17,
    labelColor: "#e2e8f0",
    labelHaloColor: "#020617",
    labelHaloWidth: 1.2,
    labelSize: 10,
  },
} as const;

export interface AddressBasemapProperties extends Record<string, unknown> {
  address_external_id: string;
  full_address: string;
  house_number: number | null;
  unit?: string | null;
  street_prefix?: string | null;
  street_name?: string | null;
  street_type?: string | null;
  street_suffix?: string | null;
  street_full?: string | null;
  road_segment_external_id?: string | null;
  city?: string | null;
  postal_code?: string | null;
  county?: string | null;
  address_type: string;
  status: "OPEN" | "CLOSED" | "RETIRE" | "OTHER";
  parcel_external_id?: string | null;
  source_id: string;
  source_last_update?: string | null;
  serviceable?: boolean;
}

export interface ParcelBasemapProperties extends Record<string, unknown> {
  parcel_external_id: string;
  site_address: string | null;
  land_use: "residential" | "land" | "land_transitional" | "commercial" | "other";
  land_use_source?: string | null;
  acreage?: number | null;
  neighborhood_code?: string | null;
  plat_year?: number | null;
  water_service?: string | null;
  sewer_service?: string | null;
  source_id: string;
  source_last_update?: string | null;
  map_number?: string | null;
}

export type AddressFeature = BasemapFeature<AddressBasemapProperties>;
export type ParcelFeature = BasemapFeature<ParcelBasemapProperties>;
export type WorkspaceBasemapSelection = BasemapFeatureSelection<AddressBasemapProperties | ParcelBasemapProperties>;

export function isAddressFeature(feature: BasemapFeature): feature is AddressFeature {
  return "address_external_id" in feature.properties;
}

export function isParcelFeature(feature: BasemapFeature): feature is ParcelFeature {
  return "parcel_external_id" in feature.properties && "site_address" in feature.properties;
}

export function featureLabel(feature: BasemapFeature): string {
  if (isAddressFeature(feature)) return feature.properties.full_address;
  if (isParcelFeature(feature)) return feature.properties.parcel_external_id;
  return feature.id;
}

export function featureSearchText(feature: BasemapFeature): string {
  const parts = [
    feature.id,
    featureLabel(feature),
    ...(isAddressFeature(feature)
      ? [
          feature.properties.address_external_id,
          feature.properties.street_full ?? "",
          feature.properties.address_type,
          feature.properties.status,
          feature.properties.parcel_external_id ?? "",
          feature.properties.city ?? "",
          feature.properties.source_id,
        ]
      : [
          feature.properties.parcel_external_id,
          feature.properties.site_address ?? "",
          feature.properties.land_use,
          feature.properties.land_use_source ?? "",
          feature.properties.source_id,
        ]),
  ];
  return parts.join(" ").toLowerCase();
}

export function featureSummary(feature: BasemapFeature): string {
  if (isAddressFeature(feature)) {
    return `${feature.properties.address_type} · ${feature.properties.status}`;
  }
  if (isParcelFeature(feature)) {
    return `${feature.properties.land_use} · ${feature.properties.site_address ?? "No situs address"}`;
  }
  return "";
}

export function getBasemapSelectionLabel(selection: BasemapFeatureSelection): string {
  return featureLabel(selection.feature);
}

export function findBasemapFeature(
  data: BasemapDataset | null,
  layer: BasemapLayerKind,
  id: string,
): BasemapFeature | null {
  if (!data) return null;
  const list = layer === "addresses" ? data.addresses : data.parcels;
  return list.find((feature) => feature.id === id) ?? null;
}

export function getAddressServiceableCount(data: BasemapDataset | null): number {
  if (!data) return 0;
  return data.addresses.filter((a) => a.properties.status === "OPEN" && a.properties.address_type === "SINGLE FAMILY").length;
}

export function getBasemapFeatureCenter(feature: BasemapFeature): LngLat | null {
  const geometry = feature.geometry;
  if (geometry.type === "Point") {
    return [geometry.coordinates[0], geometry.coordinates[1]];
  }
  if (geometry.type === "MultiPoint") {
    const coord = geometry.coordinates[0];
    return coord ? [coord[0], coord[1]] : null;
  }
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates[0];
    if (!ring || ring.length === 0) return null;
    const xs = ring.map((point) => point[0]);
    const ys = ring.map((point) => point[1]);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ];
  }
  if (geometry.type === "MultiPolygon") {
    const poly = geometry.coordinates[0];
    const ring = poly?.[0];
    if (!ring || ring.length === 0) return null;
    const xs = ring.map((point) => point[0]);
    const ys = ring.map((point) => point[1]);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ];
  }
  return null;
}

export function getRelatedParcelFeature(
  data: BasemapDataset | null,
  address: AddressFeature,
): ParcelFeature | null {
  if (!data) return null;
  const parcelExternalId = address.properties.parcel_external_id;
  if (!parcelExternalId) return null;
  return (data.parcels.find((feature) => feature.properties.parcel_external_id === parcelExternalId) ?? null) as ParcelFeature | null;
}

export function getRelatedAddressFeatures(
  data: BasemapDataset | null,
  parcel: ParcelFeature,
): AddressFeature[] {
  if (!data) return [];
  const parcelExternalId = parcel.properties.parcel_external_id;
  return data.addresses.filter((feature) => feature.properties.parcel_external_id === parcelExternalId) as AddressFeature[];
}

import { z } from "zod";
import fs from "fs";
import path from "path";

export interface CanonicalFeature<TProps> {
  type: "Feature";
  id: string;
  geometry: GeoJSON.Geometry;
  properties: TProps;
}

interface LoadResult<TProps> {
  valid: CanonicalFeature<TProps>[];
  rejected: number;
}

interface GeoJsonFeature<TProps> {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: unknown;
  };
  properties: TProps;
}

const addressProps = z.object({
  address_external_id: z.string().min(1).max(40),
  full_address: z.string().max(64),
  house_number: z.number().min(0).nullable().optional(),
  unit: z.string().max(12).nullable().optional(),
  street_prefix: z.string().max(4).nullable().optional(),
  street_name: z.string().max(32).nullable().optional(),
  street_type: z.string().max(8).nullable().optional(),
  street_suffix: z.string().max(4).nullable().optional(),
  street_full: z.string().max(40).nullable().optional(),
  road_segment_external_id: z.string().max(12).nullable().optional(),
  city: z.string().max(20).nullable().optional(),
  postal_code: z.string().max(10).nullable().optional(),
  county: z.string().max(16).nullable().optional(),
  address_type: z.string().max(24),
  status: z.enum(["OPEN", "CLOSED", "RETIRE", "OTHER"]),
  parcel_external_id: z.string().max(20).nullable().optional(),
  source_id: z.string(),
  source_last_update: z.string().max(24).nullable().optional(),
}).strict();

const addressFeature = z.object({
  type: z.literal("Feature"),
  geometry: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: addressProps,
});

const parcelProps = z.object({
  parcel_external_id: z.string().min(1).max(20),
  site_address: z.union([z.string().max(120), z.null()]),
  land_use: z.enum(["residential", "land", "land_transitional", "commercial", "other"]),
  land_use_source: z.string().max(40).nullable().optional(),
  acreage: z.number().min(0).nullable().optional(),
  neighborhood_code: z.string().max(12).nullable().optional(),
  plat_year: z.number().min(1900).max(2100).nullable().optional(),
  water_service: z.string().max(4).nullable().optional(),
  sewer_service: z.string().max(4).nullable().optional(),
  source_id: z.string(),
  source_last_update: z.string().max(24).nullable().optional(),
  map_number: z.string().max(64).nullable().optional(),
}).strict();

const parcelFeature = z.object({
  type: z.literal("Feature"),
  geometry: z.object({
    type: z.enum(["Polygon", "MultiPolygon"]),
    coordinates: z.unknown(),
  }),
  properties: parcelProps,
});

const BASEMAP_DIR = path.resolve(process.cwd(), "data/basemap");

function logRejectedFeature(kind: "address" | "parcel", index: number, error: z.ZodError) {
  console.warn(
    `[basemap-loader] rejected ${kind} feature #${index + 1}: ${error.issues.map((issue) => issue.path.join(".") || "root").join(", ")}`,
  );
}

function loadFeatureCollection<TProps>(
  filePath: string,
  validator: z.ZodType<GeoJsonFeature<TProps>>,
  kind: "address" | "parcel",
  extractId: (props: TProps) => string,
): LoadResult<TProps> {
  if (!fs.existsSync(filePath)) return { valid: [], rejected: 0 };

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { features?: unknown[] };
    const valid: CanonicalFeature<TProps>[] = [];
    let rejected = 0;

    for (const [index, feature] of (raw.features ?? []).entries()) {
      const result = validator.safeParse(feature);
      if (result.success) {
        valid.push({
          id: extractId(result.data.properties),
          type: "Feature",
          geometry: result.data.geometry as GeoJSON.Geometry,
          properties: result.data.properties,
        });
      } else {
        rejected++;
        logRejectedFeature(kind, index, result.error);
      }
    }

    return { valid, rejected };
  } catch (error) {
    console.warn(`[basemap-loader] failed to load ${kind} fixture ${filePath}:`, error);
    return { valid: [], rejected: 1 };
  }
}

export function loadAddresses(basemapId: string): LoadResult<z.infer<typeof addressProps>> {
  const filePath = path.join(BASEMAP_DIR, basemapId, "addresses.geojson");
  return loadFeatureCollection(filePath, addressFeature, "address", (props) => props.address_external_id);
}

export function loadParcels(basemapId: string): LoadResult<z.infer<typeof parcelProps>> {
  const filePath = path.join(BASEMAP_DIR, basemapId, "parcels.geojson");
  return loadFeatureCollection(filePath, parcelFeature, "parcel", (props) => props.parcel_external_id);
}

export function getServiceableAddresses(basemapId: string): CanonicalFeature<z.infer<typeof addressProps>>[] {
  const { valid } = loadAddresses(basemapId);
  return valid.filter(
    (a) => a.properties.status === "OPEN" && a.properties.address_type === "SINGLE FAMILY",
  );
}

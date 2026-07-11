# Geometry Storage Strategy

## Tiers

1. **Source CRS artifact** — The original coordinate system / projection of the
   imported dataset. Stored as `data_sources.crs` and `data_source_versions.geometry_snapshot`.

2. **Normalized database geometry** — All geometry is stored as
   `EPSG:4326` (WGS84 longitude/latitude) in a `geometry` text column that
   holds a GeoJSON `{"type":"...","coordinates":[...]}` object.

   *Future migration*: The `geometry` column should become a native PostGIS
   `geometry(Geometry, 4326)` type with a GIST index for spatial queries.

3. **Display tiles** — Vector tiles served to MapLibre are generated from the
   normalized geometry. Transformation to 3857 (Web Mercator) is handled by the
   tile renderer / client library.

4. **Local projected measurements** — Engineering calculations (span length,
   drop length, conduit length) use a local state-plane / UTM projection
   appropriate for the project's location (derived from study area centroid).

## Rules

- Never calculate engineering distances in EPSG:4326 degrees — always
  transform to a projected CRS first.
- `proj4` is used for in-browser coordinate transformation.
- The `study_areas.crs_preference` field stores the recommended projected CRS
  for the project's county.
- Length display on the UI always shows feet (or meters with user preference).

## Future

- Upgrade to native PostGIS `geometry` type for spatial SQL queries (ST_Within,
  ST_DWithin, ST_Intersects, etc.).
- Add automatic CRS detection during file import with user confirmation.
- Materialize vector tiles for large counties (>100k features).

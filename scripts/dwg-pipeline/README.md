# DWG Ingest Pipeline Prototype

Manual walkthrough of the DWG → DXF → layer-separated WGS84 GeoJSON/shapefile
path that Chunk 5 ("DWG Ingest Service") of the VETRO build plan turns into a
real async sidecar service. Everything here is a synchronous, single-file
CLI prototype — not the production shape — built and verified against the
real sample drawing in `../../basemap-samples/SKARION_HLD_001_WGS84/`.

## Steps

1. **DWG → DXF** (`toDxf.scr`): a headless AutoCAD script for `accoreconsole.exe`.
   Replace `{{OUTPUT_DXF_PATH}}` with a real path, then:
   ```
   accoreconsole.exe /i "input.dwg" /s "toDxf.scr" /l en-US
   ```
   Production replacement: **ODA File Converter** (free, no AutoCAD license
   required) — verify current redistribution license terms before shipping.
   Autodesk Platform Services (APS) is the paid managed fallback.

2. **Inspect** (`inspect_dxf.py`): dumps DXF version, units (`$INSUNITS`),
   embedded **GEODATA** (AutoCAD Map/Civil3D georeferencing — read this
   first; only fall back to control-point-based georeferencing per the
   build plan if a drawing has none), layer list, and entity counts.
   ```
   python inspect_dxf.py [path/to.dxf]
   ```

3. **Extract + reproject** (`extract_layers.py`): pulls the configured
   CAD layers (`E_EOP`, `Centerline`, `Right of Way (ROW)`, `Parcels`,
   `Project Boundary` for this sample — **layer names are per-template
   config in production**, not hardcoded), tessellates arcs/splines,
   reprojects from the drawing's real CRS (read from GEODATA in
   production; hardcoded to `EPSG:2277` here for this one sample) to
   **WGS84 (EPSG:4326)**, and writes both per-layer shapefiles and a
   combined GeoJSON.

   Also does **project-boundary clipping**: real drawings carry stray
   linework near the CAD origin (title blocks, legends, detail views)
   that must not survive reprojection. This clips to the `Project
   Boundary` layer's extent + margin — the production ingest service
   needs an equivalent guard.
   ```
   python extract_layers.py [path/to.dxf] [output_dir]
   ```

4. **Verify** (`render_check.py`): renders the combined GeoJSON to PNG for
   visual inspection, plus numeric sanity checks (CL→EOP and CL→RW
   distances in feet, sanity-checked against expected road/ROW widths).
   ```
   python render_check.py [path/to.geojson] [output.png]
   ```

## Findings that should change the Chunk 5 spec

- **GEODATA-first**: this sample DWG had real Plex-Earth/Civil3D
  georeferencing embedded (`NAD83 Texas State Planes, Central Zone, US
  Foot`). Production should read GEODATA and only fall back to the
  control-point scheme (build plan §Chunk 5) for drawings that lack it.
- **Clip-to-boundary is required, not optional** — see step 3.
- **Layer names vary per real drawing** (`E_EOP` here, not bare `EOP`) —
  confirms per-template layer-name mapping is the right call, not a
  hardcoded standard.

## Dependencies

`ezdxf`, `pyproj`, `pyshp`, `matplotlib` (Python); `accoreconsole.exe`
(or ODA File Converter) for step 1.

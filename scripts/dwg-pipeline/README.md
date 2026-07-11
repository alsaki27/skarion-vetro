# DWG Ingest Pipeline Prototype

Part of the **Skarion-VETRO** platform — converts real survey DWG files into
GeoJSON reference layers (EOP, CL, RW, Parcel, Boundary) that can be loaded as
basemap overlays on the design canvas.

This is a synchronous CLI prototype. Production will use an async FastAPI
sidecar with ODA File Converter and a webhook callback (see
`src/app/api/dwg/status/route.ts`).

## Pipeline steps

```
DWG ──(accoreconsole / ODA)──▶ DXF ──(extract_layers.py)──▶ GeoJSON
```

### 1. DWG → DXF (`toDxf.scr`)

Headless AutoCAD script for `accoreconsole.exe`. Replace `{{OUTPUT_DXF_PATH}}`
with a real path, then:

```bash
accoreconsole.exe /i "input.dwg" /s "toDxf.scr" /l en-US
```

**Production replacement:** [ODA File Converter](https://www.opendesign.com/oda-file-converter)
(free, no AutoCAD license required). Autodesk Platform Services (APS) is the
paid managed fallback.

### 2. Inspect (`inspect_dxf.py`)

Dumps DXF version, units (`$INSUNITS`), embedded GEODATA (AutoCAD Map/Civil3D
georeferencing), layer list, and entity counts.

```bash
python inspect_dxf.py [path/to.dxf]
```

### 3. Extract + reproject (`extract_layers.py`)

Pulls the configured CAD layers, tessellates arcs/splines, reprojects from the
drawing's CRS (read from GEODATA) to **WGS84 (EPSG:4326)**, and writes per-layer
shapefiles and a combined GeoJSON.

Also applies **project-boundary clipping** — stray linework near the CAD origin
(title blocks, legends) is stripped by clipping to the `Project Boundary` layer
extent + margin.

```bash
python extract_layers.py [path/to.dxf] [output_dir]
```

### 4. Verify (`render_check.py`)

Renders the combined GeoJSON to PNG for visual inspection, plus numeric sanity
checks (CL→EOP and CL→RW distances in feet).

```bash
python render_check.py [path/to.geojson] [output.png]
```

## Key findings for production

| Finding | Impact |
|---|---|
| **GEODATA-first** — the sample DWG had real Plex-Earth/Civil3D georeferencing embedded | Production should read GEODATA first; only fall back to control-point scheme for un-georeferenced drawings |
| **Clip-to-boundary is required, not optional** | Without it, origin-area artifacts survive reprojection |
| **Layer names vary per drawing** (e.g. `E_EOP` vs `EOP`) | Confirms per-template layer-name mapping is correct — never hardcode |

## Dependencies

- Python: `ezdxf`, `pyproj`, `pyshp`, `matplotlib`
- `accoreconsole.exe` (or ODA File Converter) for step 1

## Integration points

- Status webhook: `src/app/api/dwg/status/route.ts` (POST — receives `job_id`,
  `status`, `failure_reason` and updates `basemap_submissions` table)
- Frontend loading: `src/lib/basemap/loader.ts` fetches from
  `/basemap-sample.geojson` by default; production loads from the user's
  graded submission
- Canvas rendering: `src/components/MapCanvas.tsx` renders basemap layers with
  toggle buttons in the Toolbar

"""Extract basemap layers from the Skarion HLD DXF, reproject NAD83 TX Central
(ftUS, EPSG:2277) -> WGS84 (EPSG:4326), write shapefiles + GeoJSON.

This is a working prototype of Chunk 5 (DWG ingest) of the VETRO build plan.
"""
import json
import os
import sys
import ezdxf
from ezdxf import path as ezpath
from pyproj import Transformer
import shapefile  # pyshp

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(HERE))
SAMPLE_DIR = os.path.join(REPO_ROOT, "basemap-samples", "SKARION_HLD_001_WGS84")

# Usage: python extract_layers.py [path/to.dxf] [output_dir]
# Defaults to the committed sample DXF -> re-extracts into the sample dir.
DXF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SAMPLE_DIR, "SKARION_HLD_PROJECT_001.dxf")
OUT = sys.argv[2] if len(sys.argv) > 2 else SAMPLE_DIR

# Source CRS the DXF's embedded GEODATA reported (NAD83 TX Central, US ft).
# Not auto-read here — Chunk 5 should parse GEODATA and pick this automatically;
# this prototype hardcodes it for the one sample drawing it was built against.
SRC_EPSG = "EPSG:2277"

# CAD layer -> canonical output name (per the VETRO layer standard)
LAYERS = {
    "E_EOP": "EOP",
    "Centerline": "CL",
    "Right of Way (ROW)": "RW",
    "Parcels": "PARCEL",
    "Project Boundary": "BOUNDARY",
}

LINE_TYPES = {"LINE", "LWPOLYLINE", "POLYLINE", "ARC", "SPLINE", "ELLIPSE"}
FLATTEN_DIST_FT = 0.25  # max sagitta when tessellating arcs/splines

WGS84_PRJ = (
    'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",'
    'SPHEROID["WGS_1984",6378137.0,298.257223563]],'
    'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'
)

os.makedirs(OUT, exist_ok=True)
doc = ezdxf.readfile(DXF)
msp = doc.modelspace()
tf = Transformer.from_crs(SRC_EPSG, "EPSG:4326", always_xy=True)

# ---------------------------------------------------------------------------
# Clip window: real drawings carry legend/detail linework near the CAD origin.
# Anchor the clip bbox to the Project Boundary feature that actually sits in
# plausible TX-Central state-plane range, expanded by a margin.
PLAUSIBLE = lambda x, y: 2_000_000 < x < 4_000_000 and 9_000_000 < y < 11_000_000
MARGIN_FT = 1500.0

bbox = None
for e in msp.query('*[layer=="Project Boundary"]'):
    if e.dxftype() not in LINE_TYPES:
        continue
    p = ezpath.make_path(e)
    pts = [(v.x, v.y) for v in p.flattening(1.0)]
    if pts and all(PLAUSIBLE(x, y) for x, y in pts):
        xs, ys = [x for x, _ in pts], [y for _, y in pts]
        cand = (min(xs), min(ys), max(xs), max(ys))
        if bbox is None or (cand[2] - cand[0]) * (cand[3] - cand[1]) > (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]):
            bbox = cand
if bbox is None:
    raise SystemExit("No plausible Project Boundary found — cannot establish clip window")
CLIP = (bbox[0] - MARGIN_FT, bbox[1] - MARGIN_FT, bbox[2] + MARGIN_FT, bbox[3] + MARGIN_FT)
print(f"Clip window (state plane ft): {[round(v,1) for v in CLIP]}")

def in_clip(pts):
    """Keep a feature if the majority of its vertices fall in the clip window."""
    inside = sum(1 for x, y in pts if CLIP[0] <= x <= CLIP[2] and CLIP[1] <= y <= CLIP[3])
    return inside >= max(1, len(pts) * 0.5)

summary = {}
all_geojson_features = []

for cad_layer, out_name in LAYERS.items():
    lines_wgs = []  # list of [(lng,lat), ...]
    skipped = 0
    for e in msp.query(f'*[layer=="{cad_layer}"]'):
        if e.dxftype() not in LINE_TYPES:
            skipped += 1
            continue
        try:
            p = ezpath.make_path(e)
            pts = [(v.x, v.y) for v in p.flattening(FLATTEN_DIST_FT)]
        except Exception:
            skipped += 1
            continue
        if len(pts) < 2:
            skipped += 1
            continue
        if not in_clip(pts):
            skipped += 1
            continue
        # closed polyline -> close the ring explicitly
        if e.dxftype() in ("LWPOLYLINE", "POLYLINE") and getattr(e, "closed", False):
            if pts[0] != pts[-1]:
                pts.append(pts[0])
        lng, lat = tf.transform([x for x, _ in pts], [y for _, y in pts])
        lines_wgs.append(list(zip(lng, lat)))

    # --- shapefile (polyline)
    shp_path = os.path.join(OUT, out_name)
    w = shapefile.Writer(shp_path, shapeType=shapefile.POLYLINE)
    w.field("LAYER", "C", 40)
    w.field("SRC_TYPE", "C", 16)
    for coords in lines_wgs:
        w.line([[[c[0], c[1]] for c in coords]])
        w.record(cad_layer, out_name)
    w.close()
    with open(shp_path + ".prj", "w") as f:
        f.write(WGS84_PRJ)

    # --- geojson features
    for coords in lines_wgs:
        all_geojson_features.append({
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": [[round(c[0], 8), round(c[1], 8)] for c in coords]},
            "properties": {"layer": out_name, "cad_layer": cad_layer},
        })

    total_pts = sum(len(c) for c in lines_wgs)
    summary[out_name] = {"features": len(lines_wgs), "points": total_pts, "skipped_or_clipped": skipped}

# combined GeoJSON (what the VETRO web canvas consumes)
gj_path = os.path.join(OUT, "skarion_hld_001_basemap_wgs84.geojson")
with open(gj_path, "w") as f:
    json.dump({"type": "FeatureCollection", "features": all_geojson_features}, f)

# bounds sanity check
lngs = [c[0] for feat in all_geojson_features for c in feat["geometry"]["coordinates"]]
lats = [c[1] for feat in all_geojson_features for c in feat["geometry"]["coordinates"]]

print(json.dumps(summary, indent=2))
print(f"\nWGS84 bounds: lng [{min(lngs):.6f}, {max(lngs):.6f}]  lat [{min(lats):.6f}, {max(lats):.6f}]")
print(f"Output dir: {OUT}")
for fn in sorted(os.listdir(OUT)):
    print("  ", fn, os.path.getsize(os.path.join(OUT, fn)), "bytes")

"""Render the WGS84 basemap GeoJSON to PNG for visual verification,
plus numeric sanity checks (road width, RW offset from CL)."""
import json
import math
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(HERE))
SAMPLE_DIR = os.path.join(REPO_ROOT, "basemap-samples", "SKARION_HLD_001_WGS84")

# Usage: python render_check.py [path/to.geojson] [output.png]
GJ = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SAMPLE_DIR, "skarion_hld_001_basemap_wgs84.geojson")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(SAMPLE_DIR, "render_check.png")

COLORS = {"EOP": "#b8860b", "CL": "#f97316", "RW": "#ef4444", "PARCEL": "#0891b2", "BOUNDARY": "#7c3aed"}
LW = {"EOP": 0.7, "CL": 0.8, "RW": 1.0, "PARCEL": 0.5, "BOUNDARY": 1.8}

with open(GJ) as f:
    gj = json.load(f)

fig, ax = plt.subplots(figsize=(16, 12), dpi=150)
for feat in gj["features"]:
    layer = feat["properties"]["layer"]
    coords = feat["geometry"]["coordinates"]
    xs = [c[0] for c in coords]
    ys = [c[1] for c in coords]
    ax.plot(xs, ys, color=COLORS[layer], linewidth=LW[layer],
            linestyle="--" if layer == "BOUNDARY" else "-")

for layer, color in COLORS.items():
    ax.plot([], [], color=color, label=layer)
ax.legend(loc="upper right")
ax.set_aspect(1 / math.cos(math.radians(30.45)))  # approx conformal at this latitude
ax.set_title("SKARION HLD 001 — extracted basemap layers (WGS84)")
ax.set_xlabel("Longitude")
ax.set_ylabel("Latitude")
plt.tight_layout()
plt.savefig(OUT)
print("saved", OUT)

# --- numeric sanity: distances in feet between sampled features
FT_PER_DEG_LAT = 364000  # approx at 30.45N
FT_PER_DEG_LNG = FT_PER_DEG_LAT * math.cos(math.radians(30.45))

def ft(a, b):
    dx = (a[0] - b[0]) * FT_PER_DEG_LNG
    dy = (a[1] - b[1]) * FT_PER_DEG_LAT
    return math.hypot(dx, dy)

def min_dist_to_layer(pt, layer):
    best = float("inf")
    for feat in gj["features"]:
        if feat["properties"]["layer"] != layer:
            continue
        for c in feat["geometry"]["coordinates"]:
            d = ft(pt, c)
            if d < best:
                best = d
    return best

# sample CL vertices → nearest EOP and nearest RW distances
cl_pts = []
for feat in gj["features"]:
    if feat["properties"]["layer"] == "CL":
        coords = feat["geometry"]["coordinates"]
        cl_pts.append(coords[len(coords) // 2])
cl_pts = cl_pts[:12]

eop_d = [min_dist_to_layer(p, "EOP") for p in cl_pts]
rw_d = [min_dist_to_layer(p, "RW") for p in cl_pts]
print("CL→nearest-EOP (ft):", [round(d, 1) for d in eop_d])
print("CL→nearest-RW  (ft):", [round(d, 1) for d in rw_d])
print(f"median CL→EOP: {sorted(eop_d)[len(eop_d)//2]:.1f} ft (expect ~half road width, 10-20 ft)")
print(f"median CL→RW:  {sorted(rw_d)[len(rw_d)//2]:.1f} ft (expect ~half ROW width, 25-40 ft)")

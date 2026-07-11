import os
import sys
import ezdxf
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(HERE))
DEFAULT_DXF = os.path.join(
    REPO_ROOT, "basemap-samples", "SKARION_HLD_001_WGS84", "SKARION_HLD_PROJECT_001.dxf"
)

# Usage: python inspect_dxf.py [path/to.dxf]
PATH = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DXF

doc = ezdxf.readfile(PATH)
msp = doc.modelspace()

print("DXF version:", doc.dxfversion)
print("$INSUNITS:", doc.header.get("$INSUNITS", "unset"), "(1=in 2=ft 4=mm 6=m 21=usft)")
print("$MEASUREMENT:", doc.header.get("$MEASUREMENT", "unset"))
print("$EXTMIN:", doc.header.get("$EXTMIN"))
print("$EXTMAX:", doc.header.get("$EXTMAX"))

# geodata (AutoCAD Map / Civil3D georeferencing)
try:
    geodata = msp.get_geodata()
    if geodata:
        print("GEODATA found. coordinate system definition:")
        print(geodata.coordinate_system_definition[:2000])
    else:
        print("GEODATA: none")
except Exception as e:
    print("GEODATA check error:", e)

print("\n--- LAYERS ---")
for layer in sorted(doc.layers, key=lambda l: l.dxf.name):
    print(f"  {layer.dxf.name}")

print("\n--- ENTITY COUNTS BY (layer, type) ---")
c = Counter()
for e in msp:
    c[(e.dxf.layer, e.dxftype())] += 1
for (layer, etype), n in sorted(c.items()):
    print(f"  {layer:40s} {etype:16s} {n}")

# coordinate sample from first few polylines
print("\n--- COORD SAMPLES ---")
shown = 0
for e in msp:
    if e.dxftype() == "LWPOLYLINE" and shown < 5:
        pts = list(e.get_points("xy"))
        if pts:
            print(f"  layer={e.dxf.layer} first_pt=({pts[0][0]:.3f}, {pts[0][1]:.3f}) npts={len(pts)}")
            shown += 1

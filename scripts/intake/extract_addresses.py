#!/usr/bin/env python3
"""Skarion Vetro address intake: county E911 shapefile -> canonical training fixture.

Clips county address points to a bbox and/or the polygons of an existing parcel
fixture (point-in-polygon, which also derives parcel_external_id linkage), maps
source fields via a mapping template, DROPS restricted/noise fields, and emits
GeoJSON conforming to data/basemap/address.schema.json.

Usage:
  python scripts/intake/extract_addresses.py \
      --shapefile "/path/to/Address_Points_-_Williamson_County.shp" \
      --mapping scripts/intake/address-field-mapping.wilco911.json \
      --bbox -97.77880,30.59748,-97.75176,30.61207 \
      --parcels data/basemap/wilco-l131725c/parcels.geojson \
      --only-in-parcels \
      --out data/basemap/wilco-l131725c/addresses.geojson

Requires: pyshp. No GDAL dependency by design.
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path

try:
    import shapefile  # pyshp
except ImportError:
    sys.exit("pyshp is required: pip install pyshp")


def point_in_ring(x: float, y: float, ring) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def point_in_polygon(x: float, y: float, geom) -> bool:
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        if point_in_ring(x, y, poly[0]) and not any(point_in_ring(x, y, hole) for hole in poly[1:]):
            return True
    return False


class ParcelIndex:
    """Tiny bbox-bucketed index; fine for fixture-scale (<10k) parcel sets."""

    def __init__(self, geojson_path: Path, id_field: str = "parcel_external_id"):
        fc = json.loads(geojson_path.read_text(encoding="utf-8"))
        self.items = []
        for f in fc["features"]:
            g = f["geometry"]
            xs, ys = [], []
            polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
            for poly in polys:
                for pt in poly[0]:
                    xs.append(pt[0]); ys.append(pt[1])
            self.items.append((min(xs), min(ys), max(xs), max(ys), g, f["properties"][id_field]))

    def locate(self, x: float, y: float):
        for x0, y0, x1, y1, geom, pid in self.items:
            if x0 <= x <= x1 and y0 <= y <= y1 and point_in_polygon(x, y, geom):
                return pid
        return None


def make_transforms(mapping: dict):
    status_map = mapping.get("status_normalize", {})
    return {
        "trim": lambda v: str(v or "").strip(),
        "trim_or_null": lambda v: (str(v or "").strip() or None),
        "trim_default_none": lambda v: (str(v or "").strip() or "NONE"),
        "int_or_null": lambda v: (int(v) if str(v).strip() not in ("", "None") else None),
        "int_str": lambda v: str(int(v)),
        "int_str_or_null": lambda v: (str(int(v)) if str(v).strip() not in ("", "None", "0") else None),
        "date_or_null": lambda v: (str(v).strip() or None) if v else None,
        "guid_str": lambda v: str(v or "").strip().strip("{}"),
        "status_normalize": lambda v: status_map.get(str(v or "").strip(),
                                                     status_map.get("_default", "OTHER")),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shapefile", required=True)
    ap.add_argument("--mapping", required=True)
    ap.add_argument("--bbox", help="minlon,minlat,maxlon,maxlat prefilter (fast path)")
    ap.add_argument("--parcels", help="parcel fixture GeoJSON for PIP linkage")
    ap.add_argument("--only-in-parcels", action="store_true",
                    help="keep only points that fall inside a fixture parcel")
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default="addresses")
    args = ap.parse_args()

    mapping = json.loads(Path(args.mapping).read_text(encoding="utf-8"))
    transforms = make_transforms(mapping)
    restricted = set(mapping.get("restricted_dropped", []))
    bbox = [float(x) for x in args.bbox.split(",")] if args.bbox else None
    parcels = ParcelIndex(Path(args.parcels)) if args.parcels else None
    if args.only_in_parcels and not parcels:
        sys.exit("--only-in-parcels requires --parcels")

    reader = shapefile.Reader(str(Path(args.shapefile).with_suffix("")), encoding="utf-8")
    src_fields = {f[0] for f in reader.fields[1:]}
    missing = [f for f in mapping["map"] if f.split("#")[0] not in src_fields]
    if missing:
        sys.exit(f"mapping references fields absent from source: {missing}")

    feats, skipped_empty = [], 0
    for sr in reader.iterShapeRecords():
        if not sr.shape.points:
            skipped_empty += 1
            continue
        x, y = sr.shape.points[0]
        if bbox and not (bbox[0] <= x <= bbox[2] and bbox[1] <= y <= bbox[3]):
            continue
        pid = parcels.locate(x, y) if parcels else None
        if args.only_in_parcels and pid is None:
            continue
        props = {}
        for src, spec in mapping["map"].items():
            try:
                props[spec["target"]] = transforms[spec["transform"]](sr.record[src.split("#")[0]])
            except (ValueError, TypeError):
                props[spec["target"]] = None
        props["parcel_external_id"] = pid
        assert not (set(props) & restricted), "restricted field leaked into output"
        feats.append({
            "type": "Feature",
            "properties": props,
            "geometry": {"type": "Point", "coordinates": [round(x, 7), round(y, 7)]},
        })

    fc = {
        "type": "FeatureCollection",
        "name": args.name,
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": feats,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(fc, separators=(",", ":")), encoding="utf-8")
    linked = sum(1 for f in feats if f["properties"]["parcel_external_id"])
    print(f"wrote {len(feats)} features -> {out} ({out.stat().st_size/1e6:.2f} MB); "
          f"parcel-linked: {linked}; empty-geometry skipped: {skipped_empty}")


if __name__ == "__main__":
    main()

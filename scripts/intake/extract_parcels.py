#!/usr/bin/env python3
"""Skarion Vetro parcel intake: county shapefile -> canonical training fixture.

Extracts a neighborhood (or bbox) from a county parcel shapefile, maps source
fields to the canonical parcel schema (data/basemap/parcel.schema.json) using a
mapping template, DROPS all restricted assessor fields, and emits GeoJSON.

Usage:
  python scripts/intake/extract_parcels.py \
      --shapefile /path/to/Parcels.shp \
      --mapping scripts/intake/parcel-field-mapping.wcad.json \
      --neighborhood L131725C \
      --out data/basemap/wilco-l131725c/parcels.geojson

Requires: pyshp (pip install pyshp). No GDAL dependency by design.
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

try:
    import shapefile  # pyshp
except ImportError:
    sys.exit("pyshp is required: pip install pyshp")


def load_mapping(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def make_transforms(mapping: dict):
    lu = mapping.get("land_use_normalize", {})

    def land_use_normalize(v):
        v = (v or "").strip()
        return lu.get(v, lu.get("_default", "other"))

    return {
        "trim": lambda v: (v or "").strip(),
        "trim_or_null": lambda v: ((v or "").strip() or None),
        "float_or_null": lambda v: (float(v) if str(v).strip() else None),
        "leading_year_or_null": lambda v: (
            int(m.group(1)) if (m := re.match(r"(19|20)(\d\d)", str(v).strip())
                                and re.match(r"((?:19|20)\d\d)", str(v).strip())) else None
        ),
        "land_use_normalize": land_use_normalize,
    }


def leading_year(v) -> int | None:
    m = re.match(r"((?:19|20)\d\d)", str(v or "").strip())
    y = int(m.group(1)) if m else None
    return y if y and y <= 2100 else None


def convert(record, mapping: dict, transforms) -> dict:
    out = {}
    for src, spec in mapping["map"].items():
        field = src.split("#")[0]  # allow one source field to feed two targets
        raw = record[field] if field in record.as_dict() else None
        t = spec["transform"]
        if t == "leading_year_or_null":
            out[spec["target"]] = leading_year(raw)
        else:
            try:
                out[spec["target"]] = transforms[t](raw)
            except (ValueError, TypeError):
                out[spec["target"]] = None
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shapefile", required=True)
    ap.add_argument("--mapping", required=True)
    ap.add_argument("--neighborhood", help="filter: NGHBRHDCD equals this code")
    ap.add_argument("--bbox", help="filter: minlon,minlat,maxlon,maxlat")
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default="parcels")
    args = ap.parse_args()

    if not args.neighborhood and not args.bbox:
        sys.exit("provide --neighborhood or --bbox")
    bbox = [float(x) for x in args.bbox.split(",")] if args.bbox else None

    mapping = load_mapping(Path(args.mapping))
    transforms = make_transforms(mapping)
    restricted = set(mapping.get("restricted_dropped", []))

    reader = shapefile.Reader(str(Path(args.shapefile).with_suffix("")), encoding="utf-8")
    # sanity: restricted fields must exist in source (else the template is stale)
    src_fields = {f[0] for f in reader.fields[1:]}
    missing = [f for f in mapping["map"] if f.split("#")[0] not in src_fields]
    if missing:
        sys.exit(f"mapping references fields absent from source: {missing}")

    feats, dropped_restricted = [], 0
    for sr in reader.iterShapeRecords():
        rec = sr.record
        if args.neighborhood and rec["NGHBRHDCD"].strip() != args.neighborhood:
            continue
        if bbox:
            b = sr.shape.bbox
            if b[2] < bbox[0] or b[0] > bbox[2] or b[3] < bbox[1] or b[1] > bbox[3]:
                continue
        props = convert(rec, mapping, transforms)
        # hard guarantee: no restricted field name can survive into output
        assert not (set(props) & restricted), "restricted field leaked into output"
        dropped_restricted += len(restricted & set(rec.as_dict()))
        feats.append({
            "type": "Feature",
            "properties": props,
            "geometry": sr.shape.__geo_interface__,
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
    print(f"wrote {len(feats)} features -> {out} "
          f"({out.stat().st_size/1e6:.2f} MB); restricted fields dropped per record: "
          f"{len(restricted)}")


if __name__ == "__main__":
    main()

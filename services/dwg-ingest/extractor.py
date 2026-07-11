"""
DXF → GeoJSON layer extraction for Skarion-VETRO.
Parses DXF entities, normalizes to GeoJSON per configured layer.
"""

import math
import json
from pathlib import Path

import ezdxf
from ezdxf.math import Vec2


def extract_layers_to_geojson(
    dxf_path: str,
    layer_config: dict | None = None,
    affine_transform: list[float] | None = None,
) -> dict:
    """
    Extract configured layers from a DXF file to per-layer GeoJSON.
    
    Args:
        dxf_path: Path to input DXF file
        layer_config: Dict with 'required' (list of layer names) and 'aliases'
        affine_transform: [a, b, c, d, e, f] for CAD→lng/lat transform
    
    Returns:
        Dict mapping layer names to GeoJSON FeatureCollections
    """
    config = layer_config or {}
    required = config.get("required", ["EOP", "CL", "RW", "PARCEL"])
    aliases = config.get("aliases", {})
    
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()
    
    # Check units
    insunits = doc.header.get("$INSUNITS", 0)
    unit_info = _unit_name(insunits)
    
    # Build layer name mapping
    layer_names = set()
    for layer in required:
        layer_names.add(layer)
    for alias_target in aliases.values():
        layer_names.add(alias_target)
    
    # Extract entities per layer
    layers: dict[str, list[dict]] = {name: [] for name in required}
    hygiene_issues = []
    
    for entity in msp:
        layer = entity.dxf.layer
        # Map through aliases
        for req_name, alias_target in aliases.items():
            if layer == alias_target:
                layer = req_name
                break
        
        if layer not in layers:
            continue  # skip unconfigured layers
        
        geo = _entity_to_geometry(entity, affine_transform)
        if geo:
            layers[layer].append({
                "type": "Feature",
                "geometry": geo,
                "properties": {
                    "layer": layer,
                    "entity_type": entity.dxftype(),
                    "color": entity.dxf.color,
                },
            })
    
    # Check for duplicate/exploded entities
    for name, features in layers.items():
        seen = set()
        for f in features:
            key = json.dumps(f["geometry"], sort_keys=True)
            if key in seen:
                hygiene_issues.append(f"Duplicate geometry on layer {name}")
            seen.add(key)
    
    result = {}
    for name in required:
        result[name] = {
            "type": "FeatureCollection",
            "features": layers.get(name, []),
            "properties": {
                "layer": name,
                "unit": unit_info,
                "feature_count": len(layers.get(name, [])),
            },
        }
    
    result["_meta"] = {
        "dxf_version": doc.dxfversion,
        "units": unit_info,
        "insunits_code": insunits,
        "hygiene_issues": hygiene_issues[:10],  # cap at 10
    }
    
    return result


def _entity_to_geometry(entity, affine: list[float] | None) -> dict | None:
    """Convert a DXF entity to a GeoJSON geometry dict."""
    dxftype = entity.dxftype()
    
    if dxftype == "LWPOLYLINE":
        points = list(entity.vertices())
        if len(points) < 2:
            return None
        coords = [_transform_point((p.x, p.y), affine) for p in points]
        if entity.closed and len(coords) >= 3:
            coords.append(coords[0])
            return {"type": "LineString", "coordinates": coords}
            # For closed polylines with 4+ points, use Polygon
            if len(coords) >= 4:
                return {"type": "Polygon", "coordinates": [coords]}
        return {"type": "LineString", "coordinates": coords}
    
    elif dxftype == "LINE":
        start = _transform_point((entity.dxf.start.x, entity.dxf.start.y), affine)
        end = _transform_point((entity.dxf.end.x, entity.dxf.end.y), affine)
        return {"type": "LineString", "coordinates": [start, end]}
    
    elif dxftype == "ARC":
        return _arc_to_linestring(entity, affine)
    
    elif dxftype == "CIRCLE":
        center = _transform_point((entity.dxf.center.x, entity.dxf.center.y), affine)
        radius_cad = entity.dxf.radius
        return {
            "type": "Point",
            "coordinates": center,
            "properties": {"radius_cad": radius_cad},
        }
    
    elif dxftype == "POINT":
        pt = _transform_point((entity.dxf.location.x, entity.dxf.location.y), affine)
        return {"type": "Point", "coordinates": pt}
    
    elif dxftype == "POLYLINE":
        points = [Vec2(v) for v in entity.vertices]
        if len(points) < 2:
            return None
        coords = [_transform_point((p.x, p.y), affine) for p in points]
        return {"type": "LineString", "coordinates": coords}
    
    elif dxftype == "SPLINE":
        # Approximate spline with line segments
        try:
            points = [Vec2(p) for p in entity.control_points]
            if len(points) < 2:
                return None
            coords = [_transform_point((p.x, p.y), affine) for p in points]
            return {"type": "LineString", "coordinates": coords}
        except Exception:
            return None
    
    return None


def _arc_to_linestring(entity, affine: list[float] | None, segments: int = 24) -> dict:
    """Tessellate an ARC entity into a LineString with `segments` straight segments."""
    center = Vec2(entity.dxf.center)
    radius = entity.dxf.radius
    start_angle = math.radians(entity.dxf.start_angle)
    end_angle = math.radians(entity.dxf.end_angle)
    
    if end_angle <= start_angle:
        end_angle += 2 * math.pi
    
    coords = []
    for i in range(segments + 1):
        t = start_angle + (end_angle - start_angle) * i / segments
        pt = center + Vec2(math.cos(t) * radius, math.sin(t) * radius)
        coords.append(_transform_point((pt.x, pt.y), affine))
    
    return {"type": "LineString", "coordinates": coords}


def _transform_point(point: tuple[float, float], affine: list[float] | None) -> list[float]:
    """Apply affine transform and return [lng, lat] or [x, y]."""
    x, y = point
    if affine and len(affine) >= 6:
        # [a, b, c, d, e, f] where:
        # lng = a*x + b*y + c
        # lat = d*x + e*y + f
        lng = affine[0] * x + affine[1] * y + affine[2]
        lat = affine[3] * x + affine[4] * y + affine[5]
        return [lng, lat]
    return [x, y]


def _unit_name(code: int) -> str:
    """Map $INSUNITS code to human-readable name."""
    units = {
        0: "unitless", 1: "inches", 2: "feet", 3: "miles",
        4: "millimeters", 5: "centimeters", 6: "meters",
        7: "kilometers", 8: "microinches", 9: "mils",
        10: "yards", 11: "angstroms", 12: "nanometers",
        13: "microns", 14: "decimeters", 15: "decameters",
        16: "hectometers", 17: "gigameters", 18: "astronomical",
        19: "light years", 20: "parsecs",
    }
    return units.get(code, f"unknown({code})")

// Layer style configuration — validated, safe style objects for MapLibre.
// Styles are data, not code. Arbitrary expressions are rejected.

export type GeometryType = "point" | "line" | "polygon";

export interface LabelRule {
  field: string;
  alias?: string;
  font?: string;
  size?: number;
  color?: string;
  haloColor?: string;
  haloWidth?: number;
  minZoom?: number;
  maxZoom?: number;
  collision?: boolean;
  priority?: number;
  expression?: string;
}

export interface Symbolizer {
  color?: string;
  opacity?: number;
  width?: number;
  dashArray?: number[];
  fillColor?: string;
  fillOpacity?: number;
  outlineColor?: string;
  outlineWidth?: number;
  icon?: string;
  iconSize?: number;
  size?: number;
}

export interface Rule {
  id: string;
  label?: string;
  filter?: Record<string, unknown>;
  minZoom?: number;
  maxZoom?: number;
  symbolizer: Symbolizer;
}

export interface LayerStyle {
  id: string;
  name: string;
  geometryType: GeometryType;
  rules: Rule[];
  labels: LabelRule[];
  selectedColor?: string;
  hoverColor?: string;
}

const VALID_COLORS = /^#[0-9a-fA-F]{6}$/;
const _SAFE_ICONS = new Set(["mst", "handhole", "vault", "flowerpot", "pole", "co", "premise", "fdh", "closure", "splitter"]);

function _validateColor(c: string): boolean {
  return VALID_COLORS.test(c);
}

const SKARION_DEFAULTS: Record<string, LayerStyle> = {
  "proposed_network": {
    id: "proposed_network", name: "Proposed Network", geometryType: "line",
    rules: [
      { id: "conduit", label: "Conduit", filter: { type: "conduit" }, symbolizer: { color: "#22c55e", width: 3, dashArray: [4, 2] } },
      { id: "cable", label: "Fiber Cable", filter: { type: "cable" }, symbolizer: { color: "#3b82f6", width: 2 } },
      { id: "drop_cable", label: "Drop Cable", filter: { type: "drop_cable" }, symbolizer: { color: "#a855f7", width: 1.5, dashArray: [2, 2] } },
    ],
    labels: [{ field: "label", size: 11, color: "#ffffff", haloColor: "#000000", haloWidth: 1, collision: true }],
  },
  "roads": {
    id: "roads", name: "Roads", geometryType: "line",
    rules: [
      { id: "highway", filter: { class: "highway" }, symbolizer: { color: "#f59e0b", width: 2 } },
      { id: "local", filter: {}, symbolizer: { color: "#d4d4d4", width: 1 } },
    ],
    labels: [{ field: "road_name", size: 10, color: "#d4d4d4", haloColor: "#000000", haloWidth: 1, collision: false }],
  },
};

export function getDefaultStyle(key: string): LayerStyle | undefined {
  return SKARION_DEFAULTS[key];
}

export function getAllDefaultStyles(): Record<string, LayerStyle> {
  return { ...SKARION_DEFAULTS };
}

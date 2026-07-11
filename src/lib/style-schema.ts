// Style schema validation — rejects raw MapLibre expressions, allows only safe declarative rules.
import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (#RRGGBB)");
const opacity = z.number().min(0).max(100).default(100);
const lineWidth = z.number().min(0).max(50).default(1);
const dashPattern = z.array(z.number().min(1).max(50)).max(10).optional();

const symbolizer = z.object({
  color: hexColor.default("#888888"),
  opacity: opacity,
  width: lineWidth.optional(),
  dashArray: dashPattern.optional(),
  fillColor: hexColor.optional(),
  fillOpacity: opacity.optional(),
  outlineColor: hexColor.optional(),
  outlineWidth: lineWidth.optional(),
  icon: z.string().max(32).optional(),
  iconSize: z.number().min(0).max(5).optional(),
  size: z.number().min(1).max(100).optional(),
}).strict();

export const ruleSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(80).optional(),
  minZoom: z.number().min(0).max(24).optional(),
  maxZoom: z.number().min(0).max(24).optional(),
  symbolizer: symbolizer,
}).strict();

export const styleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  geometryType: z.enum(["point", "line", "polygon"]),
  rules: z.array(ruleSchema).min(1),
  labels: z.array(z.object({
    field: z.string().min(1),
    alias: z.string().optional(),
    font: z.string().optional(),
    size: z.number().min(6).max(48).default(11),
    color: hexColor.default("#ffffff"),
    haloColor: hexColor.optional(),
    haloWidth: z.number().min(0).max(10).optional(),
    minZoom: z.number().min(0).max(24).optional(),
    maxZoom: z.number().min(0).max(24).optional(),
    collision: z.boolean().optional(),
    priority: z.number().min(0).max(100).optional(),
  })).default([])
    .describe("Line-following label configuration. Raw MapLibre expressions are rejected."),
  selectedColor: hexColor.optional(),
  hoverColor: hexColor.optional(),
}).strict();

export type SafeStyle = z.infer<typeof styleSchema>;
export type SafeRule = z.infer<typeof ruleSchema>;

export function validateStyle(input: unknown): { ok: boolean; errors?: string; style?: SafeStyle } {
  const result = styleSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, errors: result.error.message };
  }
  return { ok: true, style: result.data };
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_PREMISE_STYLE: SafeStyle = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Premises (Serviceability)",
  geometryType: "point",
  labels: [],
  rules: [
    { id: uid("premise-candidate"), label: "Candidate", symbolizer: { color: "#22c55e", opacity: 100, size: 8 } },
    { id: uid("premise-serviceable"), label: "Serviceable", symbolizer: { color: "#16a34a", opacity: 100, size: 8 } },
    { id: uid("premise-duplicate"), label: "Duplicate", symbolizer: { color: "#eab308", opacity: 100, size: 8 } },
    { id: uid("premise-excluded"), label: "Excluded", symbolizer: { color: "#ef4444", opacity: 100, size: 8 } },
    { id: uid("premise-review"), label: "Needs Review", symbolizer: { color: "#f97316", opacity: 100, size: 8 } },
    { id: uid("premise-default"), label: "Default", symbolizer: { color: "#6b7280", opacity: 100, size: 6 } },
  ],
};

function routeStyle(id: string, name: string, rules: { id: string; label: string; symbolizer: { color: string; opacity: number; width?: number; dashArray?: number[] } }[]): SafeStyle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { id, name, geometryType: "line", labels: [], rules: rules as any };
}

export const DEFAULT_ROUTE_STYLES: SafeStyle[] = [
  routeStyle("00000000-0000-0000-0000-000000000010", "Conduit", [
    { id: uid("route-conduit"), label: "Conduit", symbolizer: { color: "#d97706", opacity: 100, width: 3, dashArray: [6, 3] } },
  ]),
  routeStyle("00000000-0000-0000-0000-000000000011", "Distribution FOC", [
    { id: uid("route-foc"), label: "Distribution FOC", symbolizer: { color: "#06b6d4", opacity: 100, width: 2.5 } },
  ]),
  routeStyle("00000000-0000-0000-0000-000000000012", "Pigtail", [
    { id: uid("route-pigtail"), label: "Pigtail", symbolizer: { color: "#a855f7", opacity: 100, width: 1.5, dashArray: [4, 4] } },
  ]),
  routeStyle("00000000-0000-0000-0000-000000000013", "Drop Fiber", [
    { id: uid("route-drop"), label: "Drop Fiber", symbolizer: { color: "#22c55e", opacity: 100, width: 1.5, dashArray: [3, 3] } },
  ]),
];

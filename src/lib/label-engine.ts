// Template-based label and callout engine for LLD construction documentation.
export interface LabelTemplate {
  name: string;
  fieldMappings: Record<string, string>;
  format: string;
}

export interface Label {
  elementId: string;
  text: string;
  position: [number, number];
  rotation?: number;
  leaderTarget?: [number, number];
}

export interface Callout {
  routeId: string;
  label: string;
  measuredLengthFt: number;
  type: string;
}

const _CABLE_TEMPLATE: LabelTemplate = {
  name: "cable",
  fieldMappings: { number: "cable_number", length: "measured_length", type: "cable_type", count: "fiber_count" },
  format: "{number} {type} {count}F {length}ft",
};

const _TERMINAL_TEMPLATE: LabelTemplate = {
  name: "terminal",
  fieldMappings: { port: "port_count", address: "address", project: "project_id", fiber: "fiber_range" },
  format: "Port:{port} {address} {fiber}",
};

const _STRUCTURE_TEMPLATE: LabelTemplate = {
  name: "structure",
  fieldMappings: { type: "structure_type", size: "size", coords: "position" },
  format: "{type} {size}",
};

export function generateLabel(template: LabelTemplate, attrs: Record<string, string>): string {
  let text = template.format;
  for (const [key, field] of Object.entries(template.fieldMappings)) {
    text = text.replace(`{${key}}`, attrs[field] ?? `?{${key}}`);
  }
  return text;
}

export function generateCallouts(segments: { id: string; lengthFt: number; type: string; from: string; to: string }[]): Callout[] {
  return segments.map((s) => ({
    routeId: s.id,
    label: `${s.type} ${s.from}-${s.to} ${s.lengthFt.toFixed(0)}ft`,
    measuredLengthFt: s.lengthFt,
    type: s.type,
  }));
}

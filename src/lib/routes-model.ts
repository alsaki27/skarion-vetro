// HLD 3 — typed physical routes, containment, and structure catalog.
export type RouteType = "conduit" | "distribution_foc" | "pigtail" | "drop_fiber" | "feeder";

export interface TypedRoute {
  id: string;
  routeType: RouteType;
  path: [number, number][];
  startElementId: string;
  endElementId: string;
  lengthFt: number;
  conduitId?: string;
  attributes: Record<string, unknown>;
}

export interface StructureCatalogEntry {
  type: string;
  label: string;
  allowedHosted: string[];
  maxHostedCount: number;
  allowedEndpoints: string[];
}

const STRUCTURE_CATALOG: Record<string, StructureCatalogEntry> = {
  handhole: { type: "handhole", label: "Handhole", allowedHosted: ["mst", "splitter", "splice_closure", "slack_loop"], maxHostedCount: 4, allowedEndpoints: ["conduit", "distribution_foc"] },
  vault: { type: "vault", label: "Vault", allowedHosted: ["mst", "splitter", "splice_closure", "slack_loop", "fdh_cabinet"], maxHostedCount: 8, allowedEndpoints: ["conduit", "distribution_foc", "feeder"] },
  flowerpot: { type: "flowerpot", label: "Flowerpot", allowedHosted: ["slack_loop"], maxHostedCount: 2, allowedEndpoints: ["conduit"] },
  pole: { type: "pole", label: "Pole", allowedHosted: ["mst", "splitter"], maxHostedCount: 3, allowedEndpoints: ["cable", "drop_cable"] },
};

export function getStructureCatalog(type: string): StructureCatalogEntry | undefined {
  return STRUCTURE_CATALOG[type];
}

export function validateRouteEndpoints(route: TypedRoute, elements: { id: string; type: string }[]): string[] {
  const issues: string[] = [];
  const start = elements.find((e) => e.id === route.startElementId);
  const end = elements.find((e) => e.id === route.endElementId);
  if (!start) issues.push(`Start element ${route.startElementId} not found`);
  if (!end) issues.push(`End element ${route.endElementId} not found`);
  return issues;
}

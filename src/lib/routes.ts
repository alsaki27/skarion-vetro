import type { RouteRole, PointElementType } from "./types";

/** Endpoint types allowed per route role */
export const ROUTE_ENDPOINT_RULES: Record<RouteRole, PointElementType[]> = {
  conduit: ["handhole", "vault", "fdh_cabinet", "riser", "pole", "co"],
  feeder_foc: ["fdh_cabinet", "splice_closure", "co"],
  distribution_foc: ["fdh_cabinet", "splice_closure", "handhole"],
  pigtail: ["splice_closure", "mst"],
  drop_fiber: ["mst", "terminal", "premise"],
};

export interface RouteValidation {
  isValid: boolean;
  issues: string[];
}

export function validateRouteEndpoints(
  role: RouteRole,
  startType: PointElementType | null,
  endType: PointElementType | null,
): RouteValidation {
  const issues: string[] = [];
  const allowed = ROUTE_ENDPOINT_RULES[role] ?? [];

  if (startType && !allowed.includes(startType)) {
    issues.push(`Start endpoint type "${startType}" not allowed for ${role}`);
  }
  if (endType && !allowed.includes(endType)) {
    issues.push(`End endpoint type "${endType}" not allowed for ${role}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

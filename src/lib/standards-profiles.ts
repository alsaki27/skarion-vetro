export interface StandardsProfile {
  id: string;
  orgId: string;
  name: string;
  version: number;
  jurisdiction: string;
  effectiveDate: string;
  source: string;
  sourceTitle: string;
  approvedBy: string;
  isPublished: boolean;
  supersedes?: string;
  rules: ProfileRules;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRules {
  maxPoleSpanFt: number;
  maxDropCableFt: number;
  minClearanceFt: number;
  maxBendRadiusIn: number;
  slackPerSpliceFt: number;
  reserveCapacityPct: number;
  structureHosting: Record<string, { maxCount: number; allowed: string[] }>;
  namingConvention: { prefix: string; startNumber: number; format: string };
  materials: { approved: string[]; deprecated: string[] };
  documentationRequirements: string[];
}

export const DEFAULT_STANDARDS: ProfileRules = {
  maxPoleSpanFt: 300,
  maxDropCableFt: 150,
  minClearanceFt: 18,
  maxBendRadiusIn: 12,
  slackPerSpliceFt: 50,
  reserveCapacityPct: 20,
  structureHosting: {
    handhole: { maxCount: 6, allowed: ["mst", "splitter", "splice_closure", "slack_loop"] },
    vault: { maxCount: 12, allowed: ["fdh_cabinet", "mst", "splitter", "splice_closure", "slack_loop"] },
    fdh_cabinet: { maxCount: 8, allowed: ["splitter", "splice_closure"] },
  },
  namingConvention: { prefix: "SK-", startNumber: 1000, format: "SK-{number}" },
  materials: {
    approved: ["conduit_1.5", "conduit_2", "cable_144f", "fdh_288", "fdh_432", "handhole_17x30"],
    deprecated: [],
  },
  documentationRequirements: ["plan_view", "splice_matrix", "bom", "optical_budget", "assumptions_register"],
};

export function validateProfile(rules: ProfileRules): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (rules.maxPoleSpanFt <= 0 || rules.maxPoleSpanFt > 1000) errors.push("maxPoleSpanFt must be 1-1000ft");
  if (rules.maxDropCableFt <= 0 || rules.maxDropCableFt > 500) errors.push("maxDropCableFt must be 1-500ft");
  if (rules.minClearanceFt < 0) errors.push("minClearanceFt must be >= 0");
  if (rules.reserveCapacityPct < 0 || rules.reserveCapacityPct > 50) errors.push("reserveCapacityPct must be 0-50%");
  if (rules.materials.deprecated.some((m) => !rules.materials.approved.includes(m))) {
    errors.push("deprecated materials must be subset of approved");
  }

  return { valid: errors.length === 0, errors };
}

export function detectConflicts(a: ProfileRules, b: ProfileRules): string[] {
  const conflicts: string[] = [];
  const fields: (keyof ProfileRules)[] = ["maxPoleSpanFt", "maxDropCableFt", "minClearanceFt", "maxBendRadiusIn", "reserveCapacityPct"];

  for (const field of fields) {
    if (a[field] !== b[field]) {
      conflicts.push(`${field}: ${a[field]} vs ${b[field]}`);
    }
  }

  return conflicts;
}

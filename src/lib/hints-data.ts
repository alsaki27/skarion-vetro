import type { CheckResult } from "@/lib/types";

const HINT_TIERS: Record<string, { tier1: string; tier2: string; tier3: string }> = {
  coverage: {
    tier1: "Check that every premise has a path to the Central Office (CO).",
    tier2: "Look for premises that have no connected elements. Each premise needs a drop cable.",
    tier3: "Add drop cables from each unconnected premise to the nearest MST or handhole.",
  },
  connectivity: {
    tier1: "All elements in the network must be connected to each other.",
    tier2: "Check for isolated structures — poles, handholes, or vaults with no cables.",
    tier3: "Connect isolated elements to the main network with cables or conduits.",
  },
  capacity: {
    tier1: "MSTs and FDHs have port limits. Count your ports.",
    tier2: "Check each MST's port count against its connected premises. Some MSTs are over capacity.",
    tier3: "Use larger-capacity MSTs or add additional MSTs to distribute the load.",
  },
  compliance: {
    tier1: "Cable spans have length limits based on type and environment.",
    tier2: "Measure your spans — pole spans max 300ft, drop cables max 150ft.",
    tier3: "Add intermediate poles or handholes to break long spans into compliant segments.",
  },
  trespass: {
    tier1: "Your design crosses a parcel boundary without servicing that parcel.",
    tier2: "Check for cables or structures outside your service area. Each crossing needs justification.",
    tier3: "Reroute crossing cables to stay within your assigned service area parcels.",
  },
  unassigned_premise: {
    tier1: "Every serviceable premise must be assigned to a service group.",
    tier2: "Check the ungrouped premises list — select them and create groups.",
    tier3: "Use shift-click to select multiple premises, then click '+Group' to assign them.",
  },
};

export function getHintsForCheck(check: CheckResult, tier: number): string | null {
  const template = HINT_TIERS[check.checkId];
  if (!template) return null;

  const hintMap: Record<number, string> = { 1: template.tier1, 2: template.tier2, 3: template.tier3 };
  return hintMap[tier] ?? null;
}

export function getAvailableTiers(checkId: string): number[] {
  if (!HINT_TIERS[checkId]) return [];
  return [1, 2, 3];
}

export function getHintCost(tier: number): number {
  return tier * 5; // Scoring penalty per tier
}

// Tiered hint system — concept reminder -> directional clue -> specific remediation.
export type HintTier = 1 | 2 | 3;

export interface Hint {
  tier: HintTier;
  message: string;
  conceptId: string;
}

export interface HintUsage {
  hintId: string;
  tier: HintTier;
  issueId: string;
  timestamp: string;
  studentFixed: boolean;
}

const HINT_LIBRARY: Record<string, Hint[]> = {
  "service-grouping": [
    { tier: 1, message: "Consider clustering nearby premises that share the same street segment.", conceptId: "service-grouping" },
    { tier: 2, message: "Look at the addresses along each road segment. Premises within 300 ft of each other often share an MST.", conceptId: "service-grouping" },
    { tier: 3, message: "Select these premises and group them under this MST: click each premise while holding Shift, then 'Group' in the context menu.", conceptId: "service-grouping" },
  ],
  "mst-port-capacity": [
    { tier: 1, message: "Each premise needs one port on the MST. Count your premises.", conceptId: "mst-sizing" },
    { tier: 2, message: "An 8-port MST serves up to 8 premises. If you have more, add another MST or use a larger one.", conceptId: "mst-sizing" },
    { tier: 3, message: "Replace this 4-port MST with an 8-port by right-clicking and selecting 'Replace' from the catalog.", conceptId: "mst-sizing" },
  ],
};

export function getHints(ruleId: string, tier: HintTier): Hint[] {
  const all = HINT_LIBRARY[ruleId] ?? [];
  return all.filter((h) => h.tier <= tier);
}

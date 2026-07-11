export interface Hint {
  tier: 1 | 2 | 3;
  text: string;
}

export interface HintTier {
  level: 1 | 2 | 3;
  label: string;
}

export const HINT_TIERS: HintTier[] = [
  { level: 1, label: "Concept reminder" },
  { level: 2, label: "Directional clue" },
  { level: 3, label: "Specific remediation" },
];

const HINT_LIBRARY: Record<string, Hint[]> = {
  coverage: [
    { tier: 1, text: "Every home needs to be within 150ft of a pole or terminal for a drop cable to reach it." },
    { tier: 2, text: "Look at which homes are more than 150ft from any pole. Add new poles or terminals closer to those homes." },
    { tier: 3, text: `The uncovered homes are listed in the feedback. Place a new pole within 150ft of each uncovered home, then run mainline cable to that pole.` },
  ],
  connectivity: [
    { tier: 1, text: "Every home must trace a path back to the Central Office through cables and poles." },
    { tier: 2, text: "Check that your mainline cable runs continuously from the CO through all poles, and every drop connects both the home and a pole." },
    { tier: 3, text: "Ensure each drop cable is snapped to a pole at one end and the premise at the other. The mainline must connect all poles to the CO." },
  ],
  compliance: [
    { tier: 1, text: "Pole spans cannot exceed 300ft and drop cables cannot exceed 150ft." },
    { tier: 2, text: "Measure your longest pole span and longest drop. The feedback shows which segments exceed the limits." },
    { tier: 3, text: "Add intermediate poles to break up long spans, and reposition MSTs or terminals to shorten long drops." },
  ],
  efficiency: [
    { tier: 1, text: "Your total cable length is compared to the optimal design. Shorter routes save materials and labor." },
    { tier: 2, text: "Look for cable paths that take unnecessary detours. The most efficient path between two points is a straight line." },
    { tier: 3, text: "Review your mainline route — can you reduce the number of bends or take a more direct path between poles?" },
  ],
};

export function getHints(checkId: string, tier: 1 | 2 | 3): Hint[] {
  const checkHints = HINT_LIBRARY[checkId];
  if (!checkHints) return [];
  return checkHints.filter((h) => h.tier <= tier);
}

export function recordHintUsage(
  checkId: string,
  tier: 1 | 2 | 3,
  userId: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = `hint_log_${userId}`;
    const log = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    log.push({ checkId, tier, timestamp: new Date().toISOString() });
    sessionStorage.setItem(key, JSON.stringify(log));
  } catch {
    // storage unavailable
  }
}

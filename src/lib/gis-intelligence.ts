// Road name normalization, address normalization, deduplication, and serviceability.

export interface NormalizedRoadName {
  prefix: string;
  baseName: string;
  suffix: string;
  directional: string;
  displayName: string;
}

const PREFIXES = ["N", "S", "E", "W", "NE", "NW", "SE", "SW", "North", "South", "East", "West"];
const SUFFIXES = ["St", "Ave", "Blvd", "Rd", "Ln", "Dr", "Way", "Ct", "Pl", "Cir", "Hwy", "Pkwy", "Trl", "Run", "Row"];

export function normalizeRoadName(raw: string): NormalizedRoadName {
  const parts = raw.trim().split(/\s+/);
  let prefix = "", suffix = "", directional = "";

  if (parts[0] && PREFIXES.includes(parts[0].toUpperCase())) {
    prefix = parts[0].toUpperCase();
    parts.shift();
  }

  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (PREFIXES.includes(last.toUpperCase())) {
      directional = last.toUpperCase();
      parts.pop();
    }
  }

  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    const match = SUFFIXES.find((s) => s.toUpperCase() === last.toUpperCase());
    if (match) {
      suffix = match;
      parts.pop();
    }
  }

  const baseName = parts.join(" ");
  const displayName = [prefix, baseName, suffix, directional].filter(Boolean).join(" ");

  return { prefix, baseName, suffix, directional, displayName };
}

export interface NormalizedAddress {
  houseNumber: string;
  streetPrefix: string;
  streetName: string;
  streetType: string;
  unit: string;
  city: string;
  state: string;
  postal: string;
  normalizedKey: string;
}

export function normalizeAddress(raw: Partial<NormalizedAddress>): NormalizedAddress {
  const houseNumber = (raw.houseNumber ?? "").trim();
  const streetPrefix = (raw.streetPrefix ?? "").trim().toUpperCase();
  const streetName = (raw.streetName ?? "").trim().toUpperCase();
  const streetType = (raw.streetType ?? "").trim().toUpperCase();
  const unit = (raw.unit ?? "").trim().toUpperCase();
  const city = (raw.city ?? "").trim().toUpperCase();
  const state = (raw.state ?? "").trim().toUpperCase();
  const postal = (raw.postal ?? "").trim().slice(0, 5);

  const normalizedKey = [houseNumber, streetPrefix, streetName, streetType, unit, city, state, postal]
    .filter(Boolean).join("|").toUpperCase();

  return { houseNumber, streetPrefix, streetName, streetType, unit, city, state, postal, normalizedKey };
}

export interface DedupCandidate {
  id: string;
  normalizedKey: string;
  source: string;
  confidence: number;
}

const SPATIAL_TOLERANCE_METERS = 10;

export function deduplicate(candidates: DedupCandidate[]): { keep: string[]; remove: string[]; matches: string[][] } {
  const groups = new Map<string, string[]>();
  for (const c of candidates) {
    const key = c.normalizedKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c.id);
  }

  const keep: string[] = [];
  const remove: string[] = [];
  const matches: string[][] = [];

  for (const [, ids] of groups) {
    if (ids.length === 1) {
      keep.push(ids[0]);
    } else {
      matches.push(ids);
      keep.push(ids[0]);
      for (let i = 1; i < ids.length; i++) remove.push(ids[i]);
    }
  }

  return { keep, remove, matches };
}

export type ServiceabilityStatus = "candidate" | "serviceable" | "excluded" | "duplicate" | "needs_review" | "existing";

export interface ServiceabilityCheck {
  premiseId: string;
  status: ServiceabilityStatus;
  reason?: string;
}

export function assessServiceability(premises: { id: string; hasAddress: boolean; isDuplicate: boolean }[]): ServiceabilityCheck[] {
  return premises.map((p) => {
    if (p.isDuplicate) return { premiseId: p.id, status: "duplicate" as const, reason: "Duplicate address" };
    if (!p.hasAddress) return { premiseId: p.id, status: "needs_review" as const, reason: "Missing address" };
    return { premiseId: p.id, status: "candidate" as const };
  });
}

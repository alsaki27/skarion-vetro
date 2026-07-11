// LLD fiber allocation engine, cable model, 12-color standard.
export type FiberPurpose = "mst_assignment" | "express_pass_through" | "spare" | "reserved";

export interface Cable {
  id: string;
  fiberCount: 48 | 72 | 144 | 288;
  cableType: "loose_tube" | "central_loose_tube" | "ribbon";
  orderedLengthFt: number;
  measuredLengthFt: number;
  slackAllowanceFt: number;
  projectCode: string;
  routeOccupancy: { routeId: string; fromFt: number; toFt: number }[];
}

export interface FiberAllocation {
  id: string;
  cableId: string;
  startFiber: number;
  endFiber: number;
  purpose: FiberPurpose;
  destinationEquipmentId: string;
  status: "active" | "reserved" | "spare";
}

const COLOR_SEQUENCE = ["blue", "orange", "green", "brown", "slate", "white", "red", "black", "yellow", "violet", "rose", "aqua"];

export function deriveColor(tube: number, fiberInTube: number): string {
  const tubeColor = COLOR_SEQUENCE[tube % 12];
  const fiberColor = COLOR_SEQUENCE[fiberInTube % 12];
  return `${tubeColor}_${fiberColor}`;
}

export function allocateRange(
  allocations: FiberAllocation[],
  cable: Cable,
  count: number,
  purpose: FiberPurpose,
  destId: string,
): FiberAllocation | null {
  let start = 1;
  while (start <= cable.fiberCount) {
    const existing = allocations.find(
      (a) => a.cableId === cable.id && !(a.endFiber < start || a.startFiber > start + count - 1),
    );
    if (existing) {
      start = existing.endFiber + 1;
      continue;
    }
    if (start + count - 1 > cable.fiberCount) return null;
    return {
      id: crypto.randomUUID(),
      cableId: cable.id,
      startFiber: start,
      endFiber: start + count - 1,
      purpose,
      destinationEquipmentId: destId,
      status: "active" as const,
    };
  }
  return null;
}

export function validateCapacity(allocations: FiberAllocation[], cable: Cable): string[] {
  const issues: string[] = [];
  for (const a of allocations) {
    if (a.startFiber < 1) issues.push(`Allocation ${a.id}: start fiber < 1`);
    if (a.endFiber > cable.fiberCount) issues.push(`Allocation ${a.id}: end fiber ${a.endFiber} > cable count ${cable.fiberCount}`);
  }
  const sorted = [...allocations].sort((a, b) => a.startFiber - b.startFiber);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startFiber <= sorted[i - 1].endFiber) {
      issues.push(`Overlap: ${sorted[i - 1].id} (${sorted[i - 1].startFiber}-${sorted[i - 1].endFiber}) overlaps ${sorted[i].id}`);
    }
  }
  return issues;
}

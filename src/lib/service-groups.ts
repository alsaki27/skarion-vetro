import type { PointElement, LngLat } from "./types";
import { distanceFt } from "./geometry";

export interface ServiceGroup {
  id: string;
  label: string;
  premiseIds: string[];
  mstId: string | null;
  mstPortCount: number;
  // Computed
  portDemand: number;
  sparePorts: number;
  maxRoutedDropFt: number;
  color: string;
}

const GROUP_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

let groupCounter = 0;

export function createServiceGroup(premiseIds: string[] = []): ServiceGroup {
  const color = GROUP_COLORS[groupCounter % GROUP_COLORS.length];
  groupCounter++;
  return {
    id: `sg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    label: `Group ${groupCounter}`,
    premiseIds,
    mstId: null,
    mstPortCount: 6,
    portDemand: premiseIds.length,
    sparePorts: 6 - premiseIds.length,
    maxRoutedDropFt: 0,
    color,
  };
}

export function updateGroupPortCount(
  group: ServiceGroup,
  newPortCount: number,
): ServiceGroup {
  return {
    ...group,
    mstPortCount: newPortCount,
    portDemand: group.premiseIds.length,
    sparePorts: newPortCount - group.premiseIds.length,
  };
}

export function computeMaxDropDistance(
  group: ServiceGroup,
  mstPosition: LngLat | null,
  premises: Map<string, PointElement>,
): number {
  if (!mstPosition) return 0;
  let maxDist = 0;
  for (const pid of group.premiseIds) {
    const premise = premises.get(pid);
    if (premise) {
      const d = distanceFt(mstPosition, premise.position);
      if (d > maxDist) maxDist = d;
    }
  }
  return Math.round(maxDist);
}

export interface GroupValidation {
  isValid: boolean;
  issues: string[];
}

export function validateServiceGroup(
  group: ServiceGroup,
  maxDropFt: number,
): GroupValidation {
  const issues: string[] = [];

  if (group.premiseIds.length === 0) {
    issues.push("No premises assigned to this group");
  }

  if (group.portDemand > group.mstPortCount) {
    issues.push(`Port demand (${group.portDemand}) exceeds MST capacity (${group.mstPortCount})`);
  }

  if (group.sparePorts > group.mstPortCount / 2) {
    issues.push(`Excessive spare capacity: ${group.sparePorts} of ${group.mstPortCount} ports unused`);
  }

  if (group.maxRoutedDropFt > maxDropFt) {
    issues.push(`Max routed drop (${group.maxRoutedDropFt}ft) exceeds limit (${maxDropFt}ft)`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

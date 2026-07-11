// HLD 2 service group and MST planning model.
export interface ServiceGroup {
  id: string;
  mstId: string;
  premiseIds: string[];
  portDemand: number;
  capacity: number;
  sparePorts: number;
  status: "draft" | "final";
  rationale?: string;
}

export interface MSTDevice {
  id: string;
  portCount: number;
  portDemand: number;
  sparePorts: number;
}

const PORT_CAPACITIES = [4, 6, 8, 12, 24] as const;

export function createServiceGroup(mstId: string, portCount: number): ServiceGroup {
  return { id: crypto.randomUUID(), mstId, premiseIds: [], portDemand: 0, capacity: portCount, sparePorts: portCount, status: "draft" };
}

export function assignPremiseToGroup(group: ServiceGroup, premiseId: string): ServiceGroup {
  if (group.premiseIds.includes(premiseId)) return group;
  if (group.premiseIds.length >= group.capacity) return group;
  return {
    ...group,
    premiseIds: [...group.premiseIds, premiseId],
    portDemand: group.portDemand + 1,
    sparePorts: group.sparePorts - 1,
  };
}

export function validateServiceGroups(groups: ServiceGroup[], allPremiseIds: string[]): string[] {
  const issues: string[] = [];
  const assigned = new Set(groups.flatMap((g) => g.premiseIds));

  for (const pid of allPremiseIds) {
    if (!assigned.has(pid)) issues.push(`Unassigned premise: ${pid}`);
  }

  for (const g of groups) {
    if (g.sparePorts < 0) issues.push(`MST ${g.mstId} exceeds capacity`);
    if (g.sparePorts > g.capacity * 0.5) issues.push(`MST ${g.mstId} has excessive spare capacity`);
  }

  return issues;
}

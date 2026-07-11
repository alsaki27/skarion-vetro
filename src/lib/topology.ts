// HLD 4 — closure service sets and FDH topology.
export interface ClosureServiceSet {
  id: string;
  closureId: string;
  premiseId: string;
  serviceGroupId: string;
  mstId: string;
}

export interface FDHLink {
  id: string;
  fdhId: string;
  closureId: string;
  routeType: "distribution" | "feeder";
}

export interface TopologyNode {
  id: string;
  type: "premise" | "mst" | "closure" | "fdh";
  parentId?: string;
}

export function traceUpstream(nodes: TopologyNode[], startId: string): string[] {
  const path: string[] = [];
  let current: TopologyNode | undefined = nodes.find((n) => n.id === startId);
  while (current) {
    path.push(current.id);
    current = current.parentId ? nodes.find((n) => n.id === current!.parentId) : undefined;
    if (current && path.includes(current.id)) break;
  }
  return path;
}

export function validateTopology(nodes: TopologyNode[]): string[] {
  const issues: string[] = [];
  for (const n of nodes) {
    if (n.type === "premise" && !n.parentId) {
      issues.push(`Premise ${n.id} has no upstream connection`);
    }
  }
  const orphans = nodes.filter((n) => n.parentId && !nodes.find((p) => p.id === n.parentId));
  for (const o of orphans) {
    issues.push(`Orphan: ${o.id} references missing parent ${o.parentId}`);
  }
  const seen = new Set<string>();
  for (const n of nodes) {
    if (seen.has(n.id)) issues.push(`Duplicate node: ${n.id}`);
    seen.add(n.id);
  }
  return issues;
}

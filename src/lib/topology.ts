import type { PointElement, LineElement } from "./types";

export interface TopologyTrace {
  premiseId: string;
  mstId: string | null;
  closureId: string | null;
  fdhId: string | null;
  isComplete: boolean;
}

/** Build an upstream trace from every premise to the FDH/CO */
export function traceUpstream(
  points: PointElement[],
  lines: LineElement[],
): TopologyTrace[] {
  // Build adjacency: element id → connected element ids via lines
  const adjacency = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  };

  for (const line of lines) {
    if (line.startElementId && line.endElementId) {
      link(line.startElementId, line.endElementId);
    }
  }

  // Also traverse containment: hosted element → container
  for (const p of points) {
    if (p.parent_container_id) {
      link(p.id, p.parent_container_id);
    }
  }

  const premises = points.filter((p) => p.type === "premise");
  const msts = new Set(points.filter((p) => p.type === "mst").map((p) => p.id));
  const closures = new Set(points.filter((p) => p.type === "splice_closure").map((p) => p.id));
  const fdhs = new Set(points.filter((p) => p.type === "fdh_cabinet").map((p) => p.id));
  const cos = new Set(points.filter((p) => p.type === "co").map((p) => p.id));

  const traces: TopologyTrace[] = [];

  for (const premise of premises) {
    const visited = new Set<string>();
    const queue: string[] = [premise.id];
    let foundMst: string | null = null;
    let foundClosure: string | null = null;
    let foundFdh: string | null = null;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (msts.has(current) && !foundMst) foundMst = current;
      if (closures.has(current) && !foundClosure) foundClosure = current;
      if (fdhs.has(current) && !foundFdh) foundFdh = current;
      if (cos.has(current)) break; // Reached the CO — trace complete

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }

    const isComplete = foundMst !== null && foundFdh !== null;

    traces.push({
      premiseId: premise.id,
      mstId: foundMst,
      closureId: foundClosure,
      fdhId: foundFdh,
      isComplete,
    });
  }

  return traces;
}

export function findOrphanElements(
  points: PointElement[],
  lines: LineElement[],
): string[] {
  const orphans: string[] = [];
  const connected = new Set<string>();

  for (const line of lines) {
    if (line.startElementId) connected.add(line.startElementId);
    if (line.endElementId) connected.add(line.endElementId);
  }

  for (const p of points) {
    if (!connected.has(p.id) && p.type !== "premise") {
      orphans.push(p.id);
    }
  }

  return orphans;
}

// Deterministic numbering for LLD: FOC segments, closures, terminals.
export interface NetworkGraph {
  nodes: { id: string; type: string; x: number; y: number }[];
  edges: { from: string; to: string; length: number }[];
}

export interface NumberingResult {
  id: string;
  displayNumber: string;
  type: string;
}

export function assignNumbers(graph: NetworkGraph, fdhId: string): NumberingResult[] {
  const results: NumberingResult[] = [];
  const adjacency = new Map<string, { id: string; length: number }[]>();
  for (const e of graph.edges) {
    if (!adjacency.has(e.from)) adjacency.set(e.from, []);
    if (!adjacency.has(e.to)) adjacency.set(e.to, []);
    adjacency.get(e.from)!.push({ id: e.to, length: e.length });
    adjacency.get(e.to)!.push({ id: e.from, length: e.length });
  }

  const visited = new Set<string>();
  const queue: { id: string; depth: number; prefix: string }[] = [{ id: fdhId, depth: 0, prefix: "FDH" }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    results.push({ id: current.id, displayNumber: current.prefix, type: graph.nodes.find((n) => n.id === current.id)?.type ?? "unknown" });

    const neighbors = (adjacency.get(current.id) ?? [])
      .filter((n) => !visited.has(n.id))
      .sort((a, b) => b.length - a.length);

    for (const n of neighbors) {
      queue.push({ id: n.id, depth: current.depth + 1, prefix: `${current.prefix}-${n.id.slice(0, 4)}` });
    }
  }

  return results;
}

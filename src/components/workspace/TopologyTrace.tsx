"use client";

import { useDesignStore } from "@/lib/store";
import { traceUpstream } from "@/lib/topology";
import type { TopologyNode } from "@/lib/topology";

export function TopologyTrace() {
  const selectedId = useDesignStore((s) => s.selectedId);
  const elements = useDesignStore((s) => s.elements);
  const closureServiceSets = useDesignStore((s) => s.closureServiceSets);

  if (!selectedId) {
    return <div className="text-xs text-zinc-500 px-1">Select an element to trace upstream.</div>;
  }

  const el = elements[selectedId];
  if (!el) return <div className="text-xs text-zinc-500 px-1">Element not found.</div>;

  // Build topology nodes from elements
  const nodes: TopologyNode[] = [];
  for (const [id, e] of Object.entries(elements)) {
    if (e.type === "premise" || e.type === "mst" || e.type === "splice_closure" || e.type === "fdh_cabinet") {
      // Find parent via connectivity graph
      const parent = (e as { startElementId?: string }).startElementId;
      nodes.push({ id, type: e.type === "splice_closure" ? "closure" : e.type === "fdh_cabinet" ? "fdh" : e.type, parentId: parent });
    }
  }

  const path = traceUpstream(nodes, selectedId);

  const sets = Object.values(closureServiceSets).filter((s) =>
    s.premiseId === selectedId || s.mstId === selectedId || s.closureId === selectedId
  );

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Trace</div>
      </div>

      <div className="rounded bg-zinc-800/50 p-2">
        <div className="text-zinc-300 mb-1">Upstream from {el.type}</div>
        {path.length === 0 ? (
          <div className="text-zinc-500">No upstream path found.</div>
        ) : (
          <div className="space-y-0.5">
            {path.map((id, i) => {
              const node = nodes.find((n) => n.id === id);
              return (
                <div key={i} className="flex items-center gap-1 text-[10px]">
                  <span className="text-zinc-600">{i > 0 ? "↑" : "●"}</span>
                  <span className="text-zinc-400">{node?.type ?? "?"}</span>
                  <span className="text-zinc-300 truncate">{id.substring(0, 12)}</span>
                  {node?.parentId && (
                    <span className="text-zinc-600">→ {node.parentId.substring(0, 12)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {sets.length > 0 && (
        <div className="rounded bg-zinc-800/50 p-2">
          <div className="text-zinc-300 mb-1">Service Sets</div>
          <div className="space-y-1">
            {sets.map((s) => (
              <div key={s.id} className="text-[10px] text-zinc-400">
                <div>Closure: {s.closureId.substring(0, 12)}</div>
                <div>MST: {s.mstId.substring(0, 12)}</div>
                <div>Premise: {s.premiseId.substring(0, 12)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

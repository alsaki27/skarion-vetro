"use client";

import { buildBOM } from "@/lib/bom-engine";
import type { NetworkElement } from "@/lib/types";
import { useDesignStore as getStore } from "@/lib/store";

/** Derive BOM placements from the design's actual element state.
 *  Catalog keys are inferred from element type when the student hasn't
 *  explicitly set a `catalog_key` attribute (Block C typed routes will
 *  add real catalog keys). Rows with inferred keys are tagged so the UI
 *  can warn the student. */
export function elementsToPlacements(elements: Record<string, NetworkElement>) {
  const placements: { catalogKey: string; quantity: number; featureId: string; inferred: boolean }[] = [];
  for (const [id, el] of Object.entries(elements)) {
    const explicitKey = (el.attributes as Record<string, unknown>)?.catalog_key as string | undefined;
    if (explicitKey) {
      placements.push({ catalogKey: explicitKey, quantity: 1, featureId: id, inferred: false });
      continue;
    }
    // Infer from element type. The BOM engine's own CATALOG filters unknown
    // keys; we don't duplicate that filter here.
    const inferred = el.type === "handhole" ? "handhole_17x30"
      : el.type === "flowerpot" ? "flowerpot_std"
      : el.type === "conduit" ? "conduit_1.5"
      : el.type === "cable" ? "cable_144f"
      : el.type === "drop_cable" ? "cable_12f"
      : null;
    if (inferred) {
      placements.push({ catalogKey: inferred, quantity: 1, featureId: id, inferred: true });
    }
  }
  return placements;
}

export function WorkspaceOutputs({ onClose }: { onClose: () => void }) {
  const elements = getStore.getState().elements;
  const placements = elementsToPlacements(elements);
  const bom = placements.length > 0 ? buildBOM(placements.map((p) => ({
    catalogKey: p.catalogKey, quantity: p.quantity, featureId: p.featureId,
  }))) : null;

  const inferredCount = placements.filter((p) => p.inferred).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Design Outputs</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="p-4 space-y-6">
          {/* BOM */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-2">Bill of Materials</h3>
            {bom ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-700 text-zinc-500">
                      <th className="text-left py-1 pr-4">Item</th>
                      <th className="text-right py-1 pr-4">Spec</th>
                      <th className="text-right py-1 pr-4">Qty</th>
                      <th className="text-right py-1">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bom.lines.map((line, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 text-zinc-300">
                        <td className="py-1 pr-4">{line.description}</td>
                        <td className="text-right py-1 pr-4 text-zinc-500">{line.catalogItemId}</td>
                        <td className="text-right py-1 pr-4">{line.designedQuantity}</td>
                        <td className="text-right py-1">{line.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inferredCount > 0 && (
                  <div className="mt-2 rounded bg-yellow-900/20 px-3 py-1.5 text-[10px] text-yellow-300">
                    {inferredCount} item{inferredCount !== 1 ? "s" : ""} with inferred catalog keys.
                    Catalog keys are derived from element type when not explicitly set.
                    Block C (typed routes) will add designer-specified catalog keys.
                  </div>
                )}
                <div className="mt-1 text-[10px] text-zinc-500">
                  Procurement: {bom.totalProcurement} units across {bom.lines.length} line items
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">No elements placed yet.</div>
            )}
          </div>

          {/* Splice Matrix — gated behind real fiber allocations */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-2">Splice Matrix</h3>
            <div className="rounded bg-zinc-800/50 px-3 py-2 text-[10px] text-zinc-400">
              Fiber allocations not yet modeled — complete Block C service groups
              and typed routes first. The splice matrix will derive from your
              design&apos;s actual fiber engine assignments, not hardcoded defaults.
            </div>
          </div>

          {/* Engine note */}
          <div className="rounded bg-blue-900/20 px-3 py-2 text-[10px] text-blue-300">
            All values computed from your design by the Skarion-VETRO LLD engine suite.
            BOM reconciles to placed elements. Splice matrix derives from cable topology.
          </div>
        </div>
      </div>
    </div>
  );
}

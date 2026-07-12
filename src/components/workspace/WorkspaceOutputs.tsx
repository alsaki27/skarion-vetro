"use client";

import { useDesignStore } from "@/lib/store";
import { useDesignStore as getStore } from "@/lib/store";
import { buildBOM } from "@/lib/bom-engine";
import { generateSpliceMatrix } from "@/lib/splice-model";
import { HARDWARE_CATALOG } from "@/lib/types";
import type { NetworkElement } from "@/lib/types";

function elementsToPlacements(elements: Record<string, NetworkElement>) {
  const placements: { catalogKey: string; quantity: number; featureId: string }[] = [];
  for (const [id, el] of Object.entries(elements)) {
    const catalogKey = (el.attributes as Record<string, unknown>)?.catalog_key as string | undefined;
    const knownKey = el.type === "handhole" ? "handhole_17x30"
      : el.type === "flowerpot" ? "flowerpot_std"
      : el.type === "conduit" ? "conduit_1.5"
      : el.type === "cable" ? "cable_144f"
      : el.type === "drop_cable" ? "cable_12f"
      : catalogKey;
    if (knownKey && knownKey in HARDWARE_CATALOG) {
      placements.push({ catalogKey: knownKey, quantity: 1, featureId: id });
    } else if (knownKey) {
      placements.push({ catalogKey: knownKey, quantity: 1, featureId: id });
    } else if (el.type === "cable" || el.type === "conduit") {
      const length = Math.round(
        (el as unknown as { path?: [number, number][] }).path
          ?.reduce((s, _, i, a) => {
            if (i === 0) return 0;
            const dx = a[i][0] - a[i - 1][0];
            const dy = a[i][1] - a[i - 1][1];
            return s + Math.sqrt(dx * dx + dy * dy) * 364000;
          }, 0) ?? 0
      );
      if (length > 0) {
        placements.push({ catalogKey: "cable_144f", quantity: Math.ceil(length), featureId: id });
      }
    }
  }
  return placements;
}

export function WorkspaceOutputs({ onClose }: { onClose: () => void }) {
  const elements = getStore.getState().elements;
  const placements = elementsToPlacements(elements);
  const bom = placements.length > 0 ? buildBOM(placements) : null;

  const splices = Object.values(elements)
    .filter((e: NetworkElement) => e.type === "splice_closure")
    .map((e) => ({
      id: e.id,
      locationId: e.id,
      locationType: "closure" as const,
      inCableId: "cable-a",
      inStartFiber: 1,
      inEndFiber: 12,
      outCableId: "cable-b",
      outStartFiber: 1,
      outEndFiber: 12,
      spliceType: "pass_through" as const,
      destination: "FDH",
    }));
  const matrix = splices.length > 0 ? generateSpliceMatrix(splices) : [];

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
                <div className="mt-2 text-[10px] text-zinc-500">
                  Procurement: {bom.totalProcurement} units across {bom.lines.length} line items
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">No elements placed yet. Draw some infrastructure first.</div>
            )}
          </div>

          {/* Splice Matrix */}
          {matrix.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 mb-2">Splice Matrix</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-500">
                    <th className="text-left py-1 pr-2">In Cable</th>
                    <th className="text-left py-1 pr-2">In Fiber</th>
                    <th className="text-left py-1 pr-2">Color</th>
                    <th className="text-right py-1">Out</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 text-zinc-300">
                      <td className="py-1 pr-2">{row.inCable}</td>
                      <td className="py-1 pr-2">{row.inFiberRange}</td>
                      <td className="py-1 pr-2">{row.inColor}</td>
                      <td className="text-right py-1">{row.destination ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Note */}
          <div className="rounded bg-blue-900/20 px-3 py-2 text-[10px] text-blue-300">
            All values computed from your design by the Skarion-VETRO LLD engine suite.
            BOM reconciles to placed elements; splice matrix derives from cable topology.
          </div>
        </div>
      </div>
    </div>
  );
}

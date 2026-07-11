"use client";

import { useState } from "react";
import { useDesignStore } from "@/lib/store";
import { isLineElement, isPointElement, type LineElement } from "@/lib/types";

const TUBE_COLORS = [
  { num: 1, color: "blue" },
  { num: 2, color: "orange" },
  { num: 3, color: "green" },
  { num: 4, color: "brown" },
  { num: 5, color: "slate" },
  { num: 6, color: "white" },
  { num: 7, color: "red" },
  { num: 8, color: "black" },
  { num: 9, color: "yellow" },
  { num: 10, color: "violet" },
  { num: 11, color: "rose" },
  { num: 12, color: "aqua" },
];

function generateFiberId(): string {
  return `fiber_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function SpliceTable() {
  const elements = useDesignStore((s) => s.elements);
  const updateAttributes = useDesignStore((s) => s.updateAttributes);
  const [selectedCable, setSelectedCable] = useState<string>("");

  const cables = Object.values(elements).filter(
    (e) => isLineElement(e) && e.type === "cable",
  ) as LineElement[];

  const closures = Object.values(elements).filter((e) =>
    isPointElement(e) && (e.type === "splice_closure" || e.type === "handhole"),
  );

  // Get existing fiber assignments from a cable
  const cable = selectedCable ? elements[selectedCable] : null;
  const existingAssignments = cable && isLineElement(cable)
    ? (cable.attributes.fiber_assignments as Array<{
        fiberId: string; tube: number; fiber: number; color: string;
        startElementId?: string; endElementId?: string;
      }> | undefined) ?? []
    : [];

  const addFiber = (tube: number, fiber: number, color: string) => {
    if (!selectedCable) return;
    const fiberId = generateFiberId();
    const assignments = [
      ...existingAssignments,
      { fiberId, tube, fiber, color, startElementId: "", endElementId: "" },
    ];
    updateAttributes(selectedCable, { fiber_assignments: assignments });
  };

  const removeFiber = (fiberId: string) => {
    if (!selectedCable) return;
    const assignments = existingAssignments.filter((a) => a.fiberId !== fiberId);
    updateAttributes(selectedCable, { fiber_assignments: assignments });
  };

  const updateFiber = (fiberId: string, key: string, value: string) => {
    const assignments = existingAssignments.map((a) =>
      a.fiberId === fiberId ? { ...a, [key]: value } : a,
    );
    if (selectedCable) updateAttributes(selectedCable, { fiber_assignments: assignments });
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Cable selector */}
      <div>
        <label className="mb-1 block text-zinc-400">Select cable</label>
        <select
          className="w-full rounded border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-200"
          value={selectedCable}
          onChange={(e) => setSelectedCable(e.target.value)}
        >
          <option value="">— choose —</option>
          {cables.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label ?? c.id.slice(-8)} ({Math.round(c.attributes.cable_count as number ?? 12)}-ct)
            </option>
          ))}
        </select>
      </div>

      {!selectedCable && (
        <p className="text-zinc-500">Select a cable to view and manage its fiber assignments.</p>
      )}

      {selectedCable && (
        <>
          {/* Existing assignments table */}
          {existingAssignments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="text-zinc-500">
                    <th className="border border-zinc-700 px-1 py-0.5 text-left">Tube</th>
                    <th className="border border-zinc-700 px-1 py-0.5 text-left">Fiber</th>
                    <th className="border border-zinc-700 px-1 py-0.5 text-left">Color</th>
                    <th className="border border-zinc-700 px-1 py-0.5 text-left">A-end</th>
                    <th className="border border-zinc-700 px-1 py-0.5 text-left">B-end</th>
                    <th className="border border-zinc-700 px-1 py-0.5" />
                  </tr>
                </thead>
                <tbody>
                  {existingAssignments.map((a) => (
                    <tr key={a.fiberId} className="text-zinc-300">
                      <td className="border border-zinc-800 px-1 py-0.5">{a.tube}</td>
                      <td className="border border-zinc-800 px-1 py-0.5">{a.fiber}</td>
                      <td className="border border-zinc-800 px-1 py-0.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: colorMap[a.color] ?? "#666" }}
                        />{" "}
                        {a.color}
                      </td>
                      <td className="border border-zinc-800 px-1 py-0.5">
                        <input
                          className="w-16 bg-transparent text-zinc-300 outline-none"
                          value={a.startElementId ?? ""}
                          onChange={(e) => updateFiber(a.fiberId, "startElementId", e.target.value)}
                          placeholder="elem id"
                        />
                      </td>
                      <td className="border border-zinc-800 px-1 py-0.5">
                        <input
                          className="w-16 bg-transparent text-zinc-300 outline-none"
                          value={a.endElementId ?? ""}
                          onChange={(e) => updateFiber(a.fiberId, "endElementId", e.target.value)}
                          placeholder="elem id"
                        />
                      </td>
                      <td className="border border-zinc-800 px-1 py-0.5">
                        <button
                          onClick={() => removeFiber(a.fiberId)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 text-[10px] text-zinc-600">
                {existingAssignments.length} fiber(s) assigned
              </p>
            </div>
          )}

          {/* Add fiber button */}
          <div>
            <p className="mb-1 text-zinc-400">Add fiber assignment</p>
            <div className="flex flex-wrap gap-1">
              {TUBE_COLORS.slice(0, Number(cable && isLineElement(cable) ? cable.attributes.cable_count ?? 12 : 12)).map((tc) => (
                <button
                  key={tc.num}
                  onClick={() => addFiber(tc.num, 1, tc.color)}
                  className="flex items-center gap-1 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-600"
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorMap[tc.color] }} />
                  T{tc.num}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Splice table view */}
      {closures.length > 0 && existingAssignments.length > 0 && (
        <div>
          <p className="mb-1 text-zinc-400">Splice points</p>
          <div className="space-y-2">
            {closures.map((cl) => {
              const clPoint = isPointElement(cl) ? cl : null;
              const location = clPoint?.label ?? cl.id.slice(-8);
              const fibersHere = existingAssignments.filter(
                (a) => a.startElementId === cl.id || a.endElementId === cl.id,
              );
              if (fibersHere.length === 0) return null;
              return (
                <div key={cl.id} className="rounded border border-zinc-700 bg-zinc-800/50 p-2">
                  <p className="mb-1 font-semibold text-zinc-200">{location}</p>
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      <tr className="text-zinc-500">
                        <th className="pr-1 text-left">In</th>
                        <th className="pr-1 text-left">Tube</th>
                        <th className="pr-1 text-left">Fiber</th>
                        <th className="pr-1 text-left">Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fibersHere.map((f) => (
                        <tr key={f.fiberId} className="text-zinc-300">
                          <td className="pr-1">{f.startElementId?.slice(-6) ?? "—"}</td>
                          <td className="pr-1">{f.tube}</td>
                          <td className="pr-1">{f.fiber}</td>
                          <td className="pr-1">{f.endElementId?.slice(-6) ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedCable && existingAssignments.length === 0 && (
        <p className="text-zinc-500">No fiber assignments yet. Add fibers from the tube color chart above.</p>
      )}
    </div>
  );
}

const colorMap: Record<string, string> = {
  blue: "#3b82f6",
  orange: "#f97316",
  green: "#22c55e",
  brown: "#78350f",
  slate: "#64748b",
  white: "#e2e8f0",
  red: "#ef4444",
  black: "#1a1a1a",
  yellow: "#eab308",
  violet: "#8b5cf6",
  rose: "#e11d48",
  aqua: "#06b6d4",
};

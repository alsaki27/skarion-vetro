"use client";

import { useState } from "react";
import { useDesignStore } from "@/lib/store";

const GROUP_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export function ServiceGroupPanel() {
  const serviceGroups = useDesignStore((s) => s.serviceGroups);
  const createServiceGroup = useDesignStore((s) => s.createServiceGroup);
  const setGroupMstSize = useDesignStore((s) => s.setGroupMstSize);
  const deleteServiceGroup = useDesignStore((s) => s.deleteServiceGroup);
  const select = useDesignStore((s) => s.select);
  const elements = useDesignStore((s) => s.elements);

  const [multiSelect, setMultiSelect] = useState(false);

  const groups = Object.values(serviceGroups);
  const nextColor = GROUP_COLORS[groups.length % GROUP_COLORS.length];

  const create = () => {
    const name = `Group ${groups.length + 1}`;
    // Use currently selected elements as premise members
    const selectedPremises = Object.values(elements)
      .filter((e) => e.type === "premise" && e.attributes.serviceable === true)
      .slice(0, Math.min(5, Object.values(elements).filter((e) => e.type === "premise" && e.attributes.serviceable === true).length));
    if (selectedPremises.length === 0) return;
    createServiceGroup(name, selectedPremises.map((p) => p.id), nextColor);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Service Groups</div>
        <button
          onClick={create}
          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700"
        >
          + Group
        </button>
      </div>

      {groups.length === 0 && (
        <div className="text-xs text-zinc-500 px-1">
          No groups yet. Select premises on the map and create a service group.
        </div>
      )}

      {groups.map((g) => (
        <div
          key={g.id}
          className="rounded border border-zinc-700/50 bg-zinc-800/30 p-2 space-y-1"
          style={{ borderLeftColor: g.color, borderLeftWidth: 3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
              <span className="text-xs text-zinc-200 font-medium">{g.name}</span>
            </div>
            <button
              onClick={() => deleteServiceGroup(g.id)}
              className="text-[10px] text-zinc-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
          <div className="text-[10px] text-zinc-500">
            {g.premiseIds.length} premises · {g.mstSize}-port MST
          </div>
          <div className="flex gap-1">
            {[4, 6, 8].map((size) => (
              <button
                key={size}
                onClick={() => setGroupMstSize(g.id, size as 4 | 6 | 8)}
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  g.mstSize === size
                    ? "bg-zinc-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {size}p
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

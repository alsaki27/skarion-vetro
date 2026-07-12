"use client";

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
  const selectedIds = useDesignStore((s) => s.selectedIds);
  const elements = useDesignStore((s) => s.elements);

  const groups = Object.values(serviceGroups);
  const nextColor = GROUP_COLORS[groups.length % GROUP_COLORS.length];

  // All premise ids already assigned to some group
  const assignedIds = new Set(groups.flatMap((g) => g.premiseIds));

  // Selected premises eligible for grouping: selected, serviceable, ungrouped
  const eligible = [...selectedIds]
    .map((id) => elements[id])
    .filter((e) => e && e.type === "premise" && e.attributes.serviceable === true && !assignedIds.has(e.id));

  const alreadyAssignedCount = [...selectedIds].filter((id) => assignedIds.has(id)).length;

  const create = () => {
    if (eligible.length === 0) return;
    const name = `Group ${groups.length + 1}`;
    createServiceGroup(name, eligible.map((e) => e.id), nextColor);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Service Groups</div>
        <button
          onClick={create}
          disabled={eligible.length === 0}
          className={`rounded px-1.5 py-0.5 text-[10px] ${
            eligible.length === 0
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          + Group ({eligible.length})
        </button>
      </div>

      {eligible.length === 0 && selectedIds.size > 0 && (
        <div className="text-[10px] text-zinc-500 px-1">
          {alreadyAssignedCount > 0
            ? `${alreadyAssignedCount} selected premise(s) already in a group. Select ungrouped premises.`
            : "Select serviceable premises on the map (shift-click or drag-select) to create a group."}
        </div>
      )}

      {eligible.length === 0 && selectedIds.size === 0 && (
        <div className="text-[10px] text-zinc-500 px-1">
          Use shift-click or drag-select on the map to select premises, then create a service group.
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

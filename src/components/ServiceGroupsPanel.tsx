"use client";

import { useState, useMemo } from "react";
import { useDesignStore } from "@/lib/store";
import { isPointElement, isLineElement } from "@/lib/types";
import {
  createServiceGroup,
  updateGroupPortCount,
  computeMaxDropDistance,
  validateServiceGroup,
  type ServiceGroup,
} from "@/lib/service-groups";
import { distanceFt } from "@/lib/geometry";

const MST_PORT_OPTIONS = [4, 6, 8, 12];

export default function ServiceGroupsPanel({ maxDropFt = 150 }: { maxDropFt?: number }) {
  const elements = useDesignStore((s) => s.elements);
  const updateAttributes = useDesignStore((s) => s.updateAttributes);

  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const premises = useMemo(
    () => Object.values(elements).filter((e) => isPointElement(e) && e.type === "premise"),
    [elements],
  );

  const premisesMap = useMemo(() => {
    const map = new Map<string, typeof premises[number]>();
    for (const p of premises) {
      if (isPointElement(p)) map.set(p.id, p);
    }
    return map;
  }, [premises]);

  const unassigned = useMemo(() => {
    const assigned = new Set<string>();
    for (const g of groups) {
      for (const pid of g.premiseIds) assigned.add(pid);
    }
    return premises.filter((p) => !assigned.has(p.id));
  }, [premises, groups]);

  const addGroup = () => {
    const group = createServiceGroup([]);
    setGroups((prev) => [...prev, group]);
    setSelectedGroup(group.id);
  };

  const assignPremise = (groupId: string, premiseId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const newPremises = [...g.premiseIds, premiseId];
        return { ...g, premiseIds: newPremises, portDemand: newPremises.length, sparePorts: g.mstPortCount - newPremises.length };
      }),
    );
  };

  const removePremise = (groupId: string, premiseId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const newPremises = g.premiseIds.filter((p) => p !== premiseId);
        return { ...g, premiseIds: newPremises, portDemand: newPremises.length, sparePorts: g.mstPortCount - newPremises.length };
      }),
    );
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Service Groups
        </h3>
        <button onClick={addGroup} className="rounded bg-blue-600 px-2 py-1 text-[10px] text-white hover:bg-blue-500">
          + New Group
        </button>
      </div>

      {unassigned.length > 0 && (
        <div className="rounded border border-zinc-700 bg-zinc-800/50 p-2">
          <p className="text-[10px] text-zinc-500">{unassigned.length} unassigned premises</p>
        </div>
      )}

      {groups.length === 0 && (
        <p className="text-zinc-500">No service groups yet. Create a group to start assigning premises.</p>
      )}

      {groups.map((group) => {
        const validation = validateServiceGroup(group, maxDropFt);

        return (
          <div
            key={group.id}
            className={`rounded-lg border p-2 ${
              selectedGroup === group.id ? "border-blue-500" : "border-zinc-700"
            }`}
            style={{ borderLeftColor: group.color, borderLeftWidth: 3 }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-white">{group.label}</span>
              <span className={`text-[10px] ${validation.isValid ? "text-green-400" : "text-red-400"}`}>
                {group.premiseIds.length} premises
              </span>
            </div>

            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">MST ports:</span>
              <select
                value={group.mstPortCount}
                onChange={(e) => {
                  const updated = updateGroupPortCount(group, Number(e.target.value));
                  setGroups((prev) => prev.map((g) => (g.id === group.id ? updated : g)));
                }}
                className="rounded bg-zinc-700 px-1 py-0.5 text-[10px] text-zinc-200"
              >
                {MST_PORT_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}-port</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 text-[10px] text-zinc-500">
              <span>Demand: {group.portDemand}</span>
              <span>Spare: {group.sparePorts}</span>
            </div>

            {!validation.isValid && (
              <div className="mt-1 space-y-0.5">
                {validation.issues.map((issue, i) => (
                  <p key={i} className="text-[10px] text-red-400">{issue}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

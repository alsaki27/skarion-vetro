"use client";

import { useState, useMemo } from "react";
import { useDesignStore } from "@/lib/store";
import { isPointElement, isLineElement } from "@/lib/types";

const AVAILABLE_LAYERS = [
  { id: "all", label: "All Features" },
  { id: "pole", label: "Poles" },
  { id: "handhole", label: "Handholes" },
  { id: "cable", label: "Cables" },
  { id: "drop_cable", label: "Drop Cables" },
  { id: "premise", label: "Premises" },
];

export function BottomPanel({ projectId: _projectId }: { projectId: string }) {
  const [selectedLayer, setSelectedLayer] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterText, setFilterText] = useState("");
  const elements = useDesignStore((s) => s.elements);
  const select = useDesignStore((s) => s.select);

  const rows = useMemo(() => {
    const all = Object.values(elements);
    let filtered = all;
    if (selectedLayer !== "all") {
      filtered = all.filter((e) => e.type === selectedLayer);
    }
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      filtered = filtered.filter((e) =>
        (e.label ?? "").toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const av = String(a.attributes[sortKey] ?? "");
        const bv = String(b.attributes[sortKey] ?? "");
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return filtered;
  }, [elements, selectedLayer, filterText, sortKey, sortAsc]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-2 py-1">
        <select
          value={selectedLayer}
          onChange={(e) => setSelectedLayer(e.target.value)}
          className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-100 outline-none"
        >
          {AVAILABLE_LAYERS.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter…"
          className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none w-40"
        />
        <span className="ml-auto text-[10px] text-zinc-500">{rows.length} features</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-900">
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">ID</th>
              <th className="px-2 py-1 text-left">Label</th>
              <th className="px-2 py-1 text-left cursor-pointer" onClick={() => handleSort("catalog_key")}>Catalog</th>
              <th className="px-2 py-1 text-left">Coords</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const coords = isPointElement(row)
                ? `${row.position[0].toFixed(4)}, ${row.position[1].toFixed(4)}`
                : isLineElement(row)
                ? `${row.path.length} pts`
                : "—";
              return (
                <tr
                  key={row.id}
                  onClick={() => select(row.id)}
                  className="cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/50 text-zinc-300"
                >
                  <td className="px-2 py-1">{row.type}</td>
                  <td className="px-2 py-1 text-zinc-500">{row.id.slice(0, 8)}</td>
                  <td className="px-2 py-1">{row.label ?? "—"}</td>
                  <td className="px-2 py-1">{String(row.attributes.catalog_key ?? "—")}</td>
                  <td className="px-2 py-1 text-zinc-500">{coords}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-2 text-zinc-500 italic text-center">
                  No features match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

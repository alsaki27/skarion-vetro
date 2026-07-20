"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDesignStore } from "@/lib/store";
import { isPointElement, isLineElement } from "@/lib/types";
import type { NetworkElement } from "@/lib/types";

const LAYERS = [
  { id: "all", label: "All Features" },
  { id: "pole", label: "Poles" },
  { id: "handhole", label: "Handholes" },
  { id: "vault", label: "Vaults" },
  { id: "flowerpot", label: "Flowerpots" },
  { id: "mst", label: "MSTs" },
  { id: "cable", label: "Cables" },
  { id: "conduit", label: "Conduits" },
  { id: "drop_cable", label: "Drop Cables" },
  { id: "premise", label: "Premises" },
  { id: "splitter", label: "Splitters" },
  { id: "co", label: "Central Offices" },
];

const COLUMNS: { key: string; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "id", label: "ID" },
  { key: "label", label: "Label" },
  { key: "catalog_key", label: "Catalog" },
  { key: "coords", label: "Coordinates" },
  { key: "cable_count", label: "Cable Ct" },
  { key: "port_count", label: "Ports" },
];

interface AttributeTableProps {
  projectId: string;
}

export function AttributeTable({ projectId: _projectId }: AttributeTableProps) {
  const elements = useDesignStore((s) => s.elements);
  const selectedId = useDesignStore((s) => s.selectedId);
  const select = useDesignStore((s) => s.select);

  const [layerType, setLayerType] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(COLUMNS.map((c) => c.key)));
  const [showColMenu, setShowColMenu] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const all = Object.values(elements);
    let filtered = layerType === "all" ? all : all.filter((e) => e.type === layerType);
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
  }, [elements, layerType, filterText, sortKey, sortAsc]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 10,
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const toggleCol = useCallback((key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const exportCsv = useCallback(() => {
    const header = ["type", "id", "label", "catalog_key", "lon", "lat", "cable_count", "port_count"];
    const lines = rows.map((r) => {
      const coords = isPointElement(r) ? [r.position[0], r.position[1]] : ["—", "—"];
      return [r.type, r.id, r.label ?? "", r.attributes.catalog_key ?? "", coords[0], coords[1],
        r.attributes.cable_count ?? "", r.attributes.port_count ?? ""].map((v) => `"${v}"`).join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "features.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  // Scroll selected row into view
  useEffect(() => {
    if (selectedId) {
      const idx = rows.findIndex((r) => r.id === selectedId);
      if (idx >= 0) rowVirtualizer.scrollToIndex(idx, { align: "center" });
    }
  }, [selectedId, rows, rowVirtualizer]);

  return (
    <div className="flex h-full flex-col text-xs">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-2 py-1 shrink-0">
        <select value={layerType} onChange={(e) => setLayerType(e.target.value)}
          className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-100 outline-none">
          {LAYERS.map((l) => (<option key={l.id} value={l.id}>{l.label}</option>))}
        </select>
        <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter by id/label…"
          className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-100 placeholder-zinc-500 outline-none w-40" />
        <div className="relative">
          <button onClick={() => setShowColMenu(!showColMenu)}
            className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400 hover:text-zinc-200">Columns</button>
          {showColMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColMenu(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 rounded border border-zinc-700 bg-zinc-900 p-2 shadow-lg">
                {COLUMNS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 py-0.5 text-zinc-300 hover:text-white cursor-pointer">
                    <input type="checkbox" checked={visibleCols.has(c.key)}
                      onChange={() => toggleCol(c.key)} className="accent-zinc-500" />
                    {c.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <button onClick={exportCsv}
          className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400 hover:text-zinc-200">CSV</button>
        <span className="ml-auto text-zinc-500">{rows.length} features</span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-zinc-900 z-10">
            <tr className="border-b border-zinc-800 text-zinc-400">
              {COLUMNS.filter((c) => visibleCols.has(c.key)).map((c) => (
                <th key={c.key}
                  className={`px-2 py-1 text-left ${c.key !== "type" ? "cursor-pointer hover:text-zinc-200" : ""}`}
                  onClick={() => c.key !== "type" && handleSort(c.key)}
                  style={{ width: c.key === "id" ? "90px" : c.key === "coords" ? "140px" : "auto" }}>
                  {c.label}{sortKey === c.key ? (sortAsc ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isSelected = row.id === selectedId;
              return (
                <tr key={row.id}
                  onClick={() => select(row.id)}
                  className={`absolute left-0 w-full cursor-pointer border-b border-zinc-800/50 ${
                    isSelected ? "bg-blue-900/30 text-blue-200" : "text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                  style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }}>
                  {COLUMNS.filter((c) => visibleCols.has(c.key)).map((col) => (
                    <td key={col.key} className="px-2 py-1 truncate">
                      <CellValue row={row} col={col.key} />
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={COLUMNS.length} className="px-2 py-2 text-center text-zinc-500 italic">No features match.</td></tr>
            )}
          </tbody>
        </table>
        {rows.length > 0 && (
          <div className="h-0" style={{ height: rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems().length * 28 }} />
        )}
      </div>
    </div>
  );
}

function CellValue({ row, col }: { row: NetworkElement; col: string }) {
  switch (col) {
    case "type": return <span className="capitalize">{row.type}</span>;
    case "id": return <span className="text-zinc-500 font-mono">{row.id.slice(0, 8)}</span>;
    case "label": return <span>{row.label ?? "—"}</span>;
    case "catalog_key": return <span>{String(row.attributes.catalog_key ?? "—")}</span>;
    case "coords": {
      if (isPointElement(row)) {
        return <span className="text-zinc-500">{row.position[0].toFixed(4)}, {row.position[1].toFixed(4)}</span>;
      }
      if (isLineElement(row)) {
        return <span className="text-zinc-500">{row.path.length} pts</span>;
      }
      return <span className="text-zinc-500">—</span>;
    }
    case "cable_count": return <span>{String(row.attributes.cable_count ?? "—")}</span>;
    case "port_count": return <span>{String(row.attributes.port_count ?? "—")}</span>;
    default: return <span>—</span>;
  }
}

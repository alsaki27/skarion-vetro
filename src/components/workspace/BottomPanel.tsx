"use client";

import { useState, useMemo, useCallback } from "react";
import { useDesignStore } from "@/lib/store";
import { isPointElement, isLineElement } from "@/lib/types";

const AVAILABLE_LAYERS = [
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

const PAGE_SIZE = 50;

export function BottomPanel({ projectId: _projectId }: { projectId: string }) {
  const [selectedLayer, setSelectedLayer] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(0);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(["type", "id", "label", "catalog", "coords"]));
  const [showColMenu, setShowColMenu] = useState(false);
  const elements = useDesignStore((s) => s.elements);
  const selectedId = useDesignStore((s) => s.selectedId);
  const select = useDesignStore((s) => s.select);
  const grading = useDesignStore((s) => s.grading);

  const COLUMNS = [
    { key: "type", label: "Type" },
    { key: "id", label: "ID" },
    { key: "label", label: "Label" },
    { key: "catalog", label: "Catalog" },
    { key: "coords", label: "Coordinates" },
    { key: "length", label: "Length (ft)" },
    { key: "cable_count", label: "Cable Count" },
    { key: "port_count", label: "Ports" },
    { key: "status", label: "Validation" },
  ];

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

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pagedRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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

  return (
    <div className="flex h-full flex-col text-xs">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-2 py-1 shrink-0">
        <select value={selectedLayer} onChange={(e) => { setSelectedLayer(e.target.value); setPage(0); }}
          className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-100 outline-none">
          {AVAILABLE_LAYERS.map((l) => (<option key={l.id} value={l.id}>{l.label}</option>))}
        </select>
        <input type="text" value={filterText} onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
          placeholder="Filter…"
          className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-100 placeholder-zinc-500 outline-none w-40" />
        <div className="relative">
          <button onClick={() => setShowColMenu(!showColMenu)}
            className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400 hover:text-zinc-200">
            Columns
          </button>
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
        <div className="flex items-center gap-1">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}
            className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30">◀</button>
          <span className="text-zinc-500">{totalPages > 0 ? `${page + 1}/${totalPages}` : "—"}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}
            className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30">▶</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-zinc-900">
            <tr className="border-b border-zinc-800 text-zinc-400">
              {COLUMNS.filter((c) => visibleCols.has(c.key)).map((c) => (
                <th key={c.key} className={`px-2 py-1 text-left ${c.key !== "type" ? "cursor-pointer" : ""}`}
                  onClick={() => c.key !== "type" && handleSort(c.key)}>
                  {c.label}{sortKey === c.key ? (sortAsc ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => {
              const isSelected = row.id === selectedId;
              return (
                <tr key={row.id} onClick={() => select(row.id)}
                  className={`cursor-pointer border-b border-zinc-800/50 text-zinc-300 ${
                    isSelected ? "bg-blue-900/30 text-blue-200" : "hover:bg-zinc-800/50"
                  }`}>
                  {COLUMNS.filter((c) => visibleCols.has(c.key)).map((col) => (
                    <td key={col.key} className="px-2 py-1">
                      {col.key === "type" && <span className="capitalize">{row.type}</span>}
                      {col.key === "id" && <span className="text-zinc-500">{row.id.slice(0, 8)}</span>}
                      {col.key === "label" && (row.label ?? "—")}
                      {col.key === "catalog" && String(row.attributes.catalog_key ?? "—")}
                      {col.key === "coords" && (
                        <span className="text-zinc-500">
                          {isPointElement(row) ? `${row.position[0].toFixed(4)}, ${row.position[1].toFixed(4)}`
                            : isLineElement(row) ? `${row.path.length} pts` : "—"}
                        </span>
                      )}
                      {col.key === "length" && isLineElement(row) && "path" in row
                        ? `${row.path.length > 1 ? ((haversine(row.path[0], row.path[row.path.length - 1]) * 5280).toFixed(0)) : "—"}`
                        : col.key === "length" ? "—" : null}
                      {col.key === "cable_count" && String(row.attributes.cable_count ?? "—")}
                      {col.key === "port_count" && String(row.attributes.port_count ?? "—")}
                      {col.key === "status" && (
                        <span className={grading?.checks.some((c) => c.elementIds?.includes(row.id) && c.status === "fail")
                          ? "text-red-400" : "text-green-400"}>
                          {grading?.checks.some((c) => c.elementIds?.includes(row.id)) ? "Issues" : "—"}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {pagedRows.length === 0 && (
              <tr><td colSpan={COLUMNS.length} className="px-2 py-2 text-center text-zinc-500 italic">No features match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function haversine(p1: [number, number], p2: [number, number]): number {
  const R = 3958.8;
  const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((p1[1] * Math.PI) / 180) * Math.cos((p2[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

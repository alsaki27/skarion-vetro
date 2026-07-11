"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDesignStore } from "@/lib/store";
import type { BasemapFeature, BasemapFeatureSelection, LngLat, NetworkElement } from "@/lib/types";
import { isPointElement, isLineElement } from "@/lib/types";
import {
  featureLabel,
  featureSearchText,
  featureSummary,
  getBasemapFeatureCenter,
} from "@/lib/basemap-workspace";

const LAYERS = [
  { id: "all", label: "All Features" },
  { id: "parcels", label: "Parcels" },
  { id: "addresses", label: "Addresses" },
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

type DesignRow = {
  kind: "design";
  id: string;
  type: NetworkElement["type"];
  label: string;
  attributes: Record<string, unknown>;
  coordinates: LngLat | null;
  searchText: string;
  element: NetworkElement;
};

type BasemapRow = {
  kind: "basemap";
  id: string;
  type: "parcel" | "address";
  label: string;
  attributes: Record<string, unknown>;
  coordinates: LngLat | null;
  searchText: string;
  layer: BasemapFeatureSelection["layer"];
  feature: BasemapFeature;
};

type WorkspaceRow = DesignRow | BasemapRow;

interface AttributeTableProps {
  projectId: string;
}

export function BottomPanel({ projectId }: AttributeTableProps) {
  void projectId;
  const elements = useDesignStore((s) => s.elements);
  const selectedId = useDesignStore((s) => s.selectedId);
  const selectedBasemapFeature = useDesignStore((s) => s.selectedBasemapFeature);
  const basemapData = useDesignStore((s) => s.basemapData);
  const select = useDesignStore((s) => s.select);
  const selectBasemapFeature = useDesignStore((s) => s.selectBasemapFeature);

  const [layerType, setLayerType] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(COLUMNS.map((c) => c.key)));
  const [showColMenu, setShowColMenu] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const designRows = useMemo<DesignRow[]>(() => {
    return Object.values(elements).map((element) => ({
      kind: "design" as const,
      id: element.id,
      type: element.type,
      label: element.label ?? "—",
      attributes: element.attributes,
      coordinates: isPointElement(element) ? element.position : null,
      searchText: [element.id, element.type, element.label ?? "", Object.values(element.attributes).map(String).join(" ")].join(" ").toLowerCase(),
      element,
    }));
  }, [elements]);

  const basemapRows = useMemo<BasemapRow[]>(() => {
    if (!basemapData) return [];
    const rows: BasemapRow[] = [];
    for (const feature of basemapData.parcels) {
      rows.push({
        kind: "basemap",
        id: feature.id,
        type: "parcel",
        label: featureLabel(feature),
        attributes: feature.properties,
        coordinates: getBasemapFeatureCenter(feature),
        searchText: featureSearchText(feature),
        layer: "parcels",
        feature,
      });
    }
    for (const feature of basemapData.addresses) {
      rows.push({
        kind: "basemap",
        id: feature.id,
        type: "address",
        label: featureLabel(feature),
        attributes: feature.properties,
        coordinates: getBasemapFeatureCenter(feature),
        searchText: featureSearchText(feature),
        layer: "addresses",
        feature,
      });
    }
    return rows;
  }, [basemapData]);

  const rows = useMemo<WorkspaceRow[]>(() => {
    const allRows = [...designRows, ...basemapRows];
    let filtered = allRows;
    if (layerType !== "all") {
      if (layerType === "parcels" || layerType === "addresses") {
        filtered = filtered.filter((row) => row.kind === "basemap" && row.layer === layerType);
      } else {
        filtered = filtered.filter((row) => row.kind === "design" && row.type === layerType);
      }
    }
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      filtered = filtered.filter((row) => {
        const haystack = row.kind === "design"
          ? row.searchText
          : `${row.searchText} ${featureSummary(row.feature)}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const av = String(a.attributes[sortKey] ?? "");
        const bv = String(b.attributes[sortKey] ?? "");
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return filtered;
  }, [designRows, basemapRows, layerType, filterText, sortKey, sortAsc]);

  // TanStack's virtualizer intentionally returns live functions; lint flags this API.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 10,
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const toggleCol = useCallback((key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const exportCsv = useCallback(() => {
    const header = ["type", "id", "label", "catalog_key", "lon", "lat", "cable_count", "port_count"];
    const lines = rows.map((row) => {
      const coords = row.coordinates ? [row.coordinates[0], row.coordinates[1]] : ["—", "—"];
      return [
        row.type,
        row.id,
        row.label,
        row.attributes.catalog_key ?? row.attributes.source_id ?? "",
        coords[0],
        coords[1],
        row.attributes.cable_count ?? "",
        row.attributes.port_count ?? "",
      ].map((value) => `"${String(value)}"`).join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "features.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  useEffect(() => {
    const selectedWorkspaceId = selectedBasemapFeature?.feature.id ?? selectedId;
    if (selectedWorkspaceId) {
      const idx = rows.findIndex((row) => row.id === selectedWorkspaceId);
      if (idx >= 0) rowVirtualizer.scrollToIndex(idx, { align: "center" });
    }
  }, [selectedId, selectedBasemapFeature, rows, rowVirtualizer]);

  const handleRowClick = (row: WorkspaceRow) => {
    if (row.kind === "design") {
      select(row.id);
    } else {
      selectBasemapFeature({ layer: row.layer, feature: row.feature });
    }
  };

  const selectedWorkspaceId = selectedBasemapFeature?.feature.id ?? selectedId;

  return (
    <div className="flex h-full flex-col text-xs">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-2 py-1 shrink-0">
        <select
          value={layerType}
          onChange={(e) => setLayerType(e.target.value)}
          className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-100 outline-none"
        >
          {LAYERS.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter by id/label…"
          className="w-40 rounded bg-zinc-800 px-2 py-0.5 text-zinc-100 placeholder-zinc-500 outline-none"
        />
        <div className="relative">
          <button
            onClick={() => setShowColMenu(!showColMenu)}
            className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
          >
            Columns
          </button>
          {showColMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColMenu(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 rounded border border-zinc-700 bg-zinc-900 p-2 shadow-lg">
                {COLUMNS.map((column) => (
                  <label
                    key={column.key}
                    className="flex cursor-pointer items-center gap-2 py-0.5 text-zinc-300 hover:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.has(column.key)}
                      onChange={() => toggleCol(column.key)}
                      className="accent-zinc-500"
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={exportCsv}
          className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
        >
          CSV
        </button>
        <span className="ml-auto text-zinc-500">
          {rows.length} features
        </span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-zinc-900">
            <tr className="border-b border-zinc-800 text-zinc-400">
              {COLUMNS.filter((column) => visibleCols.has(column.key)).map((column) => (
                <th
                  key={column.key}
                  className={`px-2 py-1 text-left ${column.key !== "type" ? "cursor-pointer hover:text-zinc-200" : ""}`}
                  onClick={() => column.key !== "type" && handleSort(column.key)}
                  style={{ width: column.key === "id" ? "90px" : column.key === "coords" ? "140px" : "auto" }}
                >
                  {column.label}
                  {sortKey === column.key ? (sortAsc ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isSelected = row.id === selectedWorkspaceId;
              return (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className={`absolute left-0 w-full cursor-pointer border-b border-zinc-800/50 ${
                    isSelected ? "bg-blue-900/30 text-blue-200" : "text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                  style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }}
                >
                  {COLUMNS.filter((column) => visibleCols.has(column.key)).map((column) => (
                    <td key={column.key} className="px-2 py-1 truncate">
                      <CellValue row={row} col={column.key} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > 0 && (
          <div style={{ height: rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems().length * 28 }} />
        )}
        {rows.length === 0 && (
          <div className="px-2 py-2 text-center italic text-zinc-500">No features match.</div>
        )}
      </div>
    </div>
  );
}

function CellValue({ row, col }: { row: WorkspaceRow; col: string }) {
  const typeLabel = row.kind === "basemap" ? row.type : row.type;
  const idLabel = row.id.slice(0, 8);
  const catalogValue = row.attributes.catalog_key ?? row.attributes.source_id ?? row.attributes.parcel_external_id ?? "—";
  switch (col) {
    case "type":
      return <span className="capitalize">{typeLabel}</span>;
    case "id":
      return <span className="font-mono text-zinc-500">{idLabel}</span>;
    case "label":
      return <span>{row.label}</span>;
    case "catalog_key":
      return <span>{String(catalogValue)}</span>;
    case "coords": {
      if (row.coordinates) {
        return <span className="text-zinc-500">{row.coordinates[0].toFixed(4)}, {row.coordinates[1].toFixed(4)}</span>;
      }
      if (row.kind === "design" && isLineElement(row.element)) {
        return <span className="text-zinc-500">{row.element.path.length} pts</span>;
      }
      return <span className="text-zinc-500">—</span>;
    }
    case "cable_count":
      return <span>{String(row.attributes.cable_count ?? "—")}</span>;
    case "port_count":
      return <span>{String(row.attributes.port_count ?? "—")}</span>;
    default:
      return <span>—</span>;
  }
}

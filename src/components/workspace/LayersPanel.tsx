"use client";

import { useState, useCallback, useEffect } from "react";

interface LayerItem {
  id: string;
  name: string;
  group: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
  minZoom?: number;
  maxZoom?: number;
  description?: string;
  sourceType?: string;
}

const LAYER_GROUPS = [
  "Basemaps", "Administrative", "Parcels & Property", "Addresses & Buildings",
  "Roads", "ROW", "Existing Utilities", "Environmental",
  "Proposed Network", "Reference/Annotation",
];

const DEFAULT_LAYERS: LayerItem[] = [
  { id: "basemap-satellite", name: "Satellite", group: "Basemaps", visible: true, opacity: 100, zIndex: 0 },
  { id: "basemap-streets", name: "Streets", group: "Basemaps", visible: false, opacity: 100, zIndex: 1 },
  { id: "basemap-labeled", name: "Labels Overlay", group: "Basemaps", visible: true, opacity: 100, zIndex: 2 },
  { id: "ref-boundaries", name: "Boundaries", group: "Administrative", visible: false, opacity: 80, zIndex: 3, minZoom: 10 },
  { id: "ref-parcels", name: "Parcels (WCAD)", group: "Parcels & Property", visible: false, opacity: 60, zIndex: 4, minZoom: 15, sourceType: "WCAD Tax Parcels", description: "Muted reference polygons for property boundaries." },
  { id: "ref-addresses", name: "Address Points (E911)", group: "Addresses & Buildings", visible: false, opacity: 100, zIndex: 5, minZoom: 15, sourceType: "Williamson County 911", description: "Serviceable premises use filled dots; closed or non-serviceable points remain hollow/dim." },
  { id: "ref-roads", name: "Road Centerlines", group: "Roads", visible: true, opacity: 100, zIndex: 6, minZoom: 8 },
  { id: "ref-row", name: "ROW / Easements", group: "ROW", visible: false, opacity: 100, zIndex: 7, minZoom: 12 },
  { id: "ref-utilities", name: "Existing Utilities", group: "Existing Utilities", visible: false, opacity: 70, zIndex: 8, minZoom: 13 },
  { id: "ref-environmental", name: "Environmental Constraints", group: "Environmental", visible: false, opacity: 80, zIndex: 9, minZoom: 10 },
  { id: "proposed-network", name: "Proposed Network", group: "Proposed Network", visible: true, opacity: 100, zIndex: 10 },
  { id: "ref-annotation", name: "Annotations", group: "Reference/Annotation", visible: false, opacity: 100, zIndex: 11 },
];

export function LayersPanel({ projectId }: { projectId: string }) {
  const storageKey = `skarion_layers_${projectId}`;
  const [layers, setLayers] = useState<LayerItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_LAYERS;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_LAYERS;
    } catch { return DEFAULT_LAYERS; }
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Persist per-user layer state
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(layers)); } catch { }
  }, [layers, storageKey]);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)));
  }, []);

  const updateLayer = useCallback((layerId: string, patch: Partial<LayerItem>) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, ...patch } : l)));
  }, []);

  const moveLayer = useCallback((layerId: string, direction: "up" | "down") => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === layerId);
      if (idx === -1) return prev;
      const next = [...prev];
      const targetIdx = direction === "up" ? Math.max(0, idx - 1) : Math.min(next.length - 1, idx + 1);
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((l, i) => ({ ...l, zIndex: i }));
    });
  }, []);

  const zoomToLayer = useCallback((_id: string) => {
    void _id;
  }, []);

  const filteredGroups = LAYER_GROUPS.map((group) => ({
    group,
    layers: layers.filter((l) => l.group === group && (
      !searchFilter || l.name.toLowerCase().includes(searchFilter.toLowerCase())
    )),
  })).filter((g) => !searchFilter || g.layers.length > 0);

  return (
    <div className="space-y-1">
      {/* Search filter */}
      <div className="px-1 pb-1">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter layers…"
          className="w-full rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500 outline-none"
        />
      </div>

      {filteredGroups.map(({ group, layers: groupLayers }) => {
        const isCollapsed = collapsedGroups.has(group);

        return (
          <div key={group}>
            <button
              onClick={() => toggleGroup(group)}
              className="flex w-full items-center gap-1 rounded px-1 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              <span className="text-[10px]">{isCollapsed ? "▶" : "▼"}</span>
              <span className="flex-1 text-left">{group}</span>
              <span className="rounded bg-zinc-800 px-1 text-[10px] text-zinc-500">
                {groupLayers.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className="ml-2 space-y-0.5">
                {groupLayers.map((layer) => (
                  <div key={layer.id} className="group">
                    <div className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={() => toggleLayer(layer.id)}
                        className="h-3 w-3 accent-zinc-500 shrink-0"
                      />
                      <span className="flex-1 truncate text-xs text-zinc-300">
                        {layer.name}
                      </span>
                      {layer.minZoom && (
                        <span className="text-[9px] text-zinc-600" title={`Min zoom: ${layer.minZoom}`}>
                          z{layer.minZoom}+
                        </span>
                      )}
                      <button
                        onClick={() => zoomToLayer(layer.id)}
                        className="rounded px-1 text-[10px] text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
                        title="Zoom to layer"
                      >
                        ◎
                      </button>
                      <button
                        onClick={() => setEditingLayer(editingLayer === layer.id ? null : layer.id)}
                        className="rounded px-1 text-[10px] text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
                      >
                        Style
                      </button>
                    </div>

                    {editingLayer === layer.id && (
                      <div className="space-y-1 px-2 py-1">
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[10px] text-zinc-500">Opacity</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={layer.opacity}
                            onChange={(e) => updateLayer(layer.id, { opacity: Number(e.target.value) })}
                            className="h-1 flex-1 accent-zinc-500"
                          />
                          <span className="w-8 text-right text-[10px] text-zinc-500">{layer.opacity}%</span>
                        </div>
                        {layer.description && (
                          <p className="text-[10px] text-zinc-600">{layer.description}</p>
                        )}
                        {layer.sourceType && (
                          <p className="text-[10px] text-zinc-600">Source: {layer.sourceType}</p>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveLayer(layer.id, "up")}
                            className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveLayer(layer.id, "down")}
                            className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {groupLayers.length === 0 && (
                  <div className="px-1 text-[10px] text-zinc-600 italic">No layers in this group</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

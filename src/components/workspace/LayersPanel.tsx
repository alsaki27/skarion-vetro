"use client";

import { useState, useCallback } from "react";
import { useDesignStore } from "@/lib/store";

const LAYER_GROUPS = [
  "Basemaps",
  "Administrative",
  "Parcels",
  "Addresses",
  "Roads",
  "ROW",
  "Existing Utilities",
  "Environmental",
  "Proposed Network",
  "Reference/Annotation",
];

interface LayerItem {
  id: string;
  name: string;
  group: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
}

export function LayersPanel({ projectId: _projectId }: { projectId: string }) {
  const [layers, setLayers] = useState<LayerItem[]>([
    { id: "basemap-satellite", name: "Satellite", group: "Basemaps", visible: true, opacity: 100, zIndex: 0 },
    { id: "basemap-streets", name: "Streets", group: "Basemaps", visible: false, opacity: 100, zIndex: 1 },
    { id: "proposed-network", name: "Proposed Network", group: "Proposed Network", visible: true, opacity: 100, zIndex: 10 },
  ]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const showBasemapCanvas = useDesignStore((s) => s.showBasemapCanvas);
  const visibleBasemapLayers = useDesignStore((s) => s.visibleBasemapLayers);
  const setBasemapCanvasVisible = useDesignStore((s) => s.setBasemapCanvasVisible);
  const toggleBasemapLayer = useDesignStore((s) => s.toggleBasemapLayer);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const toggleLayer = useCallback((layerId: string) => {
    if (layerId === "basemap-satellite") {
      setBasemapCanvasVisible(!showBasemapCanvas);
      return;
    }
    if (layerId.startsWith("basemap-")) {
      const name = layerId.replace("basemap-", "").toUpperCase();
      if (name in visibleBasemapLayers) {
        toggleBasemapLayer(name);
      }
      return;
    }
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, [showBasemapCanvas, visibleBasemapLayers, setBasemapCanvasVisible, toggleBasemapLayer]);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, opacity } : l))
    );
  }, []);

  return (
    <div className="space-y-1">
      {LAYER_GROUPS.map((group) => {
        const groupLayers = layers.filter((l) => l.group === group);
        const isCollapsed = collapsedGroups.has(group);
        const count = groupLayers.length;

        return (
          <div key={group}>
            <button
              onClick={() => toggleGroup(group)}
              className="flex w-full items-center gap-1 rounded px-1 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              <span>{isCollapsed ? "▶" : "▼"}</span>
              <span className="flex-1 text-left">{group}</span>
              <span className="rounded bg-zinc-800 px-1 text-[10px] text-zinc-500">
                {count}
              </span>
            </button>

            {!isCollapsed && (
              <div className="ml-3 space-y-0.5">
                {groupLayers.map((layer) => (
                  <div key={layer.id} className="group">
                    <div className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={() => toggleLayer(layer.id)}
                        className="h-3 w-3 accent-zinc-500"
                      />
                      <span className="flex-1 text-xs text-zinc-300 truncate">
                        {layer.name}
                      </span>
                      <button
                        onClick={() =>
                          setEditingLayer(editingLayer === layer.id ? null : layer.id)
                        }
                        className="rounded px-1 text-[10px] text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Style
                      </button>
                    </div>
                    {editingLayer === layer.id && (
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 w-12">Opacity</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={layer.opacity}
                            onChange={(e) =>
                              setLayerOpacity(layer.id, Number(e.target.value))
                            }
                            className="flex-1 h-1 accent-zinc-500"
                          />
                          <span className="text-[10px] text-zinc-500 w-8 text-right">
                            {layer.opacity}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {count === 0 && (
                  <div className="px-1 text-[10px] text-zinc-600 italic">
                    No layers in this group
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

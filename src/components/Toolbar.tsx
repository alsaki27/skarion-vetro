"use client";

import { useDesignStore, type Tool } from "@/lib/store";
import type { ProjectFixture } from "@/lib/types";

interface ToolDef {
  tool: Tool;
  label: string;
  icon: string;
  environments?: ("aerial" | "underground" | "mixed")[];
}

const TOOLS: ToolDef[] = [
  { tool: "select", label: "Select", icon: "☝️" },
  { tool: "pole", label: "Pole", icon: "📍", environments: ["aerial", "mixed"] },
  { tool: "handhole", label: "Handhole", icon: "⬛", environments: ["underground", "mixed"] },
  { tool: "flowerpot", label: "Flowerpot", icon: "🌸", environments: ["underground", "mixed"] },
  { tool: "vault", label: "Vault", icon: "🏦", environments: ["underground", "mixed"] },
  { tool: "cable", label: "Cable", icon: "➖" },
  { tool: "conduit", label: "Conduit", icon: "🚇", environments: ["underground", "mixed"] },
  { tool: "drop_cable", label: "Drop", icon: "↘️" },
  { tool: "splitter", label: "Splitter", icon: "🔀" },
  { tool: "mst", label: "MST", icon: "📡" },
  { tool: "fdh_cabinet", label: "FDH", icon: "🗄️" },
  { tool: "splice_closure", label: "Closure", icon: "📦" },
  { tool: "riser", label: "Riser", icon: "⬆️", environments: ["mixed"] },
];

export default function Toolbar({ project }: { project: ProjectFixture }) {
  const tool = useDesignStore((s) => s.tool);
  const setTool = useDesignStore((s) => s.setTool);
  const basemap = useDesignStore((s) => s.basemap);
  const setBasemap = useDesignStore((s) => s.setBasemap);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const canUndo = useDesignStore((s) => s.past.length > 0);
  const canRedo = useDesignStore((s) => s.future.length > 0);
  const drafting = useDesignStore((s) => s.draftPath.length > 0);
  const showBasemapCanvas = useDesignStore((s) => s.showBasemapCanvas);
  const setBasemapCanvasVisible = useDesignStore((s) => s.setBasemapCanvasVisible);
  const toggleBasemapLayer = useDesignStore((s) => s.toggleBasemapLayer);
  const visibleBasemapLayers = useDesignStore((s) => s.visibleBasemapLayers);

  const visible = TOOLS.filter(
    (t) => !t.environments || t.environments.includes(project.environment),
  );

  return (
    <div className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm">
      {visible.map((t) => (
        <button
          key={t.tool}
          onClick={() => setTool(t.tool)}
          title={t.label}
          className={`flex flex-col items-center rounded px-2 py-1 leading-tight transition-colors ${
            tool === t.tool
              ? "bg-blue-600 text-white"
              : "text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          <span className="text-base">{t.icon}</span>
          <span className="text-[10px]">{t.label}</span>
        </button>
      ))}

      <div className="mx-2 h-8 w-px bg-zinc-700" />

      <button
        onClick={undo}
        disabled={!canUndo}
        className="rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        ↩️
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className="rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
        title="Redo (Ctrl+Y)"
      >
        ↪️
      </button>

      <div className="mx-2 h-8 w-px bg-zinc-700" />

      <button
        onClick={() => setBasemap(basemap === "satellite" ? "streets" : "satellite")}
        className="rounded px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
      >
        {basemap === "satellite" ? "🛰️ Satellite" : "🗺️ Streets"}
      </button>

      <button
        onClick={() => setBasemapCanvasVisible(!showBasemapCanvas)}
        className={`rounded px-2 py-1 text-xs ${
          showBasemapCanvas ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800"
        }`}
        title="Toggle CAD basemap layers (EOP/CL/RW/Parcel)"
      >
        🗺️ Basemap
      </button>

      {showBasemapCanvas && (
        <div className="flex gap-0.5">
          {Object.entries(visibleBasemapLayers).map(([layer, visible]) => (
            <button
              key={layer}
              onClick={() => toggleBasemapLayer(layer)}
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                visible ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800 text-zinc-600"
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      )}

      {drafting && (
        <span className="ml-auto rounded bg-yellow-600/20 px-2 py-1 text-xs text-yellow-400">
          Drawing… click to add points · double-click or Enter to finish · Esc to cancel
        </span>
      )}
    </div>
  );
}

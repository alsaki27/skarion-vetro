"use client";

import { useDesignStore } from "@/lib/store";
import type { Tool } from "@/lib/store";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "select", label: "⇱" },
  { id: "handhole", label: "▣" },
  { id: "flowerpot", label: "◎" },
  { id: "vault", label: "▢" },
  { id: "cable", label: "↘" },
  { id: "conduit", label: "⤚" },
  { id: "drop_cable", label: "⟐" },
  { id: "splitter", label: "≘" },
  { id: "mst", label: "◆" },
  { id: "fdh_cabinet", label: "⬡" },
  { id: "splice_closure", label: "◉" },
];

export function WorkspaceToolStrip() {
  const tool = useDesignStore((s) => s.tool);
  const setTool = useDesignStore((s) => s.setTool);

  return (
    <div className="flex items-center gap-0.5 border-b border-zinc-800 bg-zinc-900 px-2 py-1 shrink-0 overflow-x-auto">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          className={`min-w-[28px] h-6 rounded text-xs flex items-center justify-center transition-colors ${
            tool === t.id
              ? "bg-blue-600 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
          title={t.id}
        >
          {t.label}
        </button>
      ))}
      <span className="ml-2 border-l border-zinc-700 pl-2 text-[10px] text-zinc-500">
        {tool}
      </span>
    </div>
  );
}

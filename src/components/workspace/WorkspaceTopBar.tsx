"use client";

import { useState, useRef, useMemo } from "react";
import type { ProjectFixture } from "@/lib/types";
import { useDesignStore } from "@/lib/store";

interface SearchResult {
  kind: "address" | "parcel" | "element";
  label: string;
  sublabel: string;
  id: string;
}

export function WorkspaceTopBar({
  project,
  onToggleBrief,
  onGrade,
  onOutputs,
}: {
  project: ProjectFixture;
  onToggleBrief: () => void;
  onGrade?: () => void;
  onOutputs?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [focusIdx, setFocusIdx] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const grading = useDesignStore((s) => s.grading);
  const basemap = useDesignStore((s) => s.basemap);
  const setBasemap = useDesignStore((s) => s.setBasemap);
  const basemapData = useDesignStore((s) => s.basemapData);
  const elements = useDesignStore((s) => s.elements);
  const selectBasemapFeature = useDesignStore((s) => s.selectBasemapFeature);
  const selectElement = useDesignStore((s) => s.select);
  const issueCount = grading?.checks.filter((c) => c.status === "fail").length ?? 0;

  const results = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    const items: SearchResult[] = [];

    if (basemapData) {
      for (const a of basemapData.addresses) {
        const props = a.properties as Record<string, unknown>;
        const fullAddr = String(props.full_address ?? "");
        const street = String(props.street_full ?? "");
        const parcelId = String(props.parcel_external_id ?? "");
        if (fullAddr.toLowerCase().includes(q) || street.toLowerCase().includes(q)) {
          items.push({ kind: "address", label: fullAddr, sublabel: `Parcel ${parcelId}`, id: String(a.id) });
        }
      }
      for (const p of basemapData.parcels) {
        const props = p.properties as Record<string, unknown>;
        const pid = String(props.parcel_external_id ?? "");
        const addr = String(props.site_address ?? "");
        if (pid.toLowerCase().includes(q) || addr.toLowerCase().includes(q)) {
          items.push({ kind: "parcel", label: `Parcel ${pid}`, sublabel: addr || "No site address", id: String(p.id) });
        }
      }
    }

    for (const [eid, el] of Object.entries(elements)) {
      const label = (el.label ?? el.id).toLowerCase();
      if (label.includes(q) || eid.toLowerCase().includes(q)) {
        items.push({ kind: "element", label: el.label ?? el.id, sublabel: el.type, id: eid });
      }
    }

    return items.slice(0, 30);
  }, [search, basemapData, elements]);

  const pick = (r: SearchResult) => {
    setSearch("");
    if (r.kind === "element") {
      selectElement(r.id);
    } else {
      selectBasemapFeature({ layer: r.kind === "address" ? "addresses" : "parcels", feature: { id: r.id, type: "Feature", geometry: {} as never, properties: {} as never } as never });
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && focusIdx >= 0 && results[focusIdx]) { e.preventDefault(); pick(results[focusIdx]); }
    else if (e.key === "Escape") { setSearch(""); searchRef.current?.blur(); }
  };

  return (
    <header className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-sm shrink-0 relative">
      <span className="font-semibold text-white truncate">{project.title}</span>
      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
        {project.difficulty}
      </span>

      <div className="flex items-center gap-2 ml-4 flex-1 max-w-md relative">
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setFocusIdx(-1); }}
          onKeyDown={handleKey}
          placeholder="Search addresses, parcels, elements…"
          className="w-full rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
        />
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded bg-zinc-800 border border-zinc-700 shadow-lg max-h-60 overflow-y-auto z-50">
            {results.map((r, i) => (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => pick(r)}
                onMouseEnter={() => setFocusIdx(i)}
                className={`w-full text-left px-2 py-1.5 text-xs transition-colors ${
                  i === focusIdx ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <span className="text-[10px] text-zinc-500 mr-1">
                  {r.kind === "address" ? "📍" : r.kind === "parcel" ? "📐" : "🔹"}
                </span>
                {r.label}
                <span className="text-zinc-600 ml-2">{r.sublabel}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          {project.environment}
        </span>
        <button
          onClick={() => setBasemap(basemap === "satellite" ? "streets" : "satellite")}
          className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          {basemap === "satellite" ? "🛰" : "🗺"} {basemap}
        </button>
        {issueCount > 0 && (
          <span className="rounded bg-red-900/40 px-2 py-0.5 text-xs text-red-300">
            {issueCount} issues
          </span>
        )}
        <button
          onClick={onToggleBrief}
          className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Brief
        </button>
        {onOutputs && (
          <button
            onClick={onOutputs}
            className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Outputs
          </button>
        )}
        {onGrade && (
          <button
            onClick={onGrade}
            className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-600"
          >
            Submit
          </button>
        )}
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          Student
        </span>
      </div>
    </header>
  );
}

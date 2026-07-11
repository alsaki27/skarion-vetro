"use client";

import { getDefaultStyle, type LayerStyle } from "@/lib/styles";

interface LegendProps {
  activeLayerIds: string[];
}

export default function Legend({ activeLayerIds }: LegendProps) {
  const styles = activeLayerIds.map((id) => getDefaultStyle(id)).filter(Boolean) as LayerStyle[];

  if (styles.length === 0) return null;

  return (
    <div className="space-y-2 rounded bg-zinc-900/80 p-2 text-xs">
      <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Legend</div>
      {styles.map((s) => (
        <div key={s.id}>
          <div className="mb-1 text-zinc-400 font-medium">{s.name}</div>
          {s.rules.map((r) => (
            <div key={r.id} className="flex items-center gap-2 py-0.5">
              <div className="flex h-4 w-6 items-center justify-center shrink-0">
                {s.geometryType === "line" ? (
                  <svg width="20" height="4" viewBox="0 0 20 4">
                    <line x1="0" y1="2" x2="20" y2="2" stroke={r.symbolizer.color ?? "#888"}
                      strokeWidth={r.symbolizer.width ?? 2}
                      strokeDasharray={(r.symbolizer.dashArray ?? []).join(",") || undefined} />
                  </svg>
                ) : (
                  <div className={`h-3 w-3 rounded-full`}
                    style={{ backgroundColor: r.symbolizer.color ?? "#888" }} />
                )}
              </div>
              <span className="text-zinc-300">{r.label ?? r.id}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

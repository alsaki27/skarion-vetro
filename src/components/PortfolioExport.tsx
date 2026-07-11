"use client";

import { useDesignStore } from "@/lib/store";
import { isLineElement } from "@/lib/types";
import { pathLengthFt } from "@/lib/geometry";

export default function PortfolioExport({ projectTitle }: { projectTitle: string }) {
  const elements = useDesignStore((s) => s.elements);
  const grading = useDesignStore((s) => s.grading);

  const lines = Object.values(elements).filter(isLineElement);
  const totalCableFt = lines
    .filter((l) => l.type === "cable" || l.type === "drop_cable" || l.type === "conduit")
    .reduce((sum, l) => sum + pathLengthFt(l.path), 0);

  const generateBom = () => {
    const counts: Record<string, number> = {};
    for (const el of Object.values(elements)) {
      counts[el.type] = (counts[el.type] ?? 0) + 1;
    }
    return counts;
  };

  const bom = generateBom();

  const exportJson = () => {
    const data = {
      project: projectTitle,
      exportedAt: new Date().toISOString(),
      elementCount: Object.keys(elements).length,
      totalCableFt: Math.round(totalCableFt),
      grading,
      billOfMaterials: bom,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, "-").toLowerCase()}-portfolio.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 text-xs">
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Portfolio — {projectTitle}
        </h3>
        <div className="rounded border border-zinc-700 bg-zinc-800/50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-zinc-500">Elements</p>
              <p className="text-lg font-bold text-white">{Object.keys(elements).length}</p>
            </div>
            <div>
              <p className="text-zinc-500">Total Cable</p>
              <p className="text-lg font-bold text-white">{Math.round(totalCableFt)} ft</p>
            </div>
            <div>
              <p className="text-zinc-500">Score</p>
              <p className={`text-lg font-bold ${grading?.isPassing ? "text-green-400" : "text-zinc-500"}`}>
                {grading ? `${grading.totalScore}/100` : "Not graded"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Passing</p>
              <p className={`text-lg font-bold ${grading?.isPassing ? "text-green-400" : "text-zinc-500"}`}>
                {grading?.isPassing ? "✅" : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Bill of Materials
        </h3>
        <div className="space-y-1">
          {Object.entries(bom).length === 0 ? (
            <p className="text-zinc-500">No elements — design is empty.</p>
          ) : (
            Object.entries(bom).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-300">{type}</span>
                <span className="text-zinc-500">{count}x</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Export
        </h3>
        <button
          onClick={exportJson}
          className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
        >
          📥 Export Portfolio (JSON)
        </button>
        <p className="mt-1 text-[10px] text-zinc-600">
          Exports design data, BOM, and grading results as a JSON file.
          In production, this also includes basemap grade and PDF export.
        </p>
      </section>
    </div>
  );
}

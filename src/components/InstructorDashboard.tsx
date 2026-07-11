"use client";

import { useDesignStore } from "@/lib/store";

export default function InstructorDashboard() {
  const grading = useDesignStore((s) => s.grading);
  const elements = useDesignStore((s) => s.elements);

  const elementCounts = Object.values(elements).reduce<Record<string, number>>((acc, el) => {
    acc[el.type] = (acc[el.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4 text-xs">
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Design Overview
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-zinc-700 bg-zinc-800/50 p-2">
            <p className="text-zinc-400">Total Elements</p>
            <p className="text-lg font-bold text-white">{Object.keys(elements).length}</p>
          </div>
          <div className="rounded border border-zinc-700 bg-zinc-800/50 p-2">
            <p className="text-zinc-400">Last Grade</p>
            <p className={`text-lg font-bold ${grading?.isPassing ? "text-green-400" : "text-zinc-500"}`}>
              {grading ? `${grading.totalScore}` : "—"}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Element Breakdown
        </h3>
        {Object.keys(elementCounts).length === 0 ? (
          <p className="text-zinc-500">No elements in the design.</p>
        ) : (
          <div className="space-y-1">
            {Object.entries(elementCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-zinc-300">{type}</span>
                <span className="text-zinc-500">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {grading && (
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Attempt History
          </h3>
          <div className="rounded border border-zinc-700 bg-zinc-800/50 p-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Latest attempt</span>
              <span className={`font-bold ${grading.isPassing ? "text-green-400" : "text-red-400"}`}>
                {grading.totalScore}/100
              </span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-600">
              {new Date(grading.gradedAt).toLocaleString()}
            </p>
          </div>
          {/* In production, this shows a list of all attempts from the database */}
        </section>
      )}

      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Struggle Analytics
        </h3>
        {grading ? (
          <div className="space-y-1">
            {grading.checks
              .filter((c) => c.status === "fail" || c.status === "warn")
              .map((c) => (
                <div key={c.checkId} className="rounded border border-red-900/30 bg-red-900/10 p-2">
                  <p className="text-zinc-300">
                    {c.status === "fail" ? "❌" : "⚠️"} {c.message}
                  </p>
                </div>
              ))}
            {grading.checks.filter((c) => c.status === "fail" || c.status === "warn").length === 0 && (
              <p className="text-zinc-500">All checks passing — no issues detected.</p>
            )}
          </div>
        ) : (
          <p className="text-zinc-500">Submit a design for grading to see analytics.</p>
        )}
      </section>
    </div>
  );
}

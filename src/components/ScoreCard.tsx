"use client";

import type { GradingResult } from "@/lib/types";

const STATUS_ICON = { pass: "✅", warn: "⚠️", fail: "❌" } as const;

export default function ScoreCard({ grading }: { grading: GradingResult | null }) {
  if (!grading) {
    return (
      <p className="text-xs text-zinc-500">
        Submit your design for grading to see your score.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      <div
        className={`rounded-lg p-3 text-center ${
          grading.isPassing ? "bg-green-900/30" : "bg-red-900/20"
        }`}
      >
        <div className="text-3xl font-bold text-white">
          {grading.totalScore}
          <span className="text-base font-normal text-zinc-400">/100</span>
        </div>
        <div
          className={`mt-1 font-semibold ${
            grading.isPassing ? "text-green-400" : "text-red-400"
          }`}
        >
          {grading.isPassing
            ? "🎉 PASS"
            : `Not passing yet (need ${grading.passThreshold})`}
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Category breakdown
        </h3>
        <div className="space-y-1.5">
          {grading.categories.map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <span className="w-24 capitalize text-zinc-300">{c.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-800">
                <div
                  className={`h-full ${
                    c.status === "pass"
                      ? "bg-green-500"
                      : c.status === "warn"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <span className="w-8 text-right text-zinc-400">{c.score}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Feedback
        </h3>
        <ul className="space-y-2">
          {grading.checks.map((c) => (
            <li key={c.checkId} className="flex gap-2">
              <span>{STATUS_ICON[c.status]}</span>
              <span className="text-zinc-300">{c.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[10px] text-zinc-600">
        Graded {new Date(grading.gradedAt).toLocaleTimeString()} — deterministic
        rule engine v1
      </p>
    </div>
  );
}

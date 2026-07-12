"use client";

import { useState } from "react";
import { useDesignStore } from "@/lib/store";
import type { ProjectFixture } from "@/lib/types";

interface GradeResponse {
  totalScore: number;
  isPassing: boolean;
  passThreshold: number;
  gates: { passed: boolean; failures: { checkId: string; message: string; elementIds?: string[] }[] };
  checks: { checkId: string; category: string; status: string; score: number; message: string }[];
}

export function WorkspaceGrade({ project, onClose }: { project: ProjectFixture; onClose: () => void }) {
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setGrading = useDesignStore((s) => s.setGrading);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const elements = Object.values(useDesignStore.getState().elements);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/grading", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ projectId: project.id, elements }),
      });
      const data = await res.json() as GradeResponse & { error?: string; categories?: { name: string; weight: number; score: number; status: string }[]; gradedAt?: string };
      if (data.error) { setError(data.error); return; }
      setResult(data);
      // Populate the shared grading store so the Issues tab can read results
      setGrading({
        totalScore: data.totalScore,
        isPassing: data.isPassing,
        passThreshold: data.passThreshold,
        categories: (data.categories ?? []).map((c) => ({ name: c.name, weight: c.weight, score: c.score, status: c.status as "pass" | "fail" | "warn" | "info" | "not_evaluated" })),
        checks: data.checks.map((c) => ({ checkId: c.checkId, category: c.category, status: c.status as "pass" | "fail" | "warn" | "info" | "not_evaluated", score: c.score, message: c.message, elementIds: (c as { elementIds?: string[] }).elementIds ?? [] })),
        gradedAt: data.gradedAt ?? new Date().toISOString(),
      });
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Submit for Grading</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {!result && !loading && !error && (
            <>
              <p className="text-xs text-zinc-400">
                Your design will be graded against the {project.id} rubric.
                The server re-runs all checks against your current design state.
              </p>
              <button
                onClick={submit}
                className="w-full rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
              >
                Submit Design for Grading
              </button>
            </>
          )}

          {loading && (
            <div className="text-center text-sm text-zinc-400 py-4">Grading your design…</div>
          )}

          {error && (
            <div className="rounded bg-red-900/30 px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          {result && (
            <>
              {/* Gate checklist */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-300 mb-2">
                  Gates {result.gates.passed ? "✅" : "❌"}
                </h3>
                <div className="space-y-1">
                  {["connectivity", "compliance", "capacity", "trespass"].map((gateId) => {
                    const failure = result.gates.failures.find((f) => f.checkId === gateId);
                    return (
                      <div key={gateId} className="flex items-center gap-2 text-xs">
                        <span className={failure ? "text-red-400" : "text-green-400"}>
                          {failure ? "✗" : "✓"}
                        </span>
                        <span className="text-zinc-300 capitalize">{gateId}</span>
                        {failure && <span className="text-zinc-500 text-[10px]">{failure.message}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score breakdown */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-zinc-300">Score</h3>
                  <span className={`text-sm font-bold ${result.isPassing ? "text-green-400" : "text-red-400"}`}>
                    {result.totalScore}% / {result.passThreshold}%
                  </span>
                </div>
                <div className="space-y-1">
                  {result.checks
                    .filter((c) => !["connectivity", "compliance", "capacity", "trespass"].includes(c.checkId))
                    .map((check) => (
                      <div key={check.checkId} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{check.message}</span>
                        <span className={check.status === "pass" ? "text-green-400" : "text-red-400"}>
                          {check.score}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Result */}
              <div className={`rounded px-3 py-2 text-xs font-semibold ${
                result.isPassing ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"
              }`}>
                {result.isPassing ? "Passed!" : "Failed — fix gate issues and resubmit."}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

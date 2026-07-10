"use client";

import type { ProjectFixture } from "@/lib/types";

export default function BriefModal({
  project,
  onClose,
}: {
  project: ProjectFixture;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-sm text-zinc-300">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold text-white">📋 {project.title}</h2>
          <button
            onClick={onClose}
            className="rounded px-2 text-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <section className="mb-4">
          <h3 className="mb-1 font-semibold text-zinc-100">Scenario</h3>
          <p className="text-zinc-400">{project.scenario}</p>
        </section>

        <section className="mb-4">
          <h3 className="mb-1 font-semibold text-zinc-100">🎯 Your task</h3>
          <ol className="list-inside list-decimal space-y-1 text-zinc-400">
            {project.tasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </section>

        <section className="mb-4">
          <h3 className="mb-1 font-semibold text-zinc-100">⚠️ Constraints</h3>
          <ul className="list-inside list-disc space-y-1 text-zinc-400">
            {project.constraintNotes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <section className="mb-4">
          <h3 className="mb-1 font-semibold text-zinc-100">📦 Deliverables</h3>
          <ul className="list-inside list-disc space-y-1 text-zinc-400">
            {project.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>

        {project.tip && (
          <p className="mb-4 rounded bg-blue-900/30 p-3 text-blue-300">
            💡 {project.tip}
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-500"
        >
          Open Map Canvas
        </button>
      </div>
    </div>
  );
}

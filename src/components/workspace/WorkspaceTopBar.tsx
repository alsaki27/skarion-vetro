"use client";

import { useState } from "react";
import type { ProjectFixture } from "@/lib/types";
import { useDesignStore } from "@/lib/store";

export function WorkspaceTopBar({
  project,
  onToggleBrief,
}: {
  project: ProjectFixture;
  onToggleBrief: () => void;
}) {
  const [search, setSearch] = useState("");
  const grading = useDesignStore((s) => s.grading);
  const issueCount = grading?.checks.filter((c) => c.status === "fail").length ?? 0;

  return (
    <header className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-sm shrink-0">
      <span className="font-semibold text-white truncate">{project.title}</span>
      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
        {project.difficulty}
      </span>

      <div className="flex items-center gap-2 ml-4 flex-1 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roads, addresses, features…"
          className="w-full rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          {project.environment}
        </span>
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
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          Student
        </span>
      </div>
    </header>
  );
}

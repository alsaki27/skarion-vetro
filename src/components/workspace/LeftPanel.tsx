"use client";

import { useState } from "react";
import { useDesignStore } from "@/lib/store";
import { LayersPanel } from "./LayersPanel";
import { DataCatalogPanel } from "./DataCatalogPanel";
import { StudyAreaSelector } from "./StudyAreaSelector";
import { BasemapLayerControl } from "./BasemapLayerControl";

type LeftTab = "layers" | "catalog" | "project" | "issues";

export function LeftPanel({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<LeftTab>("layers");

  const tabs: { id: LeftTab; label: string }[] = [
    { id: "layers", label: "Layers" },
    { id: "catalog", label: "Data Catalog" },
    { id: "project", label: "Project" },
    { id: "issues", label: "Issues" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tab === "layers" && (
          <>
            <BasemapLayerControl />
            <div className="my-2 border-t border-zinc-800" />
            <LayersPanel projectId={projectId} />
          </>
        )}
        {tab === "catalog" && <DataCatalogPanel projectId={projectId} />}
        {tab === "project" && <ProjectTab projectId={projectId} />}
        {tab === "issues" && <IssuesTab />}
      </div>
    </div>
  );
}

function ProjectTab({ projectId }: { projectId: string }) {
  return (
    <div className="text-xs text-zinc-400 space-y-3">
      <div>
        <div className="mb-2 font-medium text-zinc-300">Project Info</div>
        <div className="space-y-1">
          <div>ID: <span className="text-zinc-500">{projectId}</span></div>
          <div>Stage: HLD</div>
        </div>
      </div>
      <StudyAreaSelector onSelect={(area) => console.log("Study area selected:", area)} />
    </div>
  );
}

function IssuesTab() {
  const grading = useDesignStore((s) => s.grading);
  if (!grading) {
    return (
      <div className="text-xs text-zinc-500">
        No grading results yet. Submit your design to see issues.
      </div>
    );
  }
  const fails = grading.checks.filter((c) => c.status === "fail");
  if (fails.length === 0) {
    return (
      <div className="text-xs text-green-400">
        All checks passed! Great work.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {fails.map((c) => (
        <div key={c.checkId} className="rounded bg-red-950/30 p-2 text-xs">
          <div className="font-medium text-red-300">{c.checkId}</div>
          <div className="text-zinc-400">{c.message}</div>
        </div>
      ))}
    </div>
  );
}

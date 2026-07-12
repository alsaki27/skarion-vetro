"use client";

import { useState } from "react";
import { useDesignStore } from "@/lib/store";
import { LayersPanel } from "./LayersPanel";
import { DataCatalogPanel } from "./DataCatalogPanel";
import { StudyAreaSelector } from "./StudyAreaSelector";
import { ServiceGroupPanel } from "./ServiceGroupPanel";

type LeftTab = "layers" | "catalog" | "project" | "issues" | "groups";

export function LeftPanel({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<LeftTab>("layers");

  const tabs: { id: LeftTab; label: string }[] = [
    { id: "layers", label: "Layers" },
    { id: "catalog", label: "Data Catalog" },
    { id: "project", label: "Project" },
    { id: "issues", label: "Issues" },
    { id: "groups", label: "Groups" },
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
        {tab === "layers" && <LayersPanel projectId={projectId} />}
        {tab === "catalog" && <DataCatalogPanel projectId={projectId} />}
        {tab === "project" && <ProjectTab projectId={projectId} />}
        {tab === "issues" && <IssuesTab />}
        {tab === "groups" && <ServiceGroupPanel />}
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
  const select = useDesignStore((s) => s.select);
  if (!grading) {
    return (
      <div className="text-xs text-zinc-500">
        No grading results yet. Submit your design to see issues.
      </div>
    );
  }
  const issues = grading.checks.filter((c) => c.status !== "pass");
  if (issues.length === 0) {
    return (
      <div className="text-xs text-green-400">
        All checks passed! Great work.
      </div>
    );
  }
  const bySeverity = {
    fail: issues.filter((c) => c.status === "fail"),
    warn: issues.filter((c) => c.status === "warn"),
    info: issues.filter((c) => c.status === "info"),
    not_evaluated: issues.filter((c) => c.status === "not_evaluated"),
  };
  return (
    <div className="space-y-2">
      {(["fail", "warn", "info", "not_evaluated"] as const).map((sev) => {
        const items = bySeverity[sev];
        if (items.length === 0) return null;
        const colors: Record<string, string> = {
          fail: "bg-red-950/30 border-red-800/50 text-red-300",
          warn: "bg-yellow-950/30 border-yellow-800/50 text-yellow-300",
          info: "bg-blue-950/30 border-blue-800/50 text-blue-300",
          not_evaluated: "bg-zinc-900/50 border-zinc-700/50 text-zinc-500",
        };
        return (
          <div key={sev} className="space-y-1">
            <div className="text-[10px] font-semibold uppercase text-zinc-500">{sev} ({items.length})</div>
            {items.map((c) => (
              <button
                key={c.checkId}
                onClick={() => { const ids = c.elementIds; if (ids?.length) select(ids[0]); }}
                className={`w-full text-left rounded border p-2 text-xs ${colors[sev]} hover:opacity-80 transition-opacity`}
              >
                <div className="font-medium">{c.checkId}</div>
                <div className="opacity-75">{c.message}</div>
                {c.elementIds && c.elementIds.length > 0 && (
                  <div className="text-[10px] opacity-50 mt-0.5">{c.elementIds.length} element(s) — click to select</div>
                )}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

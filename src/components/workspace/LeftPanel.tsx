"use client";

import { useState, useEffect } from "react";
import { useDesignStore } from "@/lib/store";
import { LayersPanel } from "./LayersPanel";
import { DataCatalogPanel } from "./DataCatalogPanel";
import { StudyAreaSelector } from "./StudyAreaSelector";
import { ServiceGroupPanel } from "./ServiceGroupPanel";
import { TopologyTrace } from "./TopologyTrace";
import { CompetencyTab } from "./CompetencyTab";
import { runConstructability } from "@/lib/constructability";
import type { NetworkElement } from "@/lib/types";

type LeftTab = "layers" | "catalog" | "project" | "issues" | "groups" | "trace" | "competency" | "qa";

export function LeftPanel({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<LeftTab>("layers");

  const tabs: { id: LeftTab; label: string }[] = [
    { id: "layers", label: "Layers" },
    { id: "catalog", label: "Catalog" },
    { id: "project", label: "Project" },
    { id: "issues", label: "Issues" },
    { id: "groups", label: "Groups" },
    { id: "trace", label: "Trace" },
    { id: "competency", label: "Skills" },
    { id: "qa", label: "QA" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
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
        {tab === "issues" && <IssuesTab projectId={projectId} />}
        {tab === "groups" && <ServiceGroupPanel />}
        {tab === "trace" && <TopologyTrace />}
        {tab === "competency" && <CompetencyTab />}
        {tab === "qa" && <QATab />}
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

function IssuesTab({ projectId: _projectId }: { projectId: string }) {
  const grading = useDesignStore((s) => s.grading);
  const elements = useDesignStore((s) => s.elements);
  const basemapData = useDesignStore((s) => s.basemapData);
  const select = useDesignStore((s) => s.select);

  const elemList = Object.values(elements) as NetworkElement[];
  const { issues: constructabilityIssues } = runConstructability(elemList, new Set(["parcels"]), {
    parcels: (basemapData?.parcels ?? []) as GeoJSON.Feature[],
  });

  const allIssues = [
    ...(grading?.checks.filter((c) => c.status === "fail" || c.status === "warn") ?? []),
  ];
  const totalIssues = allIssues.length + constructabilityIssues.length;

  if (totalIssues === 0) {
    return (
      <div className="text-xs text-zinc-500 space-y-2">
        <div className="text-green-400">No issues detected.</div>
        <div>Submit your design to run grading checks.</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase text-zinc-500">{totalIssues} total issues</div>

      {allIssues.map((c) => (
        <IssueCard key={c.checkId} issue={c} onSelect={select} />
      ))}

      {constructabilityIssues.length > 0 && (
        <>
          <div className="text-[10px] font-semibold uppercase text-zinc-500 mt-2">Constructability ({constructabilityIssues.length})</div>
          {constructabilityIssues.map((ci, i) => (
            <button
              key={`ci_${i}`}
              onClick={() => { if (ci.elementIds.length) select(ci.elementIds[0]); }}
              className={`w-full text-left rounded border p-2 text-xs ${
                ci.severity === "error" ? "bg-red-950/30 border-red-800/50 text-red-300" : "bg-yellow-950/30 border-yellow-800/50 text-yellow-300"
              } hover:opacity-80 transition-opacity`}
            >
              <div className="font-medium">{ci.ruleId.replace(/_/g, " ")}</div>
              <div className="opacity-75">{ci.message}</div>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function IssueCard({ issue, onSelect }: { issue: { checkId: string; message: string; status: string; elementIds?: string[] }; onSelect: (id: string) => void }) {
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const colors: Record<string, string> = {
    fail: "bg-red-950/30 border-red-800/50 text-red-300",
    warn: "bg-yellow-950/30 border-yellow-800/50 text-yellow-300",
    info: "bg-blue-950/30 border-blue-800/50 text-blue-300",
    not_evaluated: "bg-zinc-900/50 border-zinc-700/50 text-zinc-500",
  };

  const loadHint = async () => {
    setHintLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/hints?checkId=${issue.checkId}&tier=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { hint?: string };
      setHint(data.hint ?? "No hint available");
    } catch {
      setHint("Failed to load hint");
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <div className={`rounded border p-2 text-xs ${colors[issue.status] ?? colors.fail}`}>
      <button
        onClick={() => { if (issue.elementIds?.length) onSelect(issue.elementIds[0]); }}
        className="w-full text-left"
      >
        <div className="font-medium">{issue.checkId}</div>
        <div className="opacity-75">{issue.message}</div>
      </button>
      <button
        onClick={loadHint}
        disabled={hintLoading}
        className="mt-1 text-[10px] text-blue-400 hover:text-blue-300 disabled:text-zinc-600"
      >
        {hintLoading ? "Loading hint..." : hint ? hint : "💡 Get hint (tier 1)"}
      </button>
    </div>
  );
}

function QATab() {
  const [checklist, setChecklist] = useState<Array<{ id: string; title: string; description: string; isMandatory: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/qa/checklist?stage=hld", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json() as { items?: Array<{ id: string; title: string; description: string; isMandatory: boolean }> };
        setChecklist(data.items ?? []);
      } catch {
        setChecklist([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-xs text-zinc-500">Loading QA checklist...</div>;

  if (checklist.length === 0) {
    return (
      <div className="text-xs text-zinc-500">
        Submit your design to access the QA checklist.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase text-zinc-500">HLD QA Checklist ({checklist.length} items)</div>
      {checklist.map((item) => (
        <div key={item.id} className="rounded border border-zinc-800 p-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs text-zinc-300">{item.title}</span>
            {item.isMandatory && (
              <span className="text-[10px] text-red-400 font-medium shrink-0">Required</span>
            )}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{item.description}</div>
        </div>
      ))}
      <div className="text-[10px] text-zinc-600 mt-2 pt-2 border-t border-zinc-800">
        Complete all mandatory items before submitting for review.
      </div>
    </div>
  );
}

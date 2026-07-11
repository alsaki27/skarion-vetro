"use client";

import { useMemo, useState } from "react";
import { useDesignStore } from "@/lib/store";
import type { PointElementType, ProjectFixture } from "@/lib/types";
import { isContainerType, isLineElement, isPointElement } from "@/lib/types";
import { pathLengthFt } from "@/lib/geometry";
import { runGrading, runSingleCheck } from "@/lib/grading/engine";
import ScoreCard from "./ScoreCard";
import ContainmentTree from "./ContainmentTree";
import SpliceTable from "./SpliceTable";
import InstructorDashboard from "./InstructorDashboard";
import PortfolioExport from "./PortfolioExport";

const CABLE_COUNTS = [6, 12, 24, 48, 96, 144];
const SPLIT_RATIOS = ["1:4", "1:8", "1:16", "1:32", "1:64"];

function HostedEquipmentTray({ containerId }: { containerId: string }) {
  const elements = useDesignStore((s) => s.elements);
  const deleteElement = useDesignStore((s) => s.deleteElement);
  const unhostElement = useDesignStore((s) => s.unhostElement);
  const hostInContainer = useDesignStore((s) => s.hostInContainer);
  const container = elements[containerId];
  if (!container || !isPointElement(container) || !isContainerType(container.type)) return null;

  const hosted = Object.values(elements).filter(
    (e) => isPointElement(e) && e.parent_container_id === containerId,
  );
  const maxHosted = Number(container.attributes.maxHostedCount ?? 4);
  const capacityUsed = hosted.length;

  const addHosted = (type: PointElementType) => {
    // Place at same position as container (visual distinction handled by offset or cluster)
    const pos = container.position;
    hostInContainer(containerId, type, pos);
  };

  return (
    <div className="mt-3 space-y-2 rounded border border-zinc-700 bg-zinc-800/50 p-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-200">Hosted Equipment</span>
        <span className="text-[10px] text-zinc-500">
          {capacityUsed}/{maxHosted}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-zinc-700">
        <div
          className={`h-full ${capacityUsed >= maxHosted ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${Math.min(100, (capacityUsed / maxHosted) * 100)}%` }}
        />
      </div>

      {hosted.length === 0 && (
        <p className="text-[10px] text-zinc-500">No equipment hosted yet.</p>
      )}
      <ul className="space-y-1">
        {hosted.map((h) => (
          <li key={h.id} className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-300">{h.type} {h.label ?? h.id.slice(-4)}</span>
            <div className="flex gap-1">
              <button
                onClick={() => unhostElement(h.id)}
                className="rounded bg-zinc-700 px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-600"
                title="Remove from container (keeps on map)"
              >
                Eject
              </button>
              <button
                onClick={() => deleteElement(h.id)}
                className="rounded bg-red-900/40 px-1.5 py-0.5 text-red-400 hover:bg-red-900/70"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {capacityUsed < maxHosted && (
        <div className="flex flex-wrap gap-1 pt-1">
          {(["mst", "splitter", "splice_closure", "slack_loop"] as PointElementType[]).map((t) => (
            <button
              key={t}
              onClick={() => addHosted(t)}
              className="rounded bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-600"
            >
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertiesSection() {
  const selectedId = useDesignStore((s) => s.selectedId);
  const elements = useDesignStore((s) => s.elements);
  const updateAttributes = useDesignStore((s) => s.updateAttributes);
  const deleteElement = useDesignStore((s) => s.deleteElement);

  const el = selectedId ? elements[selectedId] : null;
  if (!el) {
    return (
      <p className="text-xs text-zinc-500">
        Select an element on the map to edit its properties.
      </p>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-200">
          {el.label ?? el.type}{" "}
          <span className="font-normal text-zinc-500">({el.type})</span>
        </span>
        {!el.locked && (
          <button
            onClick={() => {
              const hosted = isPointElement(el) && isContainerType(el.type)
                ? Object.values(elements).filter(
                    (e) => isPointElement(e) && e.parent_container_id === el.id,
                  )
                : [];
              if (hosted.length > 0) {
                const ok = window.confirm(
                  `This ${el.type} hosts ${hosted.length} equipment item(s). Deleting it will also remove all hosted contents. Continue?`,
                );
                if (!ok) return;
              }
              deleteElement(el.id);
            }}
            className="rounded bg-red-900/40 px-2 py-0.5 text-red-400 hover:bg-red-900/70"
          >
            {isPointElement(el) && isContainerType(el.type) &&
            Object.values(elements).some(
              (e) => isPointElement(e) && e.parent_container_id === el.id,
            )
              ? "Delete + hosted"
              : "Delete"}
          </button>
        )}
      </div>

      {el.locked && (
        <p className="text-zinc-500">Pre-loaded scenario element (read-only).</p>
      )}

      {isLineElement(el) && (
        <p className="text-zinc-400">
          Length: <b>{Math.round(pathLengthFt(el.path))} ft</b>
        </p>
      )}

      {isLineElement(el) && el.type === "cable" && !el.locked && (
        <label className="block">
          <span className="text-zinc-400">Fiber count</span>
          <select
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 p-1 text-zinc-200"
            value={Number(el.attributes.cable_count ?? 12)}
            onChange={(e) =>
              updateAttributes(el.id, { cable_count: Number(e.target.value) })
            }
          >
            {CABLE_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c}-count
              </option>
            ))}
          </select>
        </label>
      )}

      {isPointElement(el) && el.type === "splitter" && !el.locked && (
        <label className="block">
          <span className="text-zinc-400">Split ratio</span>
          <select
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 p-1 text-zinc-200"
            value={String(el.attributes.ratio ?? "1:8")}
            onChange={(e) => updateAttributes(el.id, { ratio: e.target.value })}
          >
            {SPLIT_RATIOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      )}

      {isPointElement(el) && el.type === "pole" && (
        <p className="text-zinc-400">
          Owner: {String(el.attributes.owner ?? "—")} · Height:{" "}
          {String(el.attributes.height_ft ?? "—")}ft · Attachments:{" "}
          {String(el.attributes.attachment_count ?? 0)}
        </p>
      )}

      {isPointElement(el) && el.type === "premise" && (
        <p className="text-zinc-400">{String(el.attributes.address ?? "")}</p>
      )}

      {/* Containment UI stub: show hosted equipment tray when a container is selected */}
      {isPointElement(el) && isContainerType(el.type) && !el.locked && (
        <HostedEquipmentTray containerId={el.id} />
      )}
    </div>
  );
}

function RequirementsSection({ project }: { project: ProjectFixture }) {
  const elements = useDesignStore((s) => s.elements);
  // live dry-run of each requirement's check (debounced by React render batching;
  // P1-scale designs grade in <1ms so this is fine client-side)
  const statuses = useMemo(() => {
    const els = Object.values(elements);
    return project.requirements.map((req) => ({
      req,
      result: runSingleCheck(req.checkId, project, els),
    }));
  }, [elements, project]);

  return (
    <ul className="space-y-1.5">
      {statuses.map(({ req, result }) => {
        const ok = result?.status === "pass";
        return (
          <li key={req.id} className="flex items-start gap-2 text-xs">
            <span>{ok ? "✅" : "⬜"}</span>
            <span className={ok ? "text-zinc-300" : "text-zinc-400"}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function SidePanel({ project }: { project: ProjectFixture }) {
  const elements = useDesignStore((s) => s.elements);
  const grading = useDesignStore((s) => s.grading);
  const setGrading = useDesignStore((s) => s.setGrading);
  const lldMode = useDesignStore((s) => s.lldMode);
  const [tab, setTab] = useState<"design" | "score" | "lld" | "dashboard" | "portfolio">("design");

  const submit = () => {
    const result = runGrading(project, Object.values(elements));
    setGrading(result);
    setTab("score");
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex border-b border-zinc-800 text-xs">
        {(["design", "score", "lld", "dashboard", "portfolio"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-2 py-2 text-[10px] font-medium leading-tight ${
              tab === t
                ? "border-b-2 border-blue-500 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "design" ? "Design" : t === "score" ? `Score${grading ? ` (${grading.totalScore})` : ""}` : t === "lld" ? "LLD" : t === "dashboard" ? "Dashboard" : "Portfolio"}
          </button>
        ))}
      </div>
      {!lldMode && tab === "lld" && (
        <div className="p-3 text-xs text-zinc-500">
          <p className="mb-2">LLD mode is locked until you pass HLD grading.</p>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {tab === "design" ? (
          <>
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Properties
              </h3>
              <PropertiesSection />
            </section>
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Requirements
              </h3>
              <RequirementsSection project={project} />
            </section>
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Containment Tree
              </h3>
              <ContainmentTree />
            </section>
          </>
        ) : tab === "lld" && lldMode ? (
          <>
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Splice Table
              </h3>
              <SpliceTable />
            </section>
          </>
        ) : tab === "dashboard" ? (
          <InstructorDashboard />
        ) : tab === "portfolio" ? (
          <PortfolioExport projectTitle={project.title} />
        ) : (
          <ScoreCard grading={grading} />
        )}
      </div>

      <div className="border-t border-zinc-800 p-3">
        <button
          onClick={submit}
          className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          📤 Submit for Grading
        </button>
      </div>
    </div>
  );
}

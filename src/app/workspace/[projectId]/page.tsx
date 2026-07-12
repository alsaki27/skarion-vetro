"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PROJECTS } from "@/lib/projects";
import { useDesignStore } from "@/lib/store";
import { WorkspaceTopBar } from "@/components/workspace/WorkspaceTopBar";
import { WorkspaceToolStrip } from "@/components/workspace/WorkspaceToolStrip";
import { WorkspaceStatusBar } from "@/components/workspace/WorkspaceStatusBar";
import { WorkspaceOutputs } from "@/components/workspace/WorkspaceOutputs";
import { WorkspaceGrade } from "@/components/workspace/WorkspaceGrade";
import { LeftPanel } from "@/components/workspace/LeftPanel";
import { RightPanel } from "@/components/workspace/RightPanel";
import { BottomPanel } from "@/components/workspace/BottomPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import BriefModal from "@/components/BriefModal";
import { usePanelState } from "@/lib/use-panel-state";
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const project = PROJECTS[projectId];
  const loadElements = useDesignStore((s) => s.loadElements);
  const [briefOpen, setBriefOpen] = useState(true);
  const [outputsOpen, setOutputsOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const { state, set, toggleLeft, toggleRight, toggleBottom } = usePanelState(projectId);

  useEffect(() => {
    if (project) loadElements(project.preloadedElements);
  }, [project, loadElements]);

  useKeyboardShortcuts(
    useMemo(() => ({
      "Toggle Left Panel": toggleLeft,
      "Toggle Right Panel": toggleRight,
      "Toggle Bottom Panel": toggleBottom,
      "Toggle Brief": () => setBriefOpen((v) => !v),
    }), [toggleLeft, toggleRight, toggleBottom]),
  );

  if (!project) {
    return (
      <main className="p-10 text-zinc-300">
        Project not found.{" "}
        <Link className="text-blue-400 underline" href="/curriculum">
          Back to curriculum
        </Link>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      <WorkspaceTopBar
        project={project}
        onToggleBrief={() => setBriefOpen(true)}
        onOutputs={() => setOutputsOpen(true)}
        onGrade={() => setGradeOpen(true)}
      />

      {/* Drawing tool strip */}
      <WorkspaceToolStrip />

      <div className="flex flex-1 min-h-0">
        {/* Left panel */}
        <div
          className={`flex flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-200 ${
            state.leftCollapsed ? "w-10 min-w-[2.5rem]" : "min-w-[16rem] max-w-[20rem]"
          }`}
          style={state.leftCollapsed ? undefined : { width: state.leftWidth }}
        >
          <button
            onClick={toggleLeft}
            className="flex items-center justify-center h-8 border-b border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
            title={state.leftCollapsed ? "Expand panel" : "Collapse panel"}
          >
            <span className="text-xs">{state.leftCollapsed ? "☰" : "✕"}</span>
          </button>
          {!state.leftCollapsed && (
            <ErrorBoundary label="Left Panel">
              <div className="flex-1 overflow-y-auto">
                <LeftPanel projectId={projectId} />
              </div>
            </ErrorBoundary>
          )}
        </div>

        {/* Resize handle */}
        {!state.leftCollapsed && (
          <div
            className="w-1 cursor-col-resize bg-transparent hover:bg-zinc-700 active:bg-zinc-600 shrink-0"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = state.leftWidth;
              function onMove(ev: MouseEvent) {
                const delta = ev.clientX - startX;
                const newWidth = Math.max(160, Math.min(360, startWidth + delta));
                set({ leftWidth: newWidth });
              }
              function onUp() {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              }
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          />
        )}

        {/* Center: map + bottom panel */}
        <div className="flex flex-col flex-1 min-w-0">
          <ErrorBoundary label="Map">
            <div className="flex-1 min-h-0 relative">
              <MapCanvas project={project} />
            </div>
          </ErrorBoundary>

          {/* Bottom panel resize handle */}
          {!state.bottomCollapsed && (
            <div
              className="h-1 cursor-row-resize bg-transparent hover:bg-zinc-700 active:bg-zinc-600 shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startHeight = state.bottomHeight;
                function onMove(ev: MouseEvent) {
                  const delta = ev.clientY - startY;
                  const newHeight = Math.max(96, Math.min(480, startHeight - delta));
                  set({ bottomHeight: newHeight });
                }
                function onUp() {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                }
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
          )}

          {/* Bottom panel */}
          <div
            className={`flex flex-col border-t border-zinc-800 bg-zinc-900 transition-all duration-200 ${
              state.bottomCollapsed ? "h-8 shrink-0" : "shrink-0"
            }`}
            style={state.bottomCollapsed ? undefined : { height: state.bottomHeight }}
          >
            <button
              onClick={toggleBottom}
              className="flex items-center justify-center h-8 text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
            >
              {state.bottomCollapsed ? "▲" : "▼"} Attribute Table
            </button>
            {!state.bottomCollapsed && (
              <ErrorBoundary label="Attribute Table">
                <div className="flex-1 overflow-hidden">
                  <BottomPanel projectId={projectId} />
                </div>
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* Right panel resize handle */}
        {!state.rightCollapsed && (
          <div
            className="w-1 cursor-col-resize bg-transparent hover:bg-zinc-700 active:bg-zinc-600 shrink-0"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = state.rightWidth;
              function onMove(ev: MouseEvent) {
                const delta = startX - ev.clientX;
                const newWidth = Math.max(180, Math.min(400, startWidth + delta));
                set({ rightWidth: newWidth });
              }
              function onUp() {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              }
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          />
        )}

        {/* Right panel */}
        <div
          className={`flex flex-col border-l border-zinc-800 bg-zinc-900 transition-all duration-200 ${
            state.rightCollapsed ? "w-10 min-w-[2.5rem]" : "min-w-[18rem] max-w-[24rem]"
          }`}
          style={state.rightCollapsed ? undefined : { width: state.rightWidth }}
        >
          <button
            onClick={toggleRight}
            className="flex items-center justify-center h-8 border-b border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
            title={state.rightCollapsed ? "Expand panel" : "Collapse panel"}
          >
            <span className="text-xs">{state.rightCollapsed ? "☰" : "✕"}</span>
          </button>
          {!state.rightCollapsed && (
            <ErrorBoundary label="Inspector">
              <div className="flex-1 overflow-y-auto">
                <RightPanel />
              </div>
            </ErrorBoundary>
          )}
        </div>
      </div>

      <WorkspaceStatusBar />

      {briefOpen && (
        <BriefModal project={project} onClose={() => setBriefOpen(false)} />
      )}
      {outputsOpen && (
        <WorkspaceOutputs onClose={() => setOutputsOpen(false)} />
      )}
      {gradeOpen && (
        <WorkspaceGrade project={project} onClose={() => setGradeOpen(false)} />
      )}
    </div>
  );
}

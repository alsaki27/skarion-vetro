"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PROJECTS } from "@/lib/projects";
import { useDesignStore } from "@/lib/store";
import { WorkspaceTopBar } from "@/components/workspace/WorkspaceTopBar";
import { LeftPanel } from "@/components/workspace/LeftPanel";
import { RightPanel } from "@/components/workspace/RightPanel";
import { BottomPanel } from "@/components/workspace/BottomPanel";
import BriefModal from "@/components/BriefModal";

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
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);

  useEffect(() => {
    if (project) loadElements(project.preloadedElements);
  }, [project, loadElements]);

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
      />

      <div className="flex flex-1 min-h-0">
        {/* Left panel */}
        <div
          className={`flex flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-200 ${
            leftCollapsed ? "w-10" : "w-64 min-w-[16rem] max-w-[20rem]"
          }`}
        >
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="flex items-center justify-center h-8 border-b border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title={leftCollapsed ? "Expand" : "Collapse"}
          >
            {leftCollapsed ? "▶" : "◀"}
          </button>
          {!leftCollapsed && (
            <div className="flex-1 overflow-y-auto">
              <LeftPanel projectId={projectId} />
            </div>
          )}
        </div>

        {/* Center: map + bottom panel */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 min-h-0 relative">
            <MapCanvas project={project} />
          </div>

          {/* Bottom panel */}
          <div
            className={`flex flex-col border-t border-zinc-800 bg-zinc-900 transition-all duration-200 ${
              bottomCollapsed ? "h-8" : "h-48 min-h-[12rem]"
            }`}
          >
            <button
              onClick={() => setBottomCollapsed(!bottomCollapsed)}
              className="flex items-center justify-center h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {bottomCollapsed ? "▲ Attribute Table" : "▼ Attribute Table"}
            </button>
            {!bottomCollapsed && (
              <div className="flex-1 overflow-hidden">
                <BottomPanel projectId={projectId} />
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div
          className={`flex flex-col border-l border-zinc-800 bg-zinc-900 transition-all duration-200 ${
            rightCollapsed ? "w-10" : "w-72 min-w-[18rem] max-w-[24rem]"
          }`}
        >
          <button
            onClick={() => setRightCollapsed(!rightCollapsed)}
            className="flex items-center justify-center h-8 border-b border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title={rightCollapsed ? "Expand" : "Collapse"}
          >
            {rightCollapsed ? "◀" : "▶"}
          </button>
          {!rightCollapsed && (
            <div className="flex-1 overflow-y-auto">
              <RightPanel />
            </div>
          )}
        </div>
      </div>

      {briefOpen && (
        <BriefModal project={project} onClose={() => setBriefOpen(false)} />
      )}
    </div>
  );
}

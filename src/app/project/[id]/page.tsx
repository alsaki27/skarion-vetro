"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PROJECTS } from "@/lib/projects/p1-greenfield";
import { useDesignStore } from "@/lib/store";
import Toolbar from "@/components/Toolbar";
import SidePanel from "@/components/SidePanel";
import BriefModal from "@/components/BriefModal";

// MapLibre touches `window` — client-only
const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = PROJECTS[id];
  const loadElements = useDesignStore((s) => s.loadElements);
  const [briefOpen, setBriefOpen] = useState(true);

  useEffect(() => {
    if (project) loadElements(project.preloadedElements);
  }, [project, loadElements]);

  if (!project) {
    return (
      <main className="p-10 text-zinc-300">
        Project not found.{" "}
        <Link className="text-blue-400 underline" href="/">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
        <Link href="/" className="text-zinc-400 hover:text-white">
          ⬅️
        </Link>
        <span className="font-semibold text-white">{project.title}</span>
        <button
          onClick={() => setBriefOpen(true)}
          className="ml-auto rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          📋 Brief
        </button>
      </header>

      <Toolbar project={project} />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <MapCanvas project={project} />
        </div>
        <SidePanel project={project} />
      </div>

      {briefOpen && (
        <BriefModal project={project} onClose={() => setBriefOpen(false)} />
      )}
    </div>
  );
}

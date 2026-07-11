"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PROJECTS } from "@/lib/projects";
import { useAuth } from "@/lib/auth-context";

const UPCOMING = [
  { id: "p4-split-lab", title: "Project 4: Split Architecture Lab", env: "Aerial · Centralized vs Distributed" },
  { id: "p5-splice-master", title: "Project 5: Splice Table Master", env: "LLD · Both" },
  { id: "p6-pole-loading", title: "Project 6: Pole Loading & Make-Ready", env: "Aerial · NESC Loading" },
  { id: "p7-parkview", title: "Project 7: Parkview MDU", env: "Mixed · MDU" },
  { id: "p8-westside", title: "Project 8: Westside Village HLD", env: "Mixed · Capstone" },
  { id: "p9-riverside", title: "Project 9: Riverside Crossing", env: "Mixed · Capstone" },
];

export default function CurriculumPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/curriculum");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  const projects = Object.values(PROJECTS);
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Skarion-VETRO{" "}
            <span className="font-normal text-zinc-500">· Curriculum</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Welcome, {user.name}. Design real fiber networks on a live map.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            ← Home
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-red-700 hover:text-red-400"
          >
            Log out
          </button>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Projects
      </h2>
      <div className="space-y-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/project/${p.id}`}
            className="block rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-blue-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">🟢 {p.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {p.difficulty} · {p.environment} · pass ≥{p.passThreshold}
                </p>
              </div>
              <span className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                START
              </span>
            </div>
          </Link>
        ))}

        {UPCOMING.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-4 opacity-60"
          >
            <h3 className="font-semibold text-zinc-400">⚪ {p.title}</h3>
            <p className="mt-0.5 text-xs text-zinc-600">
              {p.env} · locked — complete the previous project
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

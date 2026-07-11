"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PROJECTS } from "@/lib/projects";

interface ProgressRecord {
  userId: string;
  projectId: string;
  status: string;
  bestScore: number | null;
  attempts: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export default function CurriculumPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [progress, setProgress] = useState<Map<string, ProgressRecord>>(new Map());
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/curriculum");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/progress")
      .then((r) => r.ok ? r.json() : { progress: [] })
      .then((data) => {
        if (!cancelled) {
          const map = new Map<string, ProgressRecord>();
          for (const p of data.progress) map.set(p.projectId, p);
          setProgress(map);
        }
      })
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center bg-zinc-950"><p className="text-sm text-zinc-500">Loading…</p></div>;

  const projects = Object.values(PROJECTS);

  const notStarted = projects.filter((p) => !progress.has(p.id));
  const inProgress = projects.filter((p) => progress.get(p.id)?.status === "in_progress");
  const passed = projects.filter((p) => progress.get(p.id)?.status === "passed");

  const startProject = async (projectId: string) => {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    router.push(`/project/${projectId}`);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Skarion-VETRO{" "}
            <span className="font-normal text-zinc-500">· My Learning</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Welcome back, {user.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.role !== "student" && (
            <Link href="/author/curriculum" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
              Author
            </Link>
          )}
          <button onClick={logout} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-red-700 hover:text-red-400">
            Log out
          </button>
        </div>
      </div>

      {fetching ? (
        <p className="text-sm text-zinc-500">Loading progress…</p>
      ) : (
        <div className="space-y-6">
          {/* In Progress */}
          {inProgress.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-yellow-500">
                In Progress ({inProgress.length})
              </h2>
              <div className="space-y-3">
                {inProgress.map((p) => {
                  const prog = progress.get(p.id)!;
                  return (
                    <div key={p.id} className="rounded-lg border border-yellow-800/50 bg-zinc-900 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{p.title}</h3>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {p.difficulty} · {p.environment} · {prog.attempts ?? 0} attempt(s)
                            {prog.bestScore != null ? ` · Best: ${prog.bestScore}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/project/${p.id}`)}
                          className="rounded bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-500"
                        >
                          Resume →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Passed */}
          {passed.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-green-500">
                Passed ({passed.length})
              </h2>
              <div className="space-y-3">
                {passed.map((p) => {
                  const prog = progress.get(p.id)!;
                  return (
                    <div key={p.id} className="rounded-lg border border-green-800/30 bg-zinc-900/70 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-green-300">✅ {p.title}</h3>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Score: {prog.bestScore} · {prog.attempts} attempt(s)
                          </p>
                        </div>
                        <Link href={`/project/${p.id}`} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500">
                          Review
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Not Started */}
          {notStarted.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Available ({notStarted.length})
              </h2>
              <div className="space-y-3">
                {notStarted.map((p) => (
                  <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-blue-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{p.title}</h3>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {p.difficulty} · {p.environment} · pass ≥{p.passThreshold}
                        </p>
                      </div>
                      <button
                        onClick={() => startProject(p.id)}
                        className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {projects.length === 0 && (
            <p className="text-sm text-zinc-500">No projects available yet.</p>
          )}
        </div>
      )}
    </main>
  );
}

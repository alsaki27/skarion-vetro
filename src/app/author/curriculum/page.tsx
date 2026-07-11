"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface CurriculumProject {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  environment: string;
  state: string;
}

export default function AuthorCurriculumPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<CurriculumProject[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/author/curriculum");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/curriculum")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (!cancelled && data) setProjects(data.projects); })
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center bg-zinc-950"><p className="text-sm text-zinc-500">Loading…</p></div>;

  if (user.role === "student") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-white">Access denied</h1>
        <p className="mt-2 text-zinc-500">Only instructors and admins can access curriculum authoring.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Curriculum Authoring</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage and publish project definitions</p>
        </div>
        <button onClick={() => router.push("/curriculum")} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
          ← Back
        </button>
      </div>

      {fetching ? (
        <p className="text-sm text-zinc-500">Loading projects…</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{p.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{p.difficulty} · {p.environment} · {p.state}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  p.state === "published" ? "bg-green-900/30 text-green-400" :
                  p.state === "draft" ? "bg-zinc-800 text-zinc-400" :
                  "bg-blue-900/30 text-blue-400"
                }`}>{p.state}</span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-zinc-500">No curriculum projects yet. Use the DB seed script to import fixtures.</p>
          )}
        </div>
      )}
    </main>
  );
}

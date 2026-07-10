import Link from "next/link";
import { PROJECTS } from "@/lib/projects/p1-greenfield";

const UPCOMING = [
  { id: "p2", title: "Project 2: Oakwood Underground", env: "Underground · Centralized" },
  { id: "p3", title: "Project 3: Sunset Ridge Aerial", env: "Aerial · Distributed" },
  { id: "p4", title: "Project 4: Split Architecture Lab", env: "Aerial · Centralized vs Distributed" },
  { id: "p5", title: "Project 5: Splice Table Master", env: "LLD · Both" },
];

export default function Dashboard() {
  const projects = Object.values(PROJECTS);
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-white">
        Skarion-VETRO{" "}
        <span className="font-normal text-zinc-500">· Student Edition</span>
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Design real fiber networks on a live map. Instant scoring. Portfolio-ready.
      </p>

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

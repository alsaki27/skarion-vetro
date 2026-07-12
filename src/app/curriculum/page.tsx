import Link from "next/link";
import { PROJECTS } from "@/lib/projects";

// p10 (Parkside Georgetown) is the flagship active project: it runs on a real,
// provenance-tracked county basemap (real WCAD parcels + real E911 address
// points) with checks validated against real geometry. p2/p3 are legacy
// synthetic fixtures kept active as secondary practice scenarios. p1, p4-p9
// remain deferred per the platform boundary — not yet on real data.
const ACTIVE_PROJECT_IDS = new Set([
  "p10-parkside-georgetown",
  "p2-oakwood-underground",
  "p3-sunset-ridge",
]);

const DEFERRED_PROJECTS = [
  { id: "p1-greenfield", title: "Project 1: Greenfield First Light", env: "Aerial · Beginner" },
  { id: "p4-split-lab", title: "Project 4: Split Architecture Lab", env: "Aerial · Advanced" },
  { id: "p5-splice-master", title: "Project 5: Splice Table Master", env: "LLD · Mixed" },
  { id: "p6-pole-loading", title: "Project 6: Pole Loading & Make-Ready", env: "Aerial · Advanced" },
  { id: "p7-parkview", title: "Project 7: Parkview MDU", env: "Mixed · Advanced" },
  { id: "p8-westside", title: "Project 8: Westside Village HLD", env: "Mixed · Capstone" },
  { id: "p9-riverside", title: "Project 9: Riverside Crossing", env: "Mixed · Capstone" },
];

export default function CurriculumPage() {
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
            Design real fiber networks on a live map. Instant scoring. Portfolio-ready.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          ← Home
        </Link>
      </div>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Active Projects
      </h2>
      <div className="space-y-3">
        {projects.filter((p) => ACTIVE_PROJECT_IDS.has(p.id)).map((p) => (
          <Link
            key={p.id}
            href={`/workspace/${p.id}`}
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
      </div>

      {DEFERRED_PROJECTS.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            In Development
          </h2>
          <div className="space-y-2">
            {DEFERRED_PROJECTS.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-4 opacity-60"
              >
                <h3 className="font-semibold text-zinc-400">⚪ {p.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-600">
                  {p.env} · coming soon
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

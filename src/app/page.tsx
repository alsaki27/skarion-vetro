import Link from "next/link";

const FEATURES = [
  {
    title: "Map Canvas",
    desc: "Interactive MapLibre-based design canvas with satellite & street baselines. Drop poles, handholes, conduit, and fiber drops directly on a real map.",
    icon: "🗺️",
  },
  {
    title: "Grading Engine",
    desc: "13+ deterministic checks across connectivity, compliance, efficiency, containment, and LLD. Instant scoring with weighted category breakdowns.",
    icon: "✅",
  },
  {
    title: "LLD Mode",
    desc: "Low-level design with splice tables, fiber assignments, tube colors, and splitter ratios. Unlocked after passing HLD gate for each project.",
    icon: "🔀",
  },
  {
    title: "Containment Tree",
    desc: "Hierarchical equipment hosting inside handholes, vaults, pedestals, and flowerpots. Visual occupancy tracking and capacity validation.",
    icon: "📦",
  },
  {
    title: "Portfolio Export",
    desc: "Export your completed designs as structured JSON portfolios. Include grading results, element inventories, and project metadata.",
    icon: "📄",
  },
  {
    title: "DWG Import",
    desc: "Upload real survey DWG files to generate GeoJSON basemap layers (EOP, CL, RW, Parcel, Boundary) for your design area.",
    icon: "🏗️",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose a Project",
    desc: "Pick from 9 progressively challenging projects — from Greenfield aerial builds to mixed-environment capstone designs.",
  },
  {
    step: "02",
    title: "Design the Network",
    desc: "Place poles, cables, conduit, and equipment on a live map. Snap drops to premises and route mainlines from the CO.",
  },
  {
    step: "03",
    title: "Submit for Grading",
    desc: "Run the deterministic grading engine against 13+ checks. Get instant scores with category breakdowns and targeted feedback.",
  },
  {
    step: "04",
    title: "Iterate & Pass",
    desc: "Refine your design based on check feedback. Meet the pass threshold to unlock LLD mode and splice table assignments.",
  },
];

const PROJECT_PREVIEWS = [
  { id: "p1-greenfield", num: "P1", title: "Greenfield Build", difficulty: "Beginner", env: "Aerial" },
  { id: "p2-oakwood", num: "P2", title: "Oakwood Underground", difficulty: "Beginner", env: "Underground" },
  { id: "p3-sunset", num: "P3", title: "Sunset Aerial", difficulty: "Intermediate", env: "Aerial" },
  { id: "p4-split-lab", num: "P4", title: "Split Architecture Lab", difficulty: "Intermediate", env: "Aerial" },
];

const FAQ = [
  {
    q: "What is Skarion-VETRO?",
    a: "Skarion-VETRO is an open-source, AI-guided platform for learning outside plant (OSP) fiber network design. Students build real networks on a live map, receive instant deterministic grading, and build a portfolio of HLD and LLD designs.",
  },
  {
    q: "Do I need prior telecom experience?",
    a: "No. Projects are scaffolded from beginner (P1–P2) through intermediate (P3–P4) to advanced capstones (P8–P9). Each project includes a design brief with requirements, constraints, and pre-loaded scenario elements.",
  },
  {
    q: "How does grading work?",
    a: "The grading engine runs 13+ deterministic checks against your design — coverage, connectivity, compliance, efficiency, containment rules, and LLD fiber assignments. Scores are weighted per project with category breakdowns. There is no AI grading; every check is a rule-driven pass/fail/warn.",
  },
  {
    q: "What is LLD mode?",
    a: "Low-Level Design (LLD) mode adds splice tables, fiber assignments, tube colors, and splitter ratio configuration. It unlocks per-project after passing the HLD grading threshold, simulating real-world design gates.",
  },
  {
    q: "Can I export my work?",
    a: "Yes. Completed designs can be exported as structured JSON portfolios. Instructor dashboards provide cohort-level progress tracking across all students and projects.",
  },
  {
    q: "Is this a real network planning tool?",
    a: "Skarion-VETRO is an educational simulation. It teaches OSP fiber design principles using real map data and industry conventions, but is not intended for production network engineering.",
  },
];

export default function LandingPage() {
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold text-white">Skarion-VETRO</span>
          </div>
          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="#projects" className="transition-colors hover:text-white">Projects</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </div>
          <Link
            href="/curriculum"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Enter Curriculum →
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="border-b border-zinc-800 px-6 py-28 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="mb-4 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
              Open-Source OSP Design Training
            </span>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Design Fiber Networks.
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Get Graded Instantly.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
              AI-guided outside plant fiber network design training. Build HLD and LLD designs
              on a live map, run deterministic grading, and build a portfolio-ready skillset.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/curriculum"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Start Designing →
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-zinc-700 px-6 py-3 font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Learn More
              </a>
            </div>
            <div className="mx-auto mt-8 inline-flex cursor-pointer items-center gap-3 rounded-xl bg-zinc-900 px-5 py-3 font-mono text-sm text-zinc-300 ring-1 ring-zinc-800 transition-colors hover:ring-zinc-600">
              <span className="text-blue-400">$</span>
              <span>git clone github.com/skarion/vetro &amp;&amp; cd vetro &amp;&amp; npm run dev</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-zinc-800 px-6 py-12">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: "9", label: "Projects" },
              { value: "13+", label: "Grading Checks" },
              { value: "4", label: "Environments" },
              { value: "100%", label: "Deterministic" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-6 text-center">
                <div className="text-3xl font-bold text-blue-400">{s.value}</div>
                <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-zinc-800 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold text-white">Everything you need to learn OSP design</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-zinc-400">
              A complete platform for hands-on fiber network design education — from first pole to capstone portfolio.
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700"
                >
                  <div className="mb-3 text-2xl">{f.icon}</div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-b border-zinc-800 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold text-white">How it works</h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-zinc-400">
              Four steps from brief to passing grade. Each project guides you through real-world fiber design workflows.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {HOW_IT_WORKS.map((h) => (
                <div key={h.step} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-2 text-sm font-bold text-blue-400">{h.step}</div>
                  <h3 className="text-lg font-semibold text-white">{h.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="border-b border-zinc-800 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Available projects</h2>
                <p className="mt-2 text-zinc-400">
                  9 projects spanning aerial, underground, and mixed environments.
                </p>
              </div>
              <Link
                href="/curriculum"
                className="hidden rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white md:inline-block"
              >
                View all →
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {PROJECT_PREVIEWS.map((p) => (
                <Link
                  key={p.id}
                  href={`/project/${p.id}`}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-blue-600"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    {p.num}
                  </div>
                  <h3 className="mt-1 font-semibold text-white group-hover:text-blue-300">{p.title}</h3>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                      {p.difficulty}
                    </span>
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                      {p.env}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center md:hidden">
              <Link
                href="/curriculum"
                className="inline-block rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                View all projects →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-b border-zinc-800 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold text-white">Frequently asked questions</h2>
            <div className="mt-10 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors open:border-zinc-700"
                >
                  <summary className="cursor-pointer font-semibold text-white transition-colors group-open:text-blue-300">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 text-[10px] font-bold text-white">
              S
            </div>
            <span>Skarion-VETRO</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/skarion/vetro" className="transition-colors hover:text-zinc-300">
              GitHub
            </a>
            <a href="/curriculum" className="transition-colors hover:text-zinc-300">
              Curriculum
            </a>
            <a href="#faq" className="transition-colors hover:text-zinc-300">
              FAQ
            </a>
          </div>
          <p>Open-source OSP fiber design training</p>
        </div>
      </footer>
    </>
  );
}

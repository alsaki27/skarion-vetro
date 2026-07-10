import type {
  CheckResult,
  GradingResult,
  LineElement,
  NetworkElement,
  PointElement,
  ProjectFixture,
} from "../types";
import { isLineElement, isPointElement } from "../types";
import { distanceFt, pathLengthFt } from "../geometry";

// ---------------------------------------------------------------------------
// Design snapshot the checks operate on. One implementation, two consumers:
// the grader (all checks) and the AI tutor's run_check tool (single check,
// dry-run) per plan §3 "Check library".

export interface DesignContext {
  project: ProjectFixture;
  elements: NetworkElement[];
  points: PointElement[];
  lines: LineElement[];
  /** adjacency: point element id -> connected point element ids */
  graph: Map<string, Set<string>>;
}

const ENDPOINT_SNAP_FT = 40;

/** Resolve a line endpoint to a point element: explicit id first, then proximity. */
function resolveEndpoint(
  vertex: [number, number],
  explicitId: string | undefined,
  points: PointElement[],
): PointElement | null {
  if (explicitId) {
    const hit = points.find((p) => p.id === explicitId);
    if (hit) return hit;
  }
  let best: PointElement | null = null;
  let bestDist = ENDPOINT_SNAP_FT;
  for (const p of points) {
    const d = distanceFt(vertex, p.position);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function buildContext(
  project: ProjectFixture,
  elements: NetworkElement[],
): DesignContext {
  const points = elements.filter(isPointElement);
  const lines = elements.filter(isLineElement);
  const graph = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a)!.add(b);
    graph.get(b)!.add(a);
  };
  for (const line of lines) {
    if (line.path.length < 2) continue;
    // Resolve EVERY vertex to a nearby point element (not just endpoints):
    // a mainline CO→P1→…→P5 passes *through* poles, and drops attach at those
    // mid-vertices. Consecutive resolved vertices get linked, and any two
    // elements on the same line are transitively connected through the chain.
    let prevResolved: PointElement | null = null;
    for (let i = 0; i < line.path.length; i++) {
      const explicitId =
        i === 0
          ? line.startElementId
          : i === line.path.length - 1
            ? line.endElementId
            : undefined;
      const hit = resolveEndpoint(line.path[i], explicitId, points);
      if (hit) {
        if (prevResolved && prevResolved.id !== hit.id) {
          link(prevResolved.id, hit.id);
        }
        prevResolved = hit;
      }
    }
  }
  return { project, elements, points, lines, graph };
}

/** BFS: is there a path between two point elements through the line graph? */
function isConnected(ctx: DesignContext, fromId: string, toId: string): boolean {
  if (fromId === toId) return true;
  const seen = new Set<string>([fromId]);
  const queue = [fromId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of ctx.graph.get(cur) ?? []) {
      if (next === toId) return true;
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Check registry

export interface CheckDef {
  id: string;
  category: string;
  run: (ctx: DesignContext) => CheckResult;
}

const coverage: CheckDef = {
  id: "coverage",
  category: "coverage",
  run(ctx) {
    const maxDrop = ctx.project.constraints.maxDropCableFt ?? 150;
    const homes = ctx.points.filter((p) => p.type === "premise");
    const poles = ctx.points.filter((p) => p.type === "pole" || p.type === "co");
    const uncovered = homes.filter(
      (h) => !poles.some((p) => distanceFt(h.position, p.position) <= maxDrop),
    );
    const covered = homes.length - uncovered.length;
    const score = homes.length === 0 ? 0 : Math.round((covered / homes.length) * 100);
    return {
      checkId: "coverage",
      category: "coverage",
      status: uncovered.length === 0 ? "pass" : "fail",
      score,
      message:
        uncovered.length === 0
          ? `All ${homes.length} homes are within ${maxDrop}ft of a pole — good coverage.`
          : `${uncovered.length} home(s) (${uncovered.map((h) => h.label ?? h.id).join(", ")}) are more than ${maxDrop}ft from any pole.`,
      elementIds: uncovered.map((h) => h.id),
    };
  },
};

const connectivity: CheckDef = {
  id: "connectivity",
  category: "connectivity",
  run(ctx) {
    const co = ctx.points.find((p) => p.type === "co");
    const homes = ctx.points.filter((p) => p.type === "premise");
    if (!co) {
      return {
        checkId: "connectivity",
        category: "connectivity",
        status: "fail",
        score: 0,
        message: "No Central Office found in the design.",
      };
    }
    const disconnected = homes.filter((h) => !isConnected(ctx, h.id, co.id));
    const connected = homes.length - disconnected.length;
    const score = homes.length === 0 ? 0 : Math.round((connected / homes.length) * 100);
    return {
      checkId: "connectivity",
      category: "connectivity",
      status: disconnected.length === 0 ? "pass" : "fail",
      score,
      message:
        disconnected.length === 0
          ? `Every home traces back to the CO — full connectivity.`
          : `${connected} of ${homes.length} homes trace back to the CO. Not connected: ${disconnected.map((h) => h.label ?? h.id).join(", ")}. Check that your drops touch both the pole and the home, and the mainline reaches the CO.`,
      elementIds: disconnected.map((h) => h.id),
    };
  },
};

const mainline: CheckDef = {
  id: "mainline",
  category: "connectivity",
  run(ctx) {
    const co = ctx.points.find((p) => p.type === "co");
    const poles = ctx.points.filter((p) => p.type === "pole");
    if (!co) {
      return {
        checkId: "mainline",
        category: "connectivity",
        status: "fail",
        score: 0,
        message: "No Central Office found in the design.",
      };
    }
    const unreached = poles.filter((p) => !isConnected(ctx, p.id, co.id));
    const reached = poles.length - unreached.length;
    const score = poles.length === 0 ? 0 : Math.round((reached / poles.length) * 100);
    return {
      checkId: "mainline",
      category: "connectivity",
      status: unreached.length === 0 && poles.length > 0 ? "pass" : "fail",
      score,
      message:
        unreached.length === 0 && poles.length > 0
          ? `Mainline reaches all ${poles.length} poles from the CO.`
          : `${unreached.length} pole(s) (${unreached.map((p) => p.label ?? p.id).join(", ")}) aren't reached by a cable from the CO yet.`,
      elementIds: unreached.map((p) => p.id),
    };
  },
};

const capacity: CheckDef = {
  id: "capacity",
  category: "capacity",
  run(ctx) {
    const minCount = ctx.project.constraints.minCableCount ?? 12;
    const mainCables = ctx.lines.filter((l) => l.type === "cable");
    if (mainCables.length === 0) {
      return {
        checkId: "capacity",
        category: "capacity",
        status: "fail",
        score: 0,
        message: "No mainline cable drawn yet.",
      };
    }
    const undersized = mainCables.filter(
      (c) => Number(c.attributes.cable_count ?? 0) < minCount,
    );
    return {
      checkId: "capacity",
      category: "capacity",
      status: undersized.length === 0 ? "pass" : "fail",
      score: undersized.length === 0 ? 100 : 40,
      message:
        undersized.length === 0
          ? `Mainline cable is ${minCount}-count or larger — sufficient for this build.`
          : `${undersized.length} cable segment(s) are under ${minCount}-count. Select the cable and raise its fiber count in the properties panel.`,
      elementIds: undersized.map((c) => c.id),
    };
  },
};

const compliance: CheckDef = {
  id: "compliance",
  category: "compliance",
  run(ctx) {
    const maxSpan = ctx.project.constraints.maxPoleSpanFt ?? 300;
    const maxDrop = ctx.project.constraints.maxDropCableFt ?? 150;
    if (ctx.lines.length === 0) {
      return {
        checkId: "compliance",
        category: "compliance",
        status: "fail",
        score: 0,
        message: "Nothing drawn yet — spans and drops will be checked as you design.",
      };
    }
    const violations: string[] = [];
    const badIds: string[] = [];
    for (const line of ctx.lines) {
      if (line.type === "cable") {
        // every consecutive vertex pair is a span
        for (let i = 0; i < line.path.length - 1; i++) {
          const span = distanceFt(line.path[i], line.path[i + 1]);
          if (span > maxSpan) {
            violations.push(`a ${Math.round(span)}ft span (max ${maxSpan}ft)`);
            badIds.push(line.id);
          }
        }
      } else if (line.type === "drop_cable") {
        const len = pathLengthFt(line.path);
        if (len > maxDrop) {
          violations.push(`a ${Math.round(len)}ft drop (max ${maxDrop}ft)`);
          badIds.push(line.id);
        }
      }
    }
    const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 25);
    return {
      checkId: "compliance",
      category: "compliance",
      status: violations.length === 0 ? "pass" : "fail",
      score,
      message:
        violations.length === 0
          ? "All spans and drops are within limits — good compliance."
          : `Found ${violations.join("; ")}.`,
      elementIds: [...new Set(badIds)],
    };
  },
};

const efficiency: CheckDef = {
  id: "efficiency",
  category: "efficiency",
  run(ctx) {
    const optimal = ctx.project.optimalStats.totalCableFt;
    const total = ctx.lines
      .filter((l) => l.type === "cable" || l.type === "drop_cable")
      .reduce((sum, l) => sum + pathLengthFt(l.path), 0);
    if (total === 0) {
      return {
        checkId: "efficiency",
        category: "efficiency",
        status: "fail",
        score: 0,
        message: "No cable drawn yet.",
      };
    }
    const pctOver = ((total - optimal) / optimal) * 100;
    let score: number;
    if (pctOver <= 0) score = 100;
    else if (pctOver <= 5) score = 95;
    else if (pctOver <= 10) score = 85;
    else if (pctOver <= 20) score = 75;
    else if (pctOver <= 35) score = 55;
    else score = 30;
    return {
      checkId: "efficiency",
      category: "efficiency",
      status: score >= 75 ? "pass" : pctOver > 35 ? "fail" : "warn",
      score,
      message:
        pctOver <= 5
          ? `Total cable ${Math.round(total)}ft — within 5% of the optimal design. Very efficient.`
          : `Total cable ${Math.round(total)}ft is ${Math.round(pctOver)}% over the optimal ${optimal}ft. Look for a more direct route.`,
    };
  },
};

export const CHECK_REGISTRY: Record<string, CheckDef> = {
  coverage,
  connectivity,
  mainline,
  capacity,
  compliance,
  efficiency,
};

// ---------------------------------------------------------------------------

export function runGrading(
  project: ProjectFixture,
  elements: NetworkElement[],
): GradingResult {
  const ctx = buildContext(project, elements);
  const checks = Object.keys(project.gradingWeights)
    .map((id) => CHECK_REGISTRY[id])
    .filter(Boolean)
    .map((def) => def.run(ctx));

  const categories = checks.map((c) => ({
    name: c.category,
    weight: project.gradingWeights[c.checkId] ?? 0,
    score: c.score,
    status: c.status,
  }));

  const totalScore = Math.round(
    categories.reduce((sum, c) => sum + c.score * c.weight, 0),
  );

  return {
    totalScore,
    isPassing: totalScore >= project.passThreshold,
    passThreshold: project.passThreshold,
    categories,
    checks,
    gradedAt: new Date().toISOString(),
  };
}

/** Single-check dry run — the AI tutor's run_check tool uses this (Phase 2). */
export function runSingleCheck(
  checkId: string,
  project: ProjectFixture,
  elements: NetworkElement[],
): CheckResult | null {
  const def = CHECK_REGISTRY[checkId];
  if (!def) return null;
  return def.run(buildContext(project, elements));
}

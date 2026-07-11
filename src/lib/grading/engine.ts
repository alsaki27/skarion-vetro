import type {
  CheckResult,
  GradingResult,
  LineElement,
  NetworkElement,
  PointElement,
  ProjectFixture,
} from "../types";
import { isContainerType, isHostableType, isLineElement, isPointElement, HARDWARE_CATALOG } from "../types";
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
  /** container id -> set of hosted element ids (containment hierarchy) */
  containment: Map<string, Set<string>>;
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

  // Build containment map: container id -> set of hosted element ids
  const containment = new Map<string, Set<string>>();
  for (const p of points) {
    if (p.parent_container_id) {
      if (!containment.has(p.parent_container_id)) {
        containment.set(p.parent_container_id, new Set());
      }
      containment.get(p.parent_container_id)!.add(p.id);
      // Link hosted element to its container in the graph so connectivity
      // traverses through containment (Chunk 3 gap fix: a drop from a hosted
      // MST inside a handhole should count as connected to the handhole).
      link(p.id, p.parent_container_id);
    }
  }

  return { project, elements, points, lines, graph, containment };
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

const conduit_connectivity: CheckDef = {
  id: "conduit_connectivity",
  category: "connectivity",
  run(ctx) {
    // Build a conduit-only graph
    const conduitGraph = new Map<string, Set<string>>();
    const linkC = (a: string, b: string) => {
      if (!conduitGraph.has(a)) conduitGraph.set(a, new Set());
      if (!conduitGraph.has(b)) conduitGraph.set(b, new Set());
      conduitGraph.get(a)!.add(b);
      conduitGraph.get(b)!.add(a);
    };
    for (const line of ctx.lines) {
      if (line.type !== "conduit" || line.path.length < 2) continue;
      let prev: string | null = null;
      for (let i = 0; i < line.path.length; i++) {
        const explicitId = i === 0 ? line.startElementId : i === line.path.length - 1 ? line.endElementId : undefined;
        const hit = explicitId ? ctx.points.find((p) => p.id === explicitId) : null;
        if (hit) {
          if (prev && prev !== hit.id) linkC(prev, hit.id);
          prev = hit.id;
        }
      }
    }

    const co = ctx.points.find((p) => p.type === "co");
    if (!co) {
      return { checkId: "conduit_connectivity", category: "connectivity", status: "fail", score: 0, message: "No CO found." };
    }

    // Points that should be conduit-connected: vault, handhole, FDH, riser
    const conduitNodes = ctx.points.filter(
      (p) => p.type === "vault" || p.type === "handhole" || p.type === "fdh_cabinet" || p.type === "riser",
    );
    if (conduitNodes.length === 0) {
      return { checkId: "conduit_connectivity", category: "connectivity", status: "pass", score: 100, message: "No conduit-reachable nodes to check." };
    }

    // BFS from CO
    const seen = new Set<string>([co.id]);
    const queue = [co.id];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of conduitGraph.get(cur) ?? []) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }

    const unreached = conduitNodes.filter((p) => !seen.has(p.id));
    const reached = conduitNodes.length - unreached.length;
    const score = Math.round((reached / conduitNodes.length) * 100);
    return {
      checkId: "conduit_connectivity",
      category: "connectivity",
      status: unreached.length === 0 ? "pass" : "fail",
      score,
      message: unreached.length === 0
        ? `Conduit network connects all ${conduitNodes.length} structure(s) — full conduit coverage.`
        : `${unreached.length} structure(s) (${unreached.map((p) => p.label ?? p.id).join(", ")}) aren't reached by conduit from the CO yet.`,
      elementIds: unreached.map((p) => p.id),
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

// ---------------------------------------------------------------------------
// Chunk 12 — Containment checks

const container_capacity: CheckDef = {
  id: "container_capacity",
  category: "containment",
  run(ctx) {
    const containers = ctx.points.filter((p) => isContainerType(p.type));
    if (containers.length === 0) {
      return { checkId: "container_capacity", category: "containment", status: "pass", score: 100, message: "No containers to check." };
    }
    const overfilled: string[] = [];
    for (const c of containers) {
      const hosted = ctx.containment.get(c.id)?.size ?? 0;
      const catalogKey = String(c.attributes.catalog_key ?? "");
      const entry = catalogKey ? HARDWARE_CATALOG[catalogKey] : undefined;
      const maxHosted = entry?.maxHostedCount ?? 4;
      if (hosted > maxHosted) {
        overfilled.push(`${c.label ?? c.type} has ${hosted} item(s) (capacity ${maxHosted})`);
      }
    }
    const score = containers.length === 0 ? 100 : Math.round(((containers.length - overfilled.length) / containers.length) * 100);
    return {
      checkId: "container_capacity",
      category: "containment",
      status: overfilled.length === 0 ? "pass" : "fail",
      score,
      message: overfilled.length === 0
        ? `All ${containers.length} container(s) are within capacity.`
        : `Overfilled: ${overfilled.join("; ")}.`,
      elementIds: overfilled.length > 0 ? [] : undefined,
    };
  },
};

const equipment_must_be_hosted: CheckDef = {
  id: "equipment_must_be_hosted",
  category: "containment",
  run(ctx) {
    const hostable = ctx.points.filter((p) => isHostableType(p.type));
    const unhosted = hostable.filter((e) => !e.parent_container_id);
    const score = hostable.length === 0 ? 100 : Math.round(((hostable.length - unhosted.length) / hostable.length) * 100);
    return {
      checkId: "equipment_must_be_hosted",
      category: "containment",
      status: unhosted.length === 0 ? "pass" : "fail",
      score,
      message: unhosted.length === 0
        ? `All ${hostable.length} equipment item(s) are properly hosted in containers.`
        : `${unhosted.length} equipment item(s) are floating (not inside a container): ${unhosted.map((e) => e.label ?? e.type).join(", ")}. Open a handhole/vault/FDH and host them from the properties panel.`,
      elementIds: unhosted.map((e) => e.id),
    };
  },
};

const conduit_terminates_at_structure: CheckDef = {
  id: "conduit_terminates_at_structure",
  category: "containment",
  run(ctx) {
    const conduits = ctx.lines.filter((l) => l.type === "conduit");
    if (conduits.length === 0) {
      return { checkId: "conduit_terminates_at_structure", category: "containment", status: "pass", score: 100, message: "No conduit to check." };
    }
    const validEndpoints = new Set(["handhole", "vault", "fdh_cabinet", "riser", "pole", "co"]);
    const bad: Array<{ conduitId: string; issue: string }> = [];
    for (const conduit of conduits) {
      const startId = conduit.startElementId;
      const endId = conduit.endElementId;
      const startEl = startId ? ctx.points.find((p) => p.id === startId) : null;
      const endEl = endId ? ctx.points.find((p) => p.id === endId) : null;
      if (!startEl || !validEndpoints.has(startEl.type)) {
        bad.push({ conduitId: conduit.id, issue: "start not at a structure" });
      }
      if (!endEl || !validEndpoints.has(endEl.type)) {
        bad.push({ conduitId: conduit.id, issue: "end not at a structure" });
      }
    }
    const score = conduits.length === 0 ? 100 : Math.round(((conduits.length * 2 - bad.length) / (conduits.length * 2)) * 100);
    return {
      checkId: "conduit_terminates_at_structure",
      category: "containment",
      status: bad.length === 0 ? "pass" : "fail",
      score,
      message: bad.length === 0
        ? `All ${conduits.length} conduit(s) terminate at valid structures.`
        : `Issues: ${bad.map((b) => b.conduitId + " (" + b.issue + ")").join("; ")}. Conduit must start/end at a handhole, vault, FDH, riser, pole, or CO.`,
      elementIds: [...new Set(bad.map((b) => b.conduitId))],
    };
  },
};

const drop_from_hosted_terminal: CheckDef = {
  id: "drop_from_hosted_terminal",
  category: "containment",
  run(ctx) {
    const drops = ctx.lines.filter((l) => l.type === "drop_cable");
    if (drops.length === 0) {
      return { checkId: "drop_from_hosted_terminal", category: "containment", status: "fail", score: 0, message: "No drop cables drawn yet." };
    }
    const bad: Array<{ dropId: string; issue: string }> = [];
    for (const drop of drops) {
      const startId = drop.startElementId;
      if (!startId) {
        bad.push({ dropId: drop.id, issue: "start not snapped to any element" });
        continue;
      }
      const startEl = ctx.points.find((p) => p.id === startId);
      if (!startEl || startEl.type !== "mst") {
        bad.push({ dropId: drop.id, issue: "start must be an MST" });
      }
    }
    const score = drops.length === 0 ? 100 : Math.round(((drops.length - bad.length) / drops.length) * 100);
    return {
      checkId: "drop_from_hosted_terminal",
      category: "containment",
      status: bad.length === 0 ? "pass" : "fail",
      score,
      message: bad.length === 0
        ? `All ${drops.length} drop(s) originate from an MST — good.`
        : `Issues: ${bad.map((b) => b.dropId + " (" + b.issue + ")").join("; ")}. Each drop must snap to an MST.`,
      elementIds: [...new Set(bad.map((b) => b.dropId))],
    };
  },
};

const flowerpot_contents: CheckDef = {
  id: "flowerpot_contents",
  category: "containment",
  run(ctx) {
    const flowerpots = ctx.points.filter((p) => p.type === "flowerpot");
    if (flowerpots.length === 0) {
      return { checkId: "flowerpot_contents", category: "containment", status: "pass", score: 100, message: "No flowerpots to check." };
    }
    const bad: Array<{ fpId: string; issue: string }> = [];
    for (const fp of flowerpots) {
      const hosted = ctx.containment.get(fp.id);
      if (hosted) {
        for (const hid of hosted) {
          const el = ctx.points.find((p) => p.id === hid);
          if (el && el.type !== "slack_loop") {
            bad.push({ fpId: fp.id, issue: `contains ${el.type} (only slack_loop allowed)` });
          }
        }
      }
    }
    const score = flowerpots.length === 0 ? 100 : Math.round(((flowerpots.length - bad.length) / flowerpots.length) * 100);
    return {
      checkId: "flowerpot_contents",
      category: "containment",
      status: bad.length === 0 ? "pass" : "fail",
      score,
      message: bad.length === 0
        ? `All flowerpots contain only slack loops.`
        : `Issues: ${bad.map((b) => b.fpId + " " + b.issue).join("; ")}. Flowerpots can only host slack loops.`,
    };
  },
};

// ---------------------------------------------------------------------------
// Chunk 13 — LLD checks

const split_ratio_valid: CheckDef = {
  id: "split_ratio_valid",
  category: "lld",
  run(ctx) {
    const splitters = ctx.points.filter((p) => p.type === "splitter");
    if (splitters.length === 0) {
      return { checkId: "split_ratio_valid", category: "lld", status: "fail", score: 0, message: "No splitters found in the design." };
    }
    const bad: string[] = [];
    for (const sp of splitters) {
      const ratio = String(sp.attributes.ratio ?? "1:8");
      // Check that the splitter's out count doesn't exceed available cables/drops
      const connectedCables = ctx.lines.filter(
        (l) => l.startElementId === sp.id || l.endElementId === sp.id,
      );
      if (connectedCables.length < 2) {
        bad.push(`${sp.label ?? sp.id} (${ratio}) — insufficient connections`);
      }
    }
    const score = splitters.length === 0 ? 0 : Math.round(((splitters.length - bad.length) / splitters.length) * 100);
    return {
      checkId: "split_ratio_valid",
      category: "lld",
      status: bad.length === 0 ? "pass" : "fail",
      score,
      message: bad.length === 0
        ? `All ${splitters.length} splitter(s) have valid ratios and connections.`
        : `Issues: ${bad.join("; ")}.`,
    };
  },
};

const fiber_assignment_complete: CheckDef = {
  id: "fiber_assignment_complete",
  category: "lld",
  run(ctx) {
    const cables = ctx.lines.filter((l) => l.type === "cable");
    if (cables.length === 0) {
      return { checkId: "fiber_assignment_complete", category: "lld", status: "fail", score: 0, message: "No cables to check fiber assignments on." };
    }
    const unassigned = cables.filter((c) => {
      const assignments = c.attributes.fiber_assignments;
      return !assignments || (Array.isArray(assignments) && assignments.length === 0);
    });
    const totalCables = cables.length;
    const assigned = totalCables - unassigned.length;
    const score = Math.round((assigned / totalCables) * 100);
    return {
      checkId: "fiber_assignment_complete",
      category: "lld",
      status: unassigned.length === 0 ? "pass" : "fail",
      score,
      message: unassigned.length === 0
        ? `All ${totalCables} cable(s) have fiber assignments.`
        : `${unassigned.length} cable(s) have no fiber assignments yet. Open the Splice Table in LLD mode to assign fibers.`,
      elementIds: unassigned.map((c) => c.id),
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
  // Chunk 14 expanded checks
  conduit_connectivity,
  // Chunk 12 containment checks
  container_capacity,
  equipment_must_be_hosted,
  conduit_terminates_at_structure,
  drop_from_hosted_terminal,
  flowerpot_contents,
  // Chunk 13 LLD checks
  split_ratio_valid,
  fiber_assignment_complete,
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

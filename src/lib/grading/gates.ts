import type { NetworkElement, GradingResult } from "../types";
import { buildContext, runGrading, type CheckDef } from "./engine";
import type { ProjectFixture } from "../types";
import { checkConstructability, type ConstructabilityIssue } from "../constructability";
import { traceUpstream } from "../topology";

export interface GateResult {
  id: string;
  label: string;
  passed: boolean;
  message: string;
}

export interface AuthoritativeGrade {
  grading: GradingResult;
  gates: GateResult[];
  constructability: ConstructabilityIssue[];
  passed: boolean;
}

const MANDATORY_GATES: Array<{
  id: string;
  label: string;
  check: (elements: NetworkElement[]) => boolean;
  message: string;
}> = [
  {
    id: "has_co",
    label: "Central Office present",
    check: (els) => els.some((e) => e.type === "co"),
    message: "Design must include a Central Office",
  },
  {
    id: "has_premises",
    label: "Premises identified",
    check: (els) => els.some((e) => e.type === "premise"),
    message: "Design must have at least one premise",
  },
  {
    id: "premises_connected",
    label: "All premises connected",
    check: (els) => {
      const premises = els.filter((e) => e.type === "premise");
      if (premises.length === 0) return false;
      const lines = els.filter((e) => "path" in e);
      const connected = premises.filter((p) =>
        lines.some((l) => l.startElementId === p.id || l.endElementId === p.id),
      );
      return connected.length === premises.length;
    },
    message: "Every premise must be connected by a drop cable",
  },
  {
    id: "has_mainline",
    label: "Mainline cable connects CO to poles",
    check: (els) => {
      const cables = els.filter((e) => e.type === "cable");
      const poles = els.filter((e) => e.type === "pole");
      return cables.length > 0 && poles.length > 0;
    },
    message: "Design must include at least one mainline cable and pole",
  },
];

export function gradeAuthoritative(
  project: ProjectFixture,
  elements: NetworkElement[],
): AuthoritativeGrade {
  const grading = runGrading(project, elements);
  const ctx = buildContext(project, elements);

  const gates: GateResult[] = MANDATORY_GATES.map((g) => {
    const passed = g.check(elements);
    return {
      id: g.id,
      label: g.label,
      passed,
      message: passed ? `${g.label}: passed` : g.message,
    };
  });

  const allGatesPassed = gates.every((g) => g.passed);
  const constructability = checkConstructability(elements);
  const hasBlocking = constructability.some((c) => c.severity === "blocking");

  const passed = allGatesPassed && !hasBlocking && grading.totalScore >= project.passThreshold;

  return { grading, gates, constructability, passed };
}

import type { NetworkElement, GradingResult, ProjectFixture } from "./types";
import { isPointElement, isLineElement } from "./types";
import { pathLengthFt } from "./geometry";

export interface ExportPackage {
  project: {
    id: string;
    title: string;
    environment: string;
    difficulty: string;
  };
  elements: {
    points: Array<{ id: string; type: string; label?: string; position: [number, number] }>;
    lines: Array<{ id: string; type: string; label?: string; path: [number, number][]; lengthFt: number }>;
  };
  grading: {
    totalScore: number;
    isPassing: boolean;
    checks: Array<{ checkId: string; status: string; score: number; message: string }>;
  };
  topology: {
    premiseCount: number;
    connectedPremises: number;
    totalCableLengthFt: number;
  };
  exportedAt: string;
}

export function buildExportPackage(
  project: ProjectFixture,
  elements: NetworkElement[],
  grading: GradingResult | null,
): ExportPackage {
  const points = elements.filter(isPointElement);
  const lines = elements.filter(isLineElement);

  const premises = points.filter((p) => p.type === "premise");
  const connectedPremises = lines.filter((l) => l.type === "drop_cable").length;

  const totalCableLength = lines
    .filter((l) => l.type === "cable" || l.type === "drop_cable")
    .reduce((sum, l) => sum + pathLengthFt(l.path), 0);

  return {
    project: {
      id: project.id,
      title: project.title,
      environment: project.environment,
      difficulty: project.difficulty,
    },
    elements: {
      points: points.map((p) => ({
        id: p.id,
        type: p.type,
        label: p.label,
        position: p.position,
      })),
      lines: lines.map((l) => ({
        id: l.id,
        type: l.type,
        label: l.label,
        path: l.path,
        lengthFt: Math.round(pathLengthFt(l.path)),
      })),
    },
    grading: grading
      ? {
          totalScore: grading.totalScore,
          isPassing: grading.isPassing,
          checks: grading.checks.map((c) => ({
            checkId: c.checkId,
            status: c.status,
            score: c.score,
            message: c.message,
          })),
        }
      : { totalScore: 0, isPassing: false, checks: [] },
    topology: {
      premiseCount: premises.length,
      connectedPremises,
      totalCableLengthFt: Math.round(totalCableLength),
    },
    exportedAt: new Date().toISOString(),
  };
}

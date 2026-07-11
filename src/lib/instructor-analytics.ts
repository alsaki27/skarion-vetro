// Instructor analytics: cohort insight, project funnel, concept struggle.
export interface CohortAnalytics {
  cohortId: string;
  totalStudents: number;
  avgStageTimeDays: Record<string, number>;
  avgAttempts: number;
  commonGateFailures: { gateId: string; count: number }[];
  misconceptionTags: { tag: string; count: number }[];
  avgScore: number;
  hintUsageRate: number;
  overdueCount: number;
}

export interface ProjectFunnel {
  stage: string;
  total: number;
  completed: number;
  stuck: number;
  notStarted: number;
}

export function calculateFunnel(stages: string[], studentProgress: { stage: string; status: string }[]): ProjectFunnel[] {
  return stages.map((stage) => {
    const relevant = studentProgress.filter((p) => p.stage === stage);
    return {
      stage,
      total: relevant.length,
      completed: relevant.filter((p) => p.status === "completed").length,
      stuck: relevant.filter((p) => p.status === "failed").length,
      notStarted: relevant.filter((p) => p.status === "locked" || p.status === "available").length,
    };
  });
}

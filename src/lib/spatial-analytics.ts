// Spatial analytics and learning dashboard metrics.
export interface FeatureQuery {
  type: string;
  count: number;
  totalLengthFt?: number;
}

export interface InstructorAnalytics {
  stageTime: Record<string, number>;
  attempts: number;
  gateFailures: Record<string, number>;
  hintUsage: number;
  reviewTurnaroundHrs: number;
  overdueWork: number;
}

export interface SavedQuery {
  id: string;
  name: string;
  projectId: string;
  filter: Record<string, unknown>;
  createdAt: string;
}

export function calculateRouteMetrics(features: { type: string; length?: number }[]): FeatureQuery[] {
  const groups: Record<string, { count: number; totalLength: number }> = {};
  for (const f of features) {
    if (!groups[f.type]) groups[f.type] = { count: 0, totalLength: 0 };
    groups[f.type].count++;
    if (f.length) groups[f.type].totalLength += f.length;
  }
  return Object.entries(groups).map(([type, data]) => ({
    type,
    count: data.count,
    totalLengthFt: data.totalLength > 0 ? data.totalLength : undefined,
  }));
}

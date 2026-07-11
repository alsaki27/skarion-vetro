// Versioned curriculum projects, cohorts, and assignments model.
export interface CurriculumProject {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface CurriculumProjectVersion {
  id: string;
  projectId: string;
  version: number;
  status: "draft" | "review" | "published" | "archived";
  stageConfig: Record<string, unknown>;
  rulePackVersion: string;
  catalogVersion: string;
  isPublished: boolean;
}

export interface Cohort {
  id: string;
  orgId: string;
  name: string;
  status: "active" | "archived";
  startDate: string;
  endDate?: string;
}

export interface Assignment {
  id: string;
  cohortId: string;
  projectVersionId: string;
  openAt: string;
  dueAt: string;
  closeAt: string;
  attemptPolicy: "unlimited" | "limited" | "single";
  hintPolicy: "unlimited" | "tiered" | "none";
}

const SEED_VERSIONS: CurriculumProjectVersion[] = [
  { id: "v-hld02", projectId: "p2-oakwood", version: 1, status: "draft", stageConfig: {}, rulePackVersion: "1.0", catalogVersion: "1.0", isPublished: false },
  { id: "v-hld03", projectId: "p3-sunset-ridge", version: 1, status: "draft", stageConfig: {}, rulePackVersion: "1.0", catalogVersion: "1.0", isPublished: false },
  { id: "v-hld04", projectId: "p4-split-lab", version: 1, status: "draft", stageConfig: {}, rulePackVersion: "1.0", catalogVersion: "1.0", isPublished: false },
];

export function getSeedVersions(): CurriculumProjectVersion[] {
  return SEED_VERSIONS;
}

export function publishVersion(version: CurriculumProjectVersion): CurriculumProjectVersion {
  return { ...version, status: "published", isPublished: true };
}

// Revisioned design autosave, checkpoints, and grading.
export interface DesignRevision {
  id: string;
  projectId: string;
  userId: string;
  orgId: string;
  revisionNumber: number;
  snapshot: Record<string, unknown>;
  etag: string;
  createdAt: string;
}

export interface Checkpoint {
  id: string;
  revisionId: string;
  stage: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  revisionId: string;
  projectVersionId: string;
  ruleVersion: string;
  score: number;
  isPassing: boolean;
  createdAt: string;
}

let revisionCounter = 0;

export function createRevision(projectId: string, userId: string, orgId: string, snapshot: Record<string, unknown>): DesignRevision {
  revisionCounter++;
  return {
    id: crypto.randomUUID(),
    projectId,
    userId,
    orgId,
    revisionNumber: revisionCounter,
    snapshot,
    etag: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}

export function createCheckpoint(revisionId: string, stage: string): Checkpoint {
  return { id: crypto.randomUUID(), revisionId, stage, createdAt: new Date().toISOString() };
}

export function createSubmission(revisionId: string, projectVersionId: string, score: number, isPassing: boolean): Submission {
  return {
    id: crypto.randomUUID(), revisionId, projectVersionId,
    ruleVersion: "1.0", score, isPassing, createdAt: new Date().toISOString(),
  };
}

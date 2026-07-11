// Authoritative design persistence with autosave and recovery.
export interface Design {
  id: string;
  userId: string;
  assignmentId: string;
  projectVersionId: string;
  revisionNumber: number;
  snapshot: Record<string, unknown>;
  etag: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignCheckpoint {
  id: string;
  designId: string;
  revisionNumber: number;
  stage: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface AutosaveState {
  revisionNumber: number;
  etag: string;
  lastSavedAt: string;
  pending: boolean;
}

let designCounter = 0;

export function createDesign(userId: string, assignmentId: string, projectVersionId: string): Design {
  designCounter++;
  return {
    id: crypto.randomUUID(), userId, assignmentId, projectVersionId,
    revisionNumber: designCounter, snapshot: {}, etag: crypto.randomUUID(),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export function createCheckpoint(designId: string, stage: string, snapshot: Record<string, unknown>): DesignCheckpoint {
  return {
    id: crypto.randomUUID(), designId, revisionNumber: designCounter,
    stage, snapshot, createdAt: new Date().toISOString(),
  };
}

export function validateAutosave(design: Design, clientEtag: string, clientRevision: number): { valid: boolean; error?: string } {
  if (clientRevision !== design.revisionNumber) {
    return { valid: false, error: "Revision conflict — design has been updated. Please refresh." };
  }
  if (clientEtag !== design.etag) {
    return { valid: false, error: "ETag mismatch — concurrent modification detected." };
  }
  return { valid: true };
}

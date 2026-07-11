// Instructor review, comments, and change management.
export type CommentState = "open" | "student_resolved" | "instructor_resolved" | "reopened";
export type ReviewAction = "approve" | "request_revision" | "approve_exception" | "score_override";

export interface ReviewComment {
  id: string;
  elementId: string;
  authorId: string;
  authorRole: "student" | "instructor" | "admin";
  body: string;
  state: CommentState;
  revisionId: string;
  stage: string;
  createdAt: string;
}

export interface ReviewActionEntry {
  id: string;
  submissionId: string;
  action: ReviewAction;
  authorId: string;
  reason?: string;
  scoreOverride?: number;
  createdAt: string;
}

export function createComment(elementId: string, authorId: string, authorRole: "student" | "instructor" | "admin", body: string, revisionId: string, stage: string): ReviewComment {
  return { id: crypto.randomUUID(), elementId, authorId, authorRole, body, state: "open", revisionId, stage, createdAt: new Date().toISOString() };
}

export function resolveComment(comment: ReviewComment, byRole: "student" | "instructor"): ReviewComment {
  return { ...comment, state: byRole === "instructor" ? "instructor_resolved" : "student_resolved" };
}

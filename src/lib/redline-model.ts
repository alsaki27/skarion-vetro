export interface Redline {
  id: string;
  revisionId: string;
  authorId: string;
  category: "geometry" | "topology" | "capacity" | "constructability" | "documentation" | "standard";
  severity: "critical" | "major" | "minor" | "advisory";
  elementIds: string[];
  geometry?: { type: "point" | "line" | "polygon"; coordinates: unknown };
  callout: string;
  description: string;
  status: "open" | "accepted" | "revised" | "rejected" | "clarified" | "escalated";
  disposition?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface FieldObservation {
  id: string;
  projectId: string;
  authorId: string;
  featureId?: string;
  conditionType: "blocked_conduit" | "missing_pole" | "changed_parcel" | "unsuitable_site" | "new_crossing" | "unavailable_material" | "other";
  confidence: "confirmed" | "reported" | "estimated";
  description: string;
  photos?: string[];
  coordinates?: [number, number];
  createdAt: string;
}

export interface DesignChange {
  id: string;
  projectId: string;
  revisionBefore: string;
  initiatorId: string;
  reason: string;
  urgency: "routine" | "expedited" | "emergency";
  affectedScope: string[];
  status: "draft" | "submitted" | "approved" | "rejected" | "implemented";
  decision?: string;
  approverId?: string;
  implementationRevisionId?: string;
  createdAt: string;
  resolvedAt?: string;
}

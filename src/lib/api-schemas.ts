import { z } from "zod";

export const AutosaveSchema = z.object({
  projectId: z.string().min(1).max(64),
  elements: z.record(z.string(), z.unknown()),
  note: z.string().max(500).optional(),
  baseRevision: z.string().uuid().optional(),
});

export const SubmissionSchema = z.object({
  projectId: z.string().min(1).max(64),
  designId: z.string().uuid().optional(),
  elements: z.record(z.string(), z.unknown()),
});

export const RestoreSchema = z.object({
  snapshotId: z.string().uuid(),
  projectId: z.string().min(1).max(64),
});

export const ReviewSchema = z.object({
  designId: z.string().min(1),
  comment: z.string().min(1).max(5000),
  elementId: z.string().optional(),
  anchor: z.record(z.string(), z.unknown()).optional(),
});

export const ReviewPatchSchema = z.object({
  commentId: z.string().uuid(),
  status: z.enum(["resolved_by_student", "resolved_by_instructor"]),
});

export const ConflictSchema = z.object({
  projectId: z.string().min(1).max(64),
  clientEtag: z.string().optional(),
});

export const ExportSchema = z.object({
  projectId: z.string().min(1).max(64),
  elements: z.array(z.unknown()).max(10000),
  format: z.enum(["geojson+csv", "geojson", "csv"]).optional(),
});

export const OpticalSchema = z.object({
  paths: z.array(z.object({
    id: z.string(),
    label: z.string().optional(),
    segments: z.array(z.object({
      type: z.enum(["fiber", "connector", "splice", "splitter"]),
      label: z.string().optional(),
      lengthFt: z.number().positive().optional(),
      count: z.number().int().positive().optional(),
      splitterRatio: z.number().int().min(2).optional(),
    })).max(100),
  })).max(50),
  wavelength: z.number().int().refine((v) => [1310, 1490, 1550].includes(v)).optional(),
});

export const CompetencySubmitSchema = z.object({
  studentId: z.string().min(1),
  records: z.array(z.object({
    studentId: z.string(),
    competencyId: z.string(),
    level: z.enum(["developing", "demonstrated", "proficient"]),
    evidence: z.array(z.object({
      type: z.enum(["check", "submission", "rationale", "review", "capstone", "defense"]),
      sourceId: z.string(),
      score: z.number().min(0).max(100),
      assessedBy: z.string(),
      assessedAt: z.string(),
    })),
    lastUpdated: z.string(),
    version: z.number(),
  })).max(100),
});

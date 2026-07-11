// Skarion-VETRO Rev 3 Drizzle schema — multi-tenant, organizations-scoped
// Matches migrations/0004_rev3_multitenant.sql

import {
  pgTable, uuid, text, integer, boolean, jsonb, timestamp,
  primaryKey, uniqueIndex, index,
} from "drizzle-orm/pg-core";

// ===========================================================================
// Organizations — tenant boundary
// ===========================================================================

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan", { enum: ["trial", "starter", "pro", "enterprise"] }).notNull().default("trial"),
  status: text("status", { enum: ["trial", "active", "suspended", "cancelled"] }).notNull().default("trial"),
  seatLimit: integer("seat_limit"),
  aiBudgetCentsMonthly: integer("ai_budget_cents_monthly"),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ===========================================================================
// Users
// ===========================================================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  isPlatformStaff: boolean("is_platform_staff").notNull().default(false),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

// ===========================================================================
// Org Members (many-to-many user↔org with scoped role)
// ===========================================================================

export const orgMembers = pgTable("org_members", {
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["student", "instructor", "admin"] }).notNull(),
  status: text("status", { enum: ["invited", "active", "deactivated"] }).notNull().default("active"),
  invitedBy: uuid("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.orgId, table.userId] }),
]);

// ===========================================================================
// Organization Invitations — persistent, single-use, expiring
// ===========================================================================

export const organizationInvitations = pgTable("organization_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role", { enum: ["student", "instructor", "admin"] }).notNull(),
  tokenHash: text("token_hash").notNull(),
  inviterId: uuid("inviter_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_org_invitations_email_org").on(table.orgId, table.email),
]);

// ===========================================================================
// Audit Log
// ===========================================================================

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_audit_log_org").on(table.orgId, table.createdAt),
]);

// ===========================================================================
// Cohorts
// ===========================================================================

export const cohorts = pgTable("cohorts", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  instructorId: uuid("instructor_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("cohorts_org_slug_idx").on(table.orgId, table.slug),
]);

export const cohortMembers = pgTable("cohort_members", {
  cohortId: uuid("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.cohortId, table.userId] }),
]);

// ===========================================================================
// Curriculum Projects — versioned content model
// ===========================================================================

export const curriculumProjects = pgTable("curriculum_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
  environment: text("environment", { enum: ["aerial", "underground", "mixed"] }).notNull(),
  splitArchitecture: text("split_architecture", { enum: ["centralized", "distributed", "student_choice", "n/a"] }).notNull().default("n/a"),
  state: text("state", { enum: ["draft", "review", "published", "archived"] }).notNull().default("draft"),
  currentVersionId: uuid("current_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("curriculum_projects_org_slug").on(table.orgId, table.slug),
]);

export const curriculumProjectVersions = pgTable("curriculum_project_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => curriculumProjects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  scenario: jsonb("scenario").notNull(),
  constraints: jsonb("constraints").notNull().default({}),
  gradingWeights: jsonb("grading_weights").notNull().default({}),
  preloadedElements: jsonb("preloaded_elements").notNull().default([]),
  optimalStats: jsonb("optimal_stats"),
  requirements: jsonb("requirements").notNull().default([]),
  mapCenter: text("map_center").notNull(),
  mapZoom: integer("map_zoom").notNull().default(15),
  passThreshold: integer("pass_threshold").notNull().default(80),
  changelog: text("changelog"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("curriculum_versions_project_number").on(table.projectId, table.versionNumber),
]);

// ===========================================================================
// Projects (legacy table — will be deprecated by curriculum_projects)
// ===========================================================================

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  projectType: text("project_type", { enum: ["hld", "lld", "mixed"] }).notNull(),
  difficulty: text("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
  environment: text("environment", { enum: ["aerial", "underground", "mixed"] }).notNull(),
  splitArchitecture: text("split_architecture", { enum: ["centralized", "distributed", "student_choice", "n/a"] }).notNull().default("n/a"),
  locationName: text("location_name").notNull(),
  mapCenter: text("map_center").notNull(),
  mapZoom: integer("map_zoom").default(16),
  constraints: jsonb("constraints").notNull().default({}),
  gradingRules: jsonb("grading_rules").notNull().default([]),
  existingInfrastructure: jsonb("existing_infrastructure").default([]),
  optimalStats: jsonb("optimal_stats").default(null),
  optimalDesign: jsonb("optimal_design").default(null),
  passThreshold: integer("pass_threshold").notNull().default(80),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ===========================================================================
// Network Elements
// ===========================================================================

export const networkElements = pgTable("network_elements", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  elementType: text("element_type", {
    enum: [
      "pole", "handhole", "flowerpot", "vault",
      "splice_closure", "splitter", "mst", "fdh_cabinet",
      "terminal", "cabinet", "co", "premise", "riser", "slack_loop",
      "cable", "conduit", "drop_cable", "coverage_area",
    ],
  }).notNull(),
  geometry: text("geometry").notNull(),
  attributes: jsonb("attributes").notNull().default({}),
  isPreloaded: boolean("is_preloaded").notNull().default(false),
  label: text("label"),
  parentContainerId: uuid("parent_container_id"),
  startElementId: uuid("start_element_id"),
  endElementId: uuid("end_element_id"),
  fiberAssignments: jsonb("fiber_assignments").default(null),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_network_elements_geometry").using("gist", table.geometry),
  index("idx_network_elements_project_user").on(table.projectId, table.userId),
  index("idx_network_elements_type").on(table.elementType),
]);

export const designSnapshots = pgTable("design_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  snapshotData: jsonb("snapshot_data").notNull(),
  snapshotNote: text("snapshot_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_design_snapshots_project_user").on(table.projectId, table.userId, table.createdAt),
  index("idx_design_snapshots_org_created").on(table.orgId, table.createdAt),
]);

export const gradingResults = pgTable("grading_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  totalScore: integer("total_score").notNull(),
  isPassing: boolean("is_passing").notNull(),
  phase: text("phase", { enum: ["hld", "lld"] }).notNull().default("hld"),
  categoryScores: jsonb("category_scores").notNull(),
  feedback: jsonb("feedback").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_grading_results_project_user").on(table.projectId, table.userId, table.createdAt),
  index("idx_grading_results_org_created").on(table.orgId, table.createdAt),
]);

export const candidateProgress = pgTable("candidate_progress", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => organizations.id),
  status: text("status", { enum: ["not_started", "in_progress", "submitted", "passed", "failed"] }).notNull(),
  timeSpentMinutes: integer("time_spent_minutes").default(0),
  attempts: integer("attempts").default(0),
  bestScore: integer("best_score"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.projectId] }),
  index("idx_candidate_progress_org").on(table.orgId),
]);

export const designAttempts = pgTable("design_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  snapshotId: uuid("snapshot_id").references(() => designSnapshots.id),
  gradingResultId: uuid("grading_result_id").references(() => gradingResults.id),
  attemptNumber: integer("attempt_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_design_attempts_user_project").on(table.userId, table.projectId, table.createdAt),
  index("idx_design_attempts_org_created").on(table.orgId, table.createdAt),
]);

// ===========================================================================
// Basemap pipeline tables
// ===========================================================================

export const basemapTemplates = pgTable("basemap_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  version: integer("version").notNull().default(1),
  layerConfig: jsonb("layer_config").notNull().default({}),
  rwOffsetTable: jsonb("rw_offset_table").default([]),
  seedDwgKey: text("seed_dwg_key"),
  seedDwgFilename: text("seed_dwg_filename"),
  answerKeyKey: text("answer_key_key"),
  answerKeyFilename: text("answer_key_filename"),
  affineTransform: jsonb("affine_transform"),
  isSharedToPlatform: boolean("is_shared_to_platform").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
}, (table) => [
  uniqueIndex("basemap_templates_org_slug_version_idx").on(table.orgId, table.slug, table.version),
]);

export const basemapSubmissions = pgTable("basemap_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  templateId: uuid("template_id").notNull().references(() => basemapTemplates.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["uploaded", "converting", "extracting", "grading", "ready", "failed"] }).notNull().default("uploaded"),
  failureReason: text("failure_reason"),
  dwgKey: text("dwg_key"),
  dwgFilename: text("dwg_filename"),
  dwgSizeBytes: integer("dwg_size_bytes"),
  dwgJobId: text("dwg_job_id"),
  geojsonLayers: jsonb("geojson_layers"),
  verificationResults: jsonb("verification_results"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_basemap_submissions_template_user").on(table.templateId, table.userId),
  index("idx_basemap_submissions_dwg_job").on(table.dwgJobId),
]);

export const basemapGrades = pgTable("basemap_grades", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id").notNull().references(() => basemapSubmissions.id, { onDelete: "cascade" }),
  totalScore: integer("total_score").notNull(),
  isPassing: boolean("is_passing").notNull(),
  layerScores: jsonb("layer_scores").notNull(),
  deviationStats: jsonb("deviation_stats").notNull().default({}),
  diffReportKey: text("diff_report_key"),
  attemptNumber: integer("attempt_number").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const basemapCanvasAssets = pgTable("basemap_canvas_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  gradeId: uuid("grade_id").notNull().references(() => basemapGrades.id, { onDelete: "cascade" }),
  submissionId: uuid("submission_id").notNull().references(() => basemapSubmissions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").notNull().references(() => basemapTemplates.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ===========================================================================
// Auth Sessions — refresh token rotation, revocation, family tracking
// ===========================================================================

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  tokenFamily: text("token_family").notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  rotationCounter: integer("rotation_counter").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  lastIp: text("last_ip"),
  lastUserAgent: text("last_user_agent"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_auth_sessions_user").on(table.userId),
  index("idx_auth_sessions_family").on(table.tokenFamily),
]);

// ===========================================================================
// Learning objectives — knowledge content and mastery model
// ===========================================================================

export const learningConcepts = pgTable("learning_concepts", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  prerequisiteIds: text("prerequisite_ids").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const learningObjectives = pgTable("learning_objectives", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  conceptId: uuid("concept_id").references(() => learningConcepts.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => curriculumProjects.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  masteryEvidence: text("mastery_evidence").notNull(),
  assessmentMethod: text("assessment_method").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const masteryEvidence = pgTable("mastery_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => organizations.id),
  objectiveId: uuid("objective_id").notNull().references(() => learningObjectives.id, { onDelete: "cascade" }),
  state: text("state", {
    enum: ["not_started", "introduced", "practicing", "demonstrated", "mastered", "needs_review"],
  }).notNull().default("not_started"),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("mastery_evidence_user_objective").on(table.userId, table.objectiveId),
  index("idx_mastery_evidence_user").on(table.userId),
]);

export const lessonContent = pgTable("lesson_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  conceptId: uuid("concept_id").references(() => learningConcepts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  bodyMd: text("body_md").notNull(),
  version: integer("version").notNull().default(1),
  sourceDoc: text("source_doc"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ===========================================================================
// AI layer
// ===========================================================================

export const aiSessions = pgTable("ai_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  mode: text("mode", { enum: ["walkthrough", "hint", "review"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_ai_sessions_org_created").on(table.orgId, table.createdAt),
]);

export const aiMessages = pgTable("ai_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => aiSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "tool"] }).notNull(),
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls").default(null),
  hintTier: integer("hint_tier"),
  provider: text("provider"),
  tokensIn: integer("tokens_in").default(0),
  tokensOut: integer("tokens_out").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_ai_messages_session").on(table.sessionId, table.createdAt),
]);

export const lessonChunks = pgTable("lesson_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id),
  topic: text("topic").notNull(),
  environment: text("environment", { enum: ["aerial", "underground", "both"] }).notNull().default("both"),
  splitArchitecture: text("split_architecture", { enum: ["centralized", "distributed", "both", "n/a"] }).notNull().default("n/a"),
  projectSlugs: text("project_slugs").array().notNull().default([]),
  title: text("title").notNull(),
  bodyMd: text("body_md").notNull(),
  sourceDoc: text("source_doc"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_lesson_chunks_topic").on(table.topic),
  index("idx_lesson_chunks_projects").using("gin", table.projectSlugs),
]);

export const aiUsageDaily = pgTable("ai_usage_daily", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => organizations.id),
  date: text("date").notNull(),
  messages: integer("messages").notNull().default(0),
  tokens: integer("tokens").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.userId, table.date] }),
]);

export const rubricScores = pgTable("rubric_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  gradingResultId: uuid("grading_result_id").references(() => gradingResults.id, { onDelete: "cascade" }),
  item: text("item").notNull(),
  aiScore: integer("ai_score"),
  aiRationale: text("ai_rationale"),
  instructorScore: integer("instructor_score"),
  instructorNote: text("instructor_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

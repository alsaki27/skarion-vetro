-- Skarion-VETRO — Curriculum versions, review comments, notifications,
-- and data quality metrics tables.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0008_curriculum_review.sql

-- ===========================================================================
-- 1. CURRICULUM VERSIONS — Versioned curriculum/stage configurations per project
-- ===========================================================================

CREATE TABLE IF NOT EXISTS curriculum_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    stages JSONB NOT NULL DEFAULT '[]',
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_curriculum_versions_org ON curriculum_versions(org_id, version_number);
CREATE INDEX IF NOT EXISTS idx_curriculum_versions_project ON curriculum_versions(project_id);

-- ===========================================================================
-- 2. REVIEW COMMENTS — Threaded review annotations on design revisions/elements
-- ===========================================================================

CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL,     -- design_attempts.id or design_snapshots.id
    element_id UUID,               -- network_elements.id (nullable for project-level comments)
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    anchor JSONB,                  -- e.g. {"lat":..., "lng":..., "zoom":...}
    thread_parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'wont_fix')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_review_comments_revision
    ON review_comments(revision_id, created_at);
CREATE INDEX IF NOT EXISTS idx_review_comments_org ON review_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_author ON review_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_thread ON review_comments(thread_parent_id);

-- ===========================================================================
-- 3. NOTIFICATIONS — User-targeted notification inbox
-- ===========================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL
        CHECK (type IN (
            'review_comment', 'review_resolved', 'submission_graded',
            'invitation', 'cohort_assigned', 'basemap_ready',
            'basemap_failed', 'project_assigned', 'system'
        )),
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(org_id);

-- ===========================================================================
-- 4. DATA QUALITY METRICS — Per-source data freshness and quality tracking
-- ===========================================================================

CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    completeness_pct NUMERIC(5, 2),
    duplicate_count INTEGER DEFAULT 0,
    invalid_geometry_count INTEGER DEFAULT 0,
    freshness_days NUMERIC(8, 2),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_source
    ON data_quality_metrics(source_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_org ON data_quality_metrics(org_id);

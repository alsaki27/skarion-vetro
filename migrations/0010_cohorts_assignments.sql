-- Skarion-VETRO Chunks 13-15 — Cohort enhancements, assignments, curriculum authoring
-- Forward-only migration.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0010_cohorts_assignments.sql

-- Enhanced cohorts with description, timezone, status, archive
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived'));
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Multiple instructors per cohort
CREATE TABLE IF NOT EXISTS cohort_instructors (
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (cohort_id, user_id)
);

-- Assignments: connect curriculum versions to cohorts
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    project_version_id UUID NOT NULL REFERENCES curriculum_project_versions(id),
    title TEXT NOT NULL,
    open_at TIMESTAMPTZ NOT NULL,
    due_at TIMESTAMPTZ,
    close_at TIMESTAMPTZ,
    state TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (state IN ('scheduled', 'open', 'closed', 'archived')),
    attempt_limit INTEGER,
    hint_policy TEXT NOT NULL DEFAULT 'unlimited'
        CHECK (hint_policy IN ('unlimited', 'limited', 'none')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_cohort ON assignments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_assignments_state ON assignments(state);

-- Skarion-VETRO Rev 3 — Multi-Tenant Schema (Chunks 4-5)
-- Supersedes the old single-tenant 'orgs' design. Adds organizations, org_members,
-- audit_log, and scopes all existing tables by org_id.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0004_rev3_multitenant.sql

-- ===========================================================================
-- 1. ORGANIZATIONS — the tenant boundary
-- ===========================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'trial'
        CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'trial'
        CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
    seat_limit INTEGER,
    ai_budget_cents_monthly INTEGER,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- 2. USERS — role removed (moved to org_members), add password_hash + platform-staff flag
-- ===========================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_staff BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- Drop the old role column if it exists (role is now in org_members)
DO $$ BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
-- Note: the role column itself is preserved for backward compat but unused;
-- org_members.role is now the authoritative role.

-- ===========================================================================
-- 3. ORG_MEMBERS — many-to-many user↔org with scoped role
-- ===========================================================================

CREATE TABLE IF NOT EXISTS org_members (
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('invited', 'active', 'deactivated')),
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);

-- ===========================================================================
-- 4. AUDIT LOG — immutable event log
-- ===========================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    actor_user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(org_id, created_at DESC);

-- ===========================================================================
-- 5. COHORTS — pinned to org now
-- ===========================================================================

-- Drop the old cohorts table if it exists, recreate with org_id
DROP TABLE IF EXISTS cohort_members CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;

CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    instructor_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

CREATE TABLE cohort_members (
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (cohort_id, user_id)
);

-- ===========================================================================
-- 6. CORE TABLES — add org_id
-- ===========================================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE network_elements ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE design_snapshots ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE grading_results ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE candidate_progress ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- ===========================================================================
-- 7. AI TABLES — add org_id
-- ===========================================================================

ALTER TABLE ai_sessions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE lesson_chunks ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE ai_usage_daily ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- ===========================================================================
-- 8. BASEMAP TABLES — add org_id (if they exist from the old migration 0003)
-- ===========================================================================

DO $$ BEGIN
    ALTER TABLE basemap_templates ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
    ALTER TABLE basemap_submissions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ===========================================================================
-- 9. BASEMAP TEMPLATE — add shared-to-platform flag (Chunk 7 Rev 3)
-- ===========================================================================

DO $$ BEGIN
    ALTER TABLE basemap_templates ADD COLUMN IF NOT EXISTS is_shared_to_platform BOOLEAN DEFAULT false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ===========================================================================
-- 10. NETWORK ELEMENTS — update element_type check for Rev 2 new types
-- ===========================================================================

DO $$ BEGIN
    ALTER TABLE network_elements DROP CONSTRAINT IF EXISTS network_elements_element_type_check;
    ALTER TABLE network_elements ADD CONSTRAINT network_elements_element_type_check
        CHECK (element_type IN (
            'pole', 'handhole', 'flowerpot', 'vault',
            'splice_closure', 'splitter', 'mst', 'fdh_cabinet',
            'terminal', 'cabinet', 'co', 'premise', 'riser', 'slack_loop',
            'cable', 'conduit', 'drop_cable', 'coverage_area'
        ));
    ALTER TABLE network_elements ADD COLUMN IF NOT EXISTS parent_container_id UUID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 11. DESIGN ATTEMPTS — immutable attempt history (if not already created)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS design_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id),
    snapshot_id UUID REFERENCES design_snapshots(id),
    grading_result_id UUID REFERENCES grading_results(id),
    attempt_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_design_attempts_user_project
    ON design_attempts(user_id, project_id, created_at DESC);

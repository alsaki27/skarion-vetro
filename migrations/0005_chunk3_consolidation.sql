-- Skarion-VETRO Chunk 3 — Database consolidation
-- Forward-only migration resolving drift between Drizzle schema and SQL migrations.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0005_chunk3_consolidation.sql

-- ===========================================================================
-- 1. Missing foreign keys on network_elements
-- ===========================================================================

-- parent_container_id should reference the container element
-- ON DELETE SET NULL: deleting a container un-hosts its contents rather than
-- cascade-deleting them (the student may want to re-host elsewhere).
DO $$ BEGIN
    ALTER TABLE network_elements
        ADD CONSTRAINT fk_network_elements_parent_container
        FOREIGN KEY (parent_container_id) REFERENCES network_elements(id)
        ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- start_element_id / end_element_id should reference the snapped point element
DO $$ BEGIN
    ALTER TABLE network_elements
        ADD CONSTRAINT fk_network_elements_start_element
        FOREIGN KEY (start_element_id) REFERENCES network_elements(id)
        ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE network_elements
        ADD CONSTRAINT fk_network_elements_end_element
        FOREIGN KEY (end_element_id) REFERENCES network_elements(id)
        ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 2. Missing composite tenant indexes
-- ===========================================================================

-- Add (org_id, created_at DESC) indexes for every tenant-scoped table that
-- lacks one. These optimize the most common query pattern: list records
-- within an organization, newest first.

CREATE INDEX IF NOT EXISTS idx_design_snapshots_org_created
    ON design_snapshots(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_grading_results_org_created
    ON grading_results(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_design_attempts_org_created
    ON design_attempts(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_progress_org
    ON candidate_progress(org_id);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_org_created
    ON ai_sessions(org_id, created_at DESC);

-- ===========================================================================
-- 3. Add updated_at to tables that are mutable
-- ===========================================================================

DO $$ BEGIN
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE grading_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Skarion-VETRO core schema (Neon Postgres + PostGIS)
-- Source: VETRO MVP Plan §4 + Student Edition plan additions (split architecture)
-- Apply: psql $NEON_DATABASE_URL -f migrations/0001_core.sql

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'instructor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,             -- e.g. 'p1-greenfield'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    project_type TEXT NOT NULL CHECK (project_type IN ('hld', 'lld', 'mixed')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    environment TEXT NOT NULL CHECK (environment IN ('aerial', 'underground', 'mixed')),
    -- Student Edition plan §2: split architecture is a first-class curriculum dimension
    split_architecture TEXT NOT NULL DEFAULT 'n/a'
        CHECK (split_architecture IN ('centralized', 'distributed', 'student_choice', 'n/a')),
    location_name TEXT NOT NULL,
    map_center GEOGRAPHY(POINT, 4326) NOT NULL,
    map_zoom INTEGER DEFAULT 16,
    constraints JSONB NOT NULL DEFAULT '{}',
    grading_rules JSONB NOT NULL DEFAULT '[]',
    existing_infrastructure JSONB DEFAULT '[]',
    -- numbers only (total lengths, counts) — optimal GEOMETRY never ships to clients
    optimal_stats JSONB DEFAULT NULL,
    optimal_design JSONB DEFAULT NULL,     -- instructor-only
    pass_threshold INTEGER NOT NULL DEFAULT 80,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL CHECK (
        element_type IN (
            'pole', 'handhole', 'splice_closure', 'splitter', 'fdh_cabinet',
            'terminal', 'cabinet', 'co', 'premise', 'riser', 'slack_loop',
            'cable', 'conduit', 'drop_cable', 'coverage_area'
        )
    ),
    geometry GEOGRAPHY(GEOMETRY, 4326) NOT NULL,
    -- splitter attributes include {stage: 1|2, ratio: '1:8', parent_splitter_id}
    -- for distributed (cascaded) split designs
    attributes JSONB NOT NULL DEFAULT '{}',
    is_preloaded BOOLEAN NOT NULL DEFAULT false,  -- scenario data, read-only for students
    label TEXT,
    start_element_id UUID REFERENCES network_elements(id),
    end_element_id UUID REFERENCES network_elements(id),
    fiber_assignments JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_elements_geometry ON network_elements USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_network_elements_project_user ON network_elements(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_network_elements_type ON network_elements(element_type);

CREATE TABLE IF NOT EXISTS design_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    snapshot_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_design_snapshots_project_user
    ON design_snapshots(project_id, user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS grading_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    is_passing BOOLEAN NOT NULL,
    phase TEXT NOT NULL DEFAULT 'hld' CHECK (phase IN ('hld', 'lld')),
    category_scores JSONB NOT NULL,
    feedback JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grading_results_project_user
    ON grading_results(project_id, user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS candidate_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'submitted', 'passed', 'failed')),
    time_spent_minutes INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    best_score INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, project_id)
);

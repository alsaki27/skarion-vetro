-- Skarion-VETRO Chunk 11 — Versioned curriculum project model
-- Forward-only migration: adds curriculum_projects and curriculum_project_versions tables.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0008_curriculum_projects.sql

CREATE TABLE IF NOT EXISTS curriculum_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    environment TEXT NOT NULL CHECK (environment IN ('aerial', 'underground', 'mixed')),
    split_architecture TEXT NOT NULL DEFAULT 'n/a'
        CHECK (split_architecture IN ('centralized', 'distributed', 'student_choice', 'n/a')),
    state TEXT NOT NULL DEFAULT 'draft'
        CHECK (state IN ('draft', 'review', 'published', 'archived')),
    current_version_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

CREATE TABLE IF NOT EXISTS curriculum_project_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES curriculum_projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    scenario JSONB NOT NULL,
    constraints JSONB NOT NULL DEFAULT '{}',
    grading_weights JSONB NOT NULL DEFAULT '{}',
    preloaded_elements JSONB NOT NULL DEFAULT '[]',
    optimal_stats JSONB,
    requirements JSONB NOT NULL DEFAULT '[]',
    map_center TEXT NOT NULL,
    map_zoom INTEGER NOT NULL DEFAULT 15,
    pass_threshold INTEGER NOT NULL DEFAULT 80,
    changelog TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, version_number)
);

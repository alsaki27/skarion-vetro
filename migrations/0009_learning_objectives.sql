-- Skarion-VETRO Chunk 12 — Learning objectives and mastery model
-- Forward-only migration.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0009_learning_objectives.sql

CREATE TABLE IF NOT EXISTS learning_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    prerequisite_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    concept_id UUID REFERENCES learning_concepts(id) ON DELETE CASCADE,
    project_id UUID REFERENCES curriculum_projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    mastery_evidence TEXT NOT NULL,
    assessment_method TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mastery_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id),
    objective_id UUID NOT NULL REFERENCES learning_objectives(id) ON DELETE CASCADE,
    state TEXT NOT NULL DEFAULT 'not_started'
        CHECK (state IN ('not_started', 'introduced', 'practicing', 'demonstrated', 'mastered', 'needs_review')),
    source TEXT NOT NULL,
    source_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, objective_id)
);

CREATE INDEX IF NOT EXISTS idx_mastery_evidence_user ON mastery_evidence(user_id);

CREATE TABLE IF NOT EXISTS lesson_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    concept_id UUID REFERENCES learning_concepts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body_md TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    source_doc TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

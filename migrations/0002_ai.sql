-- Skarion-VETRO AI layer schema (Student Edition plan §3)
-- Tutor sessions, message log with hint tiers + token telemetry, curriculum
-- lesson chunks, per-student daily caps, and free-text rubric scores.

CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('walkthrough', 'hint', 'review')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
    content TEXT NOT NULL,
    tool_calls JSONB DEFAULT NULL,
    -- hint tier delivered in this message (1=concept, 2=direction, 3=specific);
    -- tier-3 usage deducts points on P5+ per the paid-hints decision
    hint_tier INTEGER CHECK (hint_tier BETWEEN 1 AND 3),
    provider TEXT,                        -- which key/provider served this turn
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id, created_at);

-- Curriculum knowledge base: Silma's aerial modules + V2 underground content,
-- converted to tagged markdown chunks. Tag-match retrieval first (plan §3);
-- add an embedding column later only if tag matching proves insufficient.
CREATE TABLE IF NOT EXISTS lesson_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,                   -- e.g. 'make_ready', 'strand_mapping', 'split_ratio'
    environment TEXT NOT NULL DEFAULT 'both'
        CHECK (environment IN ('aerial', 'underground', 'both')),
    split_architecture TEXT NOT NULL DEFAULT 'n/a'
        CHECK (split_architecture IN ('centralized', 'distributed', 'both', 'n/a')),
    project_slugs TEXT[] NOT NULL DEFAULT '{}',
    title TEXT NOT NULL,
    body_md TEXT NOT NULL,
    source_doc TEXT,                       -- provenance, e.g. 'Aerial Module_Revised-7.8.26.docx §M5'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lesson_chunks_topic ON lesson_chunks(topic);
CREATE INDEX IF NOT EXISTS idx_lesson_chunks_projects ON lesson_chunks USING GIN(project_slugs);

-- Per-student daily usage cap (TalentOS 200-messages/day pattern)
CREATE TABLE IF NOT EXISTS ai_usage_daily (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    messages INTEGER NOT NULL DEFAULT 0,
    tokens INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

-- AI rubric scores for free-text deliverables (make-ready notes, design
-- justifications). AI proposes, instructor can override — instructor_score
-- wins when present. ≤15% of any project's total score.
CREATE TABLE IF NOT EXISTS rubric_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grading_result_id UUID REFERENCES grading_results(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    ai_score INTEGER CHECK (ai_score BETWEEN 0 AND 100),
    ai_rationale TEXT,
    instructor_score INTEGER CHECK (instructor_score BETWEEN 0 AND 100),
    instructor_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

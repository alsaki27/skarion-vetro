-- Skarion-VETRO Chunk 7 — Auth session management
-- Forward-only migration: refresh token rotation, revocation, family tracking.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0007_auth_sessions.sql

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id),
    token_family TEXT NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    rotation_counter INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    last_ip TEXT,
    last_user_agent TEXT,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_family ON auth_sessions(token_family);

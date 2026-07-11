-- Skarion-VETRO Chunk 6 — Persistent organization invitations
-- Forward-only migration: replaces in-memory INVITE_TOKENS with DB-backed records.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0006_organization_invitations.sql

CREATE TABLE IF NOT EXISTS organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    token_hash TEXT NOT NULL,
    inviter_id UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_email_org
    ON organization_invitations(org_id, email);

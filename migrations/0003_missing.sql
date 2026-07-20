-- Skarion-VETRO — Fill gap between 0002 and 0004
-- Creates tables referenced in the Drizzle schema that have no migration yet.
-- organizations and org_members are included IF NOT EXISTS (matching 0004 defs)
-- so that foreign keys resolve. audit_log, cohorts, cohort_members are handled
-- entirely by 0004 (0004 drops and recreates cohorts).
-- Apply: psql $NEON_DATABASE_URL -f migrations/0003_missing.sql

-- ===========================================================================
-- 0. ORGANIZATIONS + ORG_MEMBERS (IF NOT EXISTS) — needed for FK references
--    Matching 0004 definitions exactly; 0004's IF NOT EXISTS makes these no-ops.
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

CREATE TABLE IF NOT EXISTS org_members (
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('invited', 'active', 'deactivated')),
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);

-- ===========================================================================
-- 1. BASEMAP PIPELINE TABLES (old Chunk 3 — referenced by 0004 DO blocks)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS basemap_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    layer_config JSONB NOT NULL DEFAULT '{}',
    rw_offset_table JSONB DEFAULT '[]',
    seed_dwg_key TEXT,
    seed_dwg_filename TEXT,
    answer_key_key TEXT,
    answer_key_filename TEXT,
    affine_transform JSONB,
    is_shared_to_platform BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(org_id, slug, version)
);

CREATE TABLE IF NOT EXISTS basemap_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    template_id UUID NOT NULL REFERENCES basemap_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'uploaded'
        CHECK (status IN ('uploaded', 'converting', 'extracting', 'grading', 'ready', 'failed')),
    failure_reason TEXT,
    dwg_key TEXT,
    dwg_filename TEXT,
    dwg_size_bytes INTEGER,
    dwg_job_id TEXT,
    geojson_layers JSONB,
    verification_results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_basemap_submissions_template_user
    ON basemap_submissions(template_id, user_id);
CREATE INDEX IF NOT EXISTS idx_basemap_submissions_dwg_job
    ON basemap_submissions(dwg_job_id);

CREATE TABLE IF NOT EXISTS basemap_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES basemap_submissions(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    is_passing BOOLEAN NOT NULL,
    layer_scores JSONB NOT NULL,
    deviation_stats JSONB NOT NULL DEFAULT '{}',
    diff_report_key TEXT,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS basemap_canvas_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id UUID NOT NULL REFERENCES basemap_grades(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES basemap_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES basemap_templates(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- 2. GIS WORKSPACE — DATA SOURCE REGISTRY (Chunk 6)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL
        CHECK (source_type IN ('arcgis_featureserver', 'shapefile', 'geojson', 'kml', 'census_tiger', 'overture', 'openaddresses')),
    publisher TEXT NOT NULL,
    service_url TEXT,
    description TEXT,
    license TEXT,
    attribution TEXT,
    crs TEXT,
    geometry_type TEXT,
    feature_count INTEGER,
    checksum TEXT,
    retrieval_date TIMESTAMPTZ,
    refresh_policy TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_data_sources_org ON data_sources(org_id);

CREATE TABLE IF NOT EXISTS data_source_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    schema_snapshot JSONB NOT NULL,
    geometry_snapshot JSONB,
    feature_count INTEGER,
    checksum TEXT,
    imported_at TIMESTAMPTZ,
    imported_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_data_source_versions_source
    ON data_source_versions(source_id, version_number);

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID REFERENCES data_sources(id),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    target_layer_id UUID,  -- FK to project_layers added below after project_layers exists
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    field_mapping JSONB,
    deduplication_rule TEXT,
    append_behavior TEXT
        CHECK (append_behavior IN ('append', 'replace', 'update')),
    validation_errors JSONB,
    summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_jobs_org ON import_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_project ON import_jobs(project_id);

-- ===========================================================================
-- 3. GIS WORKSPACE — PROJECT LAYERS (Chunk 2)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS project_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layer_group TEXT NOT NULL DEFAULT 'proposed_network',
    layer_type TEXT NOT NULL
        CHECK (layer_type IN ('basemap', 'reference', 'proposed', 'existing', 'annotation')),
    source_id UUID REFERENCES data_sources(id),
    geometry_type TEXT CHECK (geometry_type IN ('point', 'line', 'polygon')),
    visible BOOLEAN NOT NULL DEFAULT true,
    opacity INTEGER NOT NULL DEFAULT 100,
    z_index INTEGER NOT NULL DEFAULT 0,
    style JSONB NOT NULL DEFAULT '{}',
    label_rules JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_layers_project
    ON project_layers(project_id, z_index);

-- Add FK from import_jobs.target_layer_id → project_layers
ALTER TABLE import_jobs
    ADD CONSTRAINT fk_import_jobs_target_layer
    FOREIGN KEY (target_layer_id) REFERENCES project_layers(id);

-- ===========================================================================
-- 4. GIS WORKSPACE — STUDY AREAS & ADMINISTRATIVE AREAS (Chunk 5)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS study_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    state_fips TEXT NOT NULL,
    county_fips TEXT,
    county_name TEXT,
    state_abbrev TEXT,
    bbox JSONB NOT NULL,
    geometry TEXT NOT NULL,
    crs_preference TEXT NOT NULL DEFAULT 'EPSG:4326',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_study_areas_org ON study_areas(org_id);

CREATE TABLE IF NOT EXISTS administrative_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    study_area_id UUID NOT NULL REFERENCES study_areas(id) ON DELETE CASCADE,
    area_type TEXT NOT NULL
        CHECK (area_type IN ('state', 'county', 'municipality', 'census_tract')),
    name TEXT NOT NULL,
    fips_code TEXT,
    geometry TEXT NOT NULL,
    source TEXT NOT NULL
        CHECK (source IN ('census_tiger', 'user_upload', 'arcgis')),
    source_url TEXT,
    source_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_administrative_areas_study
    ON administrative_areas(study_area_id);

-- ===========================================================================
-- 5. GIS WORKSPACE — FIELD MAPPING TEMPLATES (Chunk 12)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS field_mapping_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    county_fips TEXT,
    mappings JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    is_shared BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_field_mapping_templates_org
    ON field_mapping_templates(org_id);

-- ===========================================================================
-- 6. GIS WORKSPACE — ROAD SEGMENTS & ADDRESS POINTS (Chunk 15)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS road_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES project_layers(id),
    segment_id TEXT NOT NULL,
    road_name TEXT NOT NULL,
    prefix TEXT,
    name TEXT,
    suffix TEXT,
    directional_suffix TEXT,
    aliases TEXT[],
    road_class TEXT,
    surface TEXT,
    jurisdiction TEXT,
    left_from INTEGER,
    left_to INTEGER,
    right_from INTEGER,
    right_to INTEGER,
    geometry TEXT NOT NULL,
    source_id UUID REFERENCES data_sources(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_road_segments_project ON road_segments(project_id);
CREATE INDEX IF NOT EXISTS idx_road_segments_org ON road_segments(org_id);

CREATE TABLE IF NOT EXISTS address_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES project_layers(id),
    address_id TEXT NOT NULL,
    house_number TEXT,
    street_prefix TEXT,
    street_name TEXT,
    street_type TEXT,
    unit TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    parcel_external_id TEXT,
    geometry TEXT NOT NULL,
    source_id UUID REFERENCES data_sources(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_address_points_project ON address_points(project_id);
CREATE INDEX IF NOT EXISTS idx_address_points_org ON address_points(org_id);

-- ===========================================================================
-- 7. AUTH — PERSISTENT INVITATIONS & SESSIONS (Chunk 3)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    invited_by UUID REFERENCES users(id),
    token_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON organization_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token_hash);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_family TEXT NOT NULL,
    current_refresh_hash TEXT,
    device_info TEXT,
    ip_address TEXT,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id, last_used_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_org ON auth_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_family ON auth_sessions(token_family);

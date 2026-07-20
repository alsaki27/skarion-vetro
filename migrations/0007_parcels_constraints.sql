-- Skarion-VETRO — Parcels, premises, row/easements, and constraints tables
-- Adds domain tables for property parcels, serviceable premises/buildings,
-- right-of-way / easement data, and network design constraints.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0007_parcels_constraints.sql

-- ===========================================================================
-- 1. PARCELS — Land parcel boundaries and ownership
-- ===========================================================================

CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES project_layers(id),
    parcel_external_id TEXT,
    site_address TEXT,
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,
    source_id UUID REFERENCES data_sources(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parcels_org ON parcels(org_id);
CREATE INDEX IF NOT EXISTS idx_parcels_project ON parcels(project_id);
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_parcels_external_id ON parcels(parcel_external_id);

-- ===========================================================================
-- 2. PREMISES / BUILDINGS — Serviceable structures on parcels
-- ===========================================================================

CREATE TABLE IF NOT EXISTS premises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parcel_id UUID REFERENCES parcels(id) ON DELETE SET NULL,
    address_id UUID REFERENCES address_points(id) ON DELETE SET NULL,
    building_type TEXT
        CHECK (building_type IN ('single_family', 'multi_family', 'commercial', 'industrial', 'mdu', 'school', 'government', 'other')),
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,
    serviceability TEXT
        CHECK (serviceability IN ('serviceable', 'not_serviceable', 'needs_field_validation', 'pending')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'demolished', 'vacant', 'under_construction')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_premises_org ON premises(org_id);
CREATE INDEX IF NOT EXISTS idx_premises_project ON premises(project_id);
CREATE INDEX IF NOT EXISTS idx_premises_parcel ON premises(parcel_id);
CREATE INDEX IF NOT EXISTS idx_premises_geom ON premises USING GIST(geometry);

-- ===========================================================================
-- 3. ROW / EASEMENTS — Right-of-way and utility easement corridors
-- ===========================================================================

CREATE TABLE IF NOT EXISTS row_easements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES project_layers(id),
    type TEXT NOT NULL
        CHECK (type IN ('row', 'utility_easement', 'drainage_easement', 'conservation_easement', 'other')),
    width_ft NUMERIC(8, 2),
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,
    source_id UUID REFERENCES data_sources(id),
    is_authoritative BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_row_easements_org ON row_easements(org_id);
CREATE INDEX IF NOT EXISTS idx_row_easements_project ON row_easements(project_id);
CREATE INDEX IF NOT EXISTS idx_row_easements_geom ON row_easements USING GIST(geometry);

-- ===========================================================================
-- 4. CONSTRAINTS — Network design constraint areas and features
-- ===========================================================================

CREATE TABLE IF NOT EXISTS constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    constraint_type TEXT NOT NULL
        CHECK (constraint_type IN (
            'environmental', 'archaeological', 'wetland', 'flood_zone',
            'steep_slope', 'endangered_habitat', 'historic_district',
            'airport_zone', 'military_zone', 'tribal_land',
            'existing_utility', 'road_crossing', 'railroad_crossing',
            'bridge_crossing', 'permit_required', 'other'
        )),
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    source_id UUID REFERENCES data_sources(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_constraints_org ON constraints(org_id);
CREATE INDEX IF NOT EXISTS idx_constraints_project ON constraints(project_id);
CREATE INDEX IF NOT EXISTS idx_constraints_type ON constraints(constraint_type);
CREATE INDEX IF NOT EXISTS idx_constraints_geom ON constraints USING GIST(geometry);

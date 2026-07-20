-- Skarion-VETRO — Enable PostGIS and add geometry columns
-- Adds geometry(Geometry, 4326) columns alongside existing text geometry columns
-- for backward-compatible migration to native spatial types.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0005_postgis.sql

-- ===========================================================================
-- 0. ENABLE POSTGIS
--    (0001_core also has this; IF NOT EXISTS is idempotent)
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ===========================================================================
-- 1. NETWORK ELEMENTS — add GEOMETRY column alongside existing text geometry
--    NOTE: 0001_core created network_elements.geometry as GEOGRAPHY(GEOMETRY,4326).
--    This migration adds a separate native GEOMETRY column for spatial operations
--    while preserving the existing GEOGRAPHY column for backward compat.
-- ===========================================================================

DO $$ BEGIN
    ALTER TABLE network_elements ADD COLUMN IF NOT EXISTS geom GEOMETRY(GEOMETRY, 4326);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ===========================================================================
-- 2. STUDY AREAS — add GEOMETRY column alongside text geometry
-- ===========================================================================

ALTER TABLE study_areas ADD COLUMN IF NOT EXISTS geom GEOMETRY(GEOMETRY, 4326);

-- ===========================================================================
-- 3. ADMINISTRATIVE AREAS — add GEOMETRY column alongside text geometry
-- ===========================================================================

ALTER TABLE administrative_areas ADD COLUMN IF NOT EXISTS geom GEOMETRY(GEOMETRY, 4326);

-- ===========================================================================
-- 4. ROAD SEGMENTS — add GEOMETRY column alongside text geometry
-- ===========================================================================

ALTER TABLE road_segments ADD COLUMN IF NOT EXISTS geom GEOMETRY(GEOMETRY, 4326);

-- ===========================================================================
-- 5. ADDRESS POINTS — add GEOMETRY column alongside text geometry
-- ===========================================================================

ALTER TABLE address_points ADD COLUMN IF NOT EXISTS geom GEOMETRY(GEOMETRY, 4326);

-- Skarion-VETRO — Spatial and composite indexes
-- Adds GiST spatial indexes on geometry columns and composite org_id indexes
-- where missing. Supports efficient bounding-box and spatial-join queries.
-- Apply: psql $NEON_DATABASE_URL -f migrations/0006_spatial_indexes.sql

-- ===========================================================================
-- 1. NETWORK ELEMENTS — spatial index on native GEOMETRY column
--    (idx_network_elements_geometry on the GEOGRAPHY column already exists
--     from 0001_core; this adds an index on the new GEOMETRY column)
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_network_elements_geom
    ON network_elements USING GIST(geom);

-- ===========================================================================
-- 2. STUDY AREAS — spatial index
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_study_areas_geom
    ON study_areas USING GIST(geom);

-- ===========================================================================
-- 3. ADMINISTRATIVE AREAS — spatial index
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_administrative_areas_geom
    ON administrative_areas USING GIST(geom);

-- ===========================================================================
-- 4. ROAD SEGMENTS — spatial index
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_road_segments_geom
    ON road_segments USING GIST(geom);

-- ===========================================================================
-- 5. ADDRESS POINTS — spatial index
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_address_points_geom
    ON address_points USING GIST(geom);

-- ===========================================================================
-- 6. COMPOSITE ORG_ID INDEXES WHERE MISSING
-- ===========================================================================

-- administrative_areas has idx_administrative_areas_study but no org_id index
CREATE INDEX IF NOT EXISTS idx_administrative_areas_org
    ON administrative_areas(org_id);

# Fixture: Williamson County parcels — neighborhood L131725C (Georgetown, TX 78628)

- **Publisher (authoritative source):** Williamson Central Appraisal District (WCAD)
- **Dataset:** WCAD Tax Parcels / Parcels layer
- **Source service:** https://services1.arcgis.com/Xff0bbfp6vwIWmlU/arcgis/rest/services/WCAD_Tax_Parcels/FeatureServer/0
- **ArcGIS item:** `1c5426672fb042faa956ba593485af4e`
- **Source export requested:** 2026-07-11
- **Source last edit (per ArcGIS):** 2026-07-09T11:52:27.730Z
- **License:** Williamson County public GIS data, provided free of charge, public domain. WCAD remains the authoritative source for parcel records.
- **CRS:** WGS 84 (EPSG:4326 / CRS84)
- **Extraction:** `scripts/intake/extract_parcels.py` — filter `NGHBRHDCD == "L131725C"`
- **Feature count:** 554 parcels (390 platted 2024–2026; new-construction residential subdivision, underground utilities)
- **Bounding box:** -97.77880, 30.59748 → -97.75176, 30.61207

## Field policy (privacy)

Restricted source fields are **removed at extraction** and must never be re-added
to student-facing fixtures: `OWNERNME1/2`, `CNVYNAME`, `PSTLADDRES`, `PSTLCITY`,
`PSTLSTATE`, `PSTLZIP*`, and all assessed/taxable value columns.

Retained fields and their canonical mapping are defined in
`scripts/intake/parcel-field-mapping.wcad.json` and `data/basemap/parcel.schema.json`.

## Intended use

Training basemap reference layer for HLD 02–04 exercises (service grouping,
structure placement, drop/trespass validation) on real, recent residential
parcels. Reference-only: students cannot edit parcel geometry or attributes.
Do not commit the county-wide source ZIP to this repository; it belongs in
object storage.

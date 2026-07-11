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

---

# Fixture: Williamson County E911 address points — clipped to L131725C parcels

- **Publisher (authoritative source):** Williamson County, TX GIS (911 Addressing)
- **Dataset:** "Address Points - Williamson County" (ArcGIS Hub shapefile export)
- **Source file timestamp:** 2024-11-04; **downloaded:** 2026-07-11
- **License:** Williamson County public GIS data (public records)
- **CRS:** WGS 84 (EPSG:4326 / CRS84)
- **Extraction:** `scripts/intake/extract_addresses.py` — bbox prefilter + point-in-polygon
  against `parcels.geojson`, `--only-in-parcels`
- **Feature count:** 557 address points (517 OPEN single-family; 37 CLOSED; 3 non-residential)
- **Parcel linkage:** 100% — every address carries `parcel_external_id` derived at intake
- **Known source limitations:** county `ADDRESS_ID` and `SEGMENT_ID` are unpopulated (0) in
  this export → `GlobalID` is the durable key; `CITY` is coded "WC" (unincorporated
  Williamson County) rather than "GEORGETOWN".

## Field policy (privacy/noise)

Dropped at extraction and never re-added: `ADDR_NOTES`, `SUPP_INFO`, editor identity
fields (`created_us`, `last_edite`, `UPDATING_A`), E911 routing internals (`ESN`,
`UID*`, `COLLECTION`).

## Intended use

Authoritative premise/demand layer for the Parkside Georgetown training project.
`status = OPEN` + `address_type = SINGLE FAMILY` defines the serviceable premise
candidate set; CLOSED/OPEN SPACE/UTILITIES points are context only.

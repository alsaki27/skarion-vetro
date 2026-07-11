# ADR 0001: AutoCAD Platform Boundary

## Status
Accepted

## Context
HLD 01 (EOP/CL/ROW tracing) and HLD 05 (vicinity sheet composition) are best performed in AutoCAD. HLD 02-04 and LLD 01-06 are implemented online in the Skarion-VETRO platform.

## Decision
- AutoCAD handles: HLD 01 basemap creation, HLD 05 sheet composition, final sheet output
- Platform handles: HLD 02-04 (service groups, structures, routes, topology), LLD 01-06 (labels, numbering, splice diagrams, BOM), all grading and validation
- The import pipeline (DWG->DXF->GeoJSON) bridges AutoCAD to the platform
- The export pipeline (GeoJSON->DXF-ready) bridges the platform to AutoCAD for HLD 05

## Consequences
- No platform investment in DWG editing or sheet layout
- Clear file-format contract between AutoCAD exports and platform imports
- Students must complete HLD 01 in AutoCAD before proceeding to online HLD 02-04

"""
DWG Ingest Service — FastAPI sidecar for Skarion-VETRO.
Converts student DWG files to normalized, layer-separated GeoJSON.

Endpoints:
  POST /upload         Upload DWG for processing
  GET  /status/{job}   Poll job status
  GET  /result/{job}   Download job result (GeoJSON per layer)

Pipeline: uploaded → converting → extracting → ready | failed
"""

import os
import math
import uuid
import json
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from converter import dwg_to_dxf
from extractor import extract_layers_to_geojson

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
ALLOWED_MAGIC = {
    b"AC10",  # DWG version code — all DWG files begin with "AC10xx"
    # Additional bytes checked below: full 6-byte header is "AC10xx" where xx is the version
}

def validate_dwg(file: UploadFile) -> bytes:
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large ({file.size} bytes). Maximum is {MAX_FILE_SIZE} bytes.")
    contents = file.file.read()
    # Magic-byte check: DWG files begin with "AC10" followed by a 2-digit version code.
    # Standard versions: AC1012 (R13), AC1014 (R14), AC1015 (2000), AC1018 (2004),
    # AC1021 (2007), AC1024 (2010), AC1027 (2013), AC1032 (2018)
    header = contents[:6]
    is_dwg = header[:4] in (b"AC10",) and header[4:6].isdigit()
    if not is_dwg:
        ext = Path(file.filename or "").suffix.lower()
        if ext != ".dwg":
            raise HTTPException(400, "Not a valid DWG file. Files must begin with 'AC10' magic bytes.")
    return contents

# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

async def process_dwg(job_id: str, dwg_bytes: bytes, template_slug: str | None):
    """Run the DWG→DXF→GeoJSON pipeline in a temp directory."""
    jobs[job_id]["status"] = "converting"
    webhook_status(job_id, "converting")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        dwg_path = tmp / "input.dwg"
        dxf_path = tmp / "output.dxf"

        dwg_path.write_bytes(dwg_bytes)

        # Step 1: DWG → DXF
        try:
            jobs[job_id]["status"] = "converting"
            dwg_to_dxf(str(dwg_path), str(dxf_path), timeout=CONVERTER_TIMEOUT)
        except Exception as e:
            fail_job(job_id, f"conversion_failed: {str(e)}")
            return

        if not dxf_path.exists():
            fail_job(job_id, "conversion_failed: DXF output not produced")
            return

        # Step 2: DXF → GeoJSON
        try:
            jobs[job_id]["status"] = "extracting"
            webhook_status(job_id, "extracting")

            # Layer names configured per template — here we use defaults
            layer_config = {
                "required": ["EOP", "CL", "RW", "PARCEL"],
                "aliases": {},  # template-specific layer name mapping
            }
            result = extract_layers_to_geojson(
                str(dxf_path),
                layer_config=layer_config,
                affine_transform=AFFINE_TRANSFORMS.get(template_slug or ""),
            )
        except Exception as e:
            fail_job(job_id, f"extraction_failed: {str(e)}")
            return

        # Step 3: Control-point verification
        cp_result = verify_control_points(result, template_slug)

        jobs[job_id].update({
            "status": "ready",
            "completed_at": datetime.utcnow().isoformat(),
            "result": {
                "layers": result,
                "control_points_verified": cp_result["ok"],
                "control_point_deviation_ft": cp_result.get("max_deviation_ft"),
                "template": template_slug,
            },
        })

    webhook_status(job_id, "ready")
    # Clean up old jobs (keep last 100)
    if len(jobs) > 100:
        oldest = sorted(jobs.keys(), key=lambda k: jobs[k].get("created_at", ""))[:50]
        for k in oldest:
            jobs.pop(k, None)


def fail_job(job_id: str, reason: str):
    jobs[job_id].update({
        "status": "failed",
        "completed_at": datetime.utcnow().isoformat(),
        "failure_reason": reason,
    })
    webhook_status(job_id, "failed", reason)


def webhook_status(job_id: str, status: str, reason: str | None = None):
    """Notify the main API of status changes (fire-and-forget)."""
    import httpx
    try:
        httpx.post(STATUS_WEBHOOK_URL, json={
            "job_id": job_id,
            "status": status,
            "failure_reason": reason,
        }, timeout=5)
    except Exception:
        pass  # webhook failure is non-fatal


def verify_control_points(layers: dict, template_slug: str | None) -> dict:
    """
    Verify student's control points match the template's expected values.
    Returns { ok: bool, max_deviation_ft: float | None, note: str }.
    """
    if not template_slug or template_slug not in CONTROL_POINTS:
        return {"ok": True, "note": "no control points configured for this template"}

    expected = CONTROL_POINTS[template_slug]
    if not expected:
        return {"ok": True, "note": "control points list is empty"}

    # Extract control points from the submitted DWG's _meta or a dedicated CONTROL layer
    # Control points are typically in a "CONTROL" or "CP" layer with known IDs.
    # For now, check if any feature coordinates match expected control point locations.
    extracted = []
    for layer_name, fc in layers.items():
        if layer_name == "_meta":
            continue
        for feature in fc.get("features", []):
            coords = feature.get("geometry", {}).get("coordinates", [])
            if (
                isinstance(coords, list)
                and len(coords) == 2
                and isinstance(coords[0], (int, float))
            ):
                extracted.append(tuple(coords))

    # Compare: for each expected control point, find the closest extracted point
    max_deviation_ft = 0.0
    missing = 0
    for exp_lng, exp_lat, exp_name in expected:
        best_dist = float("inf")
        for pt in extracted:
            # Simple Euclidean distance (approximately degrees → ft near Texas)
            dx = (pt[0] - exp_lng) * 364000  # ~1 deg lng ≈ 364000 ft at 30° lat
            dy = (pt[1] - exp_lat) * 364000
            dist = math.sqrt(dx * dx + dy * dy)
            if dist < best_dist:
                best_dist = dist
        if best_dist > 100:  # More than 100ft away = missing or moved
            missing += 1
        else:
            max_deviation_ft = max(max_deviation_ft, best_dist)

    if missing > 0:
        return {
            "ok": False,
            "max_deviation_ft": max_deviation_ft,
            "note": f"{missing} control point(s) missing or moved more than 100ft — verification failed",
        }

    if max_deviation_ft > 10:
        return {
            "ok": False,
            "max_deviation_ft": max_deviation_ft,
            "note": f"Control point deviation ({max_deviation_ft:.1f}ft) exceeds 10ft tolerance",
        }

    return {
        "ok": True,
        "max_deviation_ft": max_deviation_ft,
        "note": f"All {len(expected)} control points verified (max deviation {max_deviation_ft:.1f}ft)",
    }


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    yield

app = FastAPI(
    title="Skarion-VETRO DWG Ingest Service",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "dwg-ingest"}


@app.post("/upload", response_model=JobStatus)
async def upload_dwg(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    template_slug: str | None = None,
):
    contents = validate_dwg(file)
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    jobs[job_id] = {
        "job_id": job_id,
        "status": "uploaded",
        "created_at": now,
        "completed_at": None,
        "failure_reason": None,
        "result": None,
    }
    background_tasks.add_task(process_dwg, job_id, contents, template_slug)
    return JSONResponse(jobs[job_id], status_code=202)


@app.get("/status/{job_id}", response_model=JobStatus)
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@app.get("/result/{job_id}")
async def get_result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job["status"] != "ready":
        raise HTTPException(400, f"Job is {job['status']}, not ready yet")
    return job["result"]


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

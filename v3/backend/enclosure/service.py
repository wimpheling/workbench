"""Local engineering service; the kernel is serialized and outputs are revision-bound."""

from __future__ import annotations

import json
import threading
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

from .core import build_model, build_shapes, default_parameters, pose_model
from .exports import export_file
from .verification import verify

app = FastAPI(title="Workbench V3", version="0.1.0")
kernel_lock = threading.RLock()


@app.exception_handler(RequestValidationError)
async def malformed_request(_request, exc: RequestValidationError):
    # Do not echo non-finite inputs into JSON error responses: strict JSON cannot
    # encode NaN/Infinity, and malformed user input must produce 422 rather than 500.
    detail = "; ".join(
        f"{'.'.join(str(item) for item in error['loc'])}: {error['msg']}" for error in exc.errors()
    )
    return JSONResponse(status_code=422, content={"detail": detail})


class EvaluationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    parameters: dict[str, Any] = Field(default_factory=dict)
    pose: dict[str, Annotated[float, Field(strict=True, allow_inf_nan=False)]] = Field(
        default_factory=dict
    )
    expected_revision: str | None = None


@lru_cache(maxsize=3)
def _geometry_cached(parameter_json: str):
    model = build_model(json.loads(parameter_json))
    shapes = build_shapes(model)
    return model, shapes


@lru_cache(maxsize=3)
def _evaluate_cached(parameter_json: str):
    model, shapes = _geometry_cached(parameter_json)
    report = verify(model, shapes)
    return model, shapes, report


def evaluated(request: EvaluationRequest, *, verification: bool = True):
    try:
        # Validate and normalize before cache lookup; unknown parameters fail explicitly.
        candidate = build_model(request.parameters)
        pose_model(candidate, request.pose)
        key = json.dumps(candidate["parameters"], sort_keys=True, allow_nan=False)
        if verification:
            model, shapes, report = _evaluate_cached(key)
        else:
            model, shapes = _geometry_cached(key)
            report = None
    except (ValueError, TypeError, KeyError, OverflowError) as exc:
        raise HTTPException(422, detail=str(exc)) from exc
    if request.expected_revision is not None and request.expected_revision != model["revision"]:
        raise HTTPException(
            409, detail="Design revision changed. Evaluate the current dimensions before exporting."
        )
    return model, shapes, report


def tessellate(shapes: dict) -> list[dict]:
    meshes = []
    for id, shape in shapes.items():
        vertices, triangles = shape.tessellate(0.6, 0.12)
        meshes.append(
            {
                "id": id,
                "positions": [float(coord) for vertex in vertices for coord in vertex.toTuple()],
                "indices": [int(index) for triangle in triangles for index in triangle],
            }
        )
    return meshes


@app.get("/api/health")
def health():
    return {"status": "ok", "units": "mm", "kernel": "CadQuery/OpenCascade"}


@app.get("/api/defaults")
def defaults():
    return default_parameters()


@app.post("/api/evaluate")
def evaluate(request: EvaluationRequest):
    with kernel_lock:
        model, shapes, report = evaluated(request)
        return JSONResponse(
            content={
                "model": model,
                "report": report,
                "pose": request.pose,
                "mesh_pose": "closed",
                # Meshes stay at the canonical closed pose. Door metadata in
                # model.parts/model.doors is the authoritative transform
                # description consumed by the browser on animation frames.
                "meshes": tessellate(shapes),
            },
            headers={"X-Design-Revision": model["revision"], "X-Verification-State": "evaluated"},
        )


@app.post("/api/preview")
def preview(request: EvaluationRequest):
    """Build current geometry without running or implying engineering verification."""
    with kernel_lock:
        model, shapes, _ = evaluated(request, verification=False)
        return JSONResponse(
            content={
                "model": model,
                "report": None,
                "pose": request.pose,
                "mesh_pose": "closed",
                "meshes": tessellate(shapes),
            },
            headers={"X-Design-Revision": model["revision"], "X-Verification-State": "preview"},
        )


@app.post("/api/export/{kind}")
def export(kind: str, request: EvaluationRequest):
    if kind not in {"pack", "pdf", "csv", "dxf", "step", "json"}:
        raise HTTPException(404, detail="Unknown export format")
    with kernel_lock:
        model, shapes, report = evaluated(request)
        try:
            # Ordering dimensions and STEP always represent the closed canonical design;
            # opening a viewer door never changes supplier dimensions or revision.
            data, media_type, filename = export_file(kind, model, report, shapes)
        except (ValueError, TypeError, KeyError) as exc:
            raise HTTPException(422, detail=str(exc)) from exc
        return Response(
            data,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Design-Revision": model["revision"],
                "X-Order-Ready": str(report.get("order_ready", False)).lower(),
            },
        )


frontend = Path(__file__).resolve().parents[2] / "frontend" / "dist"
# Source tree is v3/backend/enclosure -> v3 is parents[2].
if frontend.is_dir():
    assets = frontend / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/")
    def index():
        return FileResponse(frontend / "index.html")

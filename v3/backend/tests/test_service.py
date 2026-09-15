"""Exercise the real HTTP boundary; cache prevents repeated kernel evaluation."""

import io
import json
import zipfile

import pytest
from enclosure.service import app
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as value:
        yield value


@pytest.fixture(scope="module")
def evaluation(client):
    response = client.post("/api/evaluate", json={"parameters": {}})
    assert response.status_code == 200, response.text
    assert response.headers["x-verification-state"] == "evaluated"
    assert response.headers["x-design-revision"] == response.json()["model"]["revision"]
    return response.json()


def test_defaults_and_real_geometry(client, evaluation):
    assert client.get("/api/health").json()["status"] == "ok"
    assert client.get("/api/defaults").json()["width_mm"] == 1674
    assert evaluation["model"]["revision"] == evaluation["report"]["revision"]
    assert evaluation["mesh_pose"] == "closed"
    assert len(evaluation["meshes"]) == len(evaluation["model"]["parts"])
    for mesh in evaluation["meshes"]:
        assert len(mesh["positions"]) % 3 == 0
        assert len(mesh["indices"]) % 3 == 0
        assert max(mesh["indices"]) < len(mesh["positions"]) / 3
    assert evaluation["report"]["order_ready"] is False
    # Revision C is explicitly a prototype, not the prior ideal-axis design.
    # Exterior hood clears the framing; nominal coverage is not seal approval.
    checks = {c["id"]: c for c in evaluation["report"]["checks"]}
    assert checks["containment.coverage.left-rear-perimeter-top.0"]["status"] == "pass"
    assert checks["containment.coverage.left-rear-perimeter-top.1"]["status"] == "pass"
    assert checks["assumption.bifold-exterior-head-brush"]["status"] == "unknown"
    assert any(
        c["status"] == "unknown"
        and {"left-rear-perimeter-top-seal", "left-rear-carrier-upright"}.issubset(
            c.get("references", [])
        )
        for c in checks.values()
    )
    assert not any(
        c["status"] == "fail" for c in checks.values() if c["id"].startswith("collision.")
    )
    access = checks["access.workpiece"]
    assert access["status"] == "pass"
    assert access["measured"]["final_center_y_mm"] == 1649 / 2
    assert access["measured"]["leading_edge_y_mm"] == (1649 + 1219.2) / 2
    assert checks["kinematics.native.left-rear"]["status"] == "unknown"
    assert not any(
        c["status"] == "fail"
        for c in evaluation["report"]["checks"]
        if c["category"] == "integrity"
    )
    assert evaluation["report"]["status"] == "incomplete"
    assert evaluation["report"]["summary"]["fail"] == 0
    assert checks["rear-electrical.cable-bore"]["status"] == "pass"
    assert checks["rear-electrical.installation"]["status"] == "unknown"
    coverage = [c for c in checks.values() if c["id"].startswith("containment.coverage.front-")]
    assert len(coverage) == 7 and all(c["status"] == "pass" for c in coverage)
    # Supported nominal returns close geometric obligations; physical compound,
    # compression and bonded installation still need evidence.
    for did in ("left-rear", "back-right"):
        assert checks[f"containment.intentional-gap.{did}-perimeter-bottom"]["status"] == "unknown"


@pytest.mark.parametrize(
    "parameters", [{"width_mm": -1}, {"height_mm": True}, {"typo": 5}, {"door_material": "unknown"}]
)
def test_bad_parameters_rejected(client, parameters):
    response = client.post("/api/evaluate", json={"parameters": parameters})
    assert response.status_code == 422
    assert response.json()["detail"]


def test_unknown_and_out_of_range_pose_rejected(client):
    for pose in ({"not-a-door": 0.5}, {"front-left": 2}):
        response = client.post("/api/evaluate", json={"pose": pose})
        assert response.status_code == 422


def test_nonfinite_pose_is_a_readable_input_error(client):
    response = client.post(
        "/api/evaluate",
        content='{"pose":{"front-left":NaN}}',
        headers={"content-type": "application/json"},
    )
    assert response.status_code == 422
    assert "finite" in response.json()["detail"]


@pytest.mark.parametrize("endpoint", ["evaluate", "preview", "export/csv"])
def test_front_astragal_sequence_is_enforced_at_http_boundary(client, endpoint):
    response = client.post(
        f"/api/{endpoint}", json={"pose": {"front-left": 0.5, "front-right": 0.5}}
    )
    assert response.status_code == 422
    assert "right" in response.json()["detail"].lower()


def test_pose_changes_keep_canonical_meshes_without_changing_design_or_report(client, evaluation):
    response = client.post(
        "/api/evaluate", json={"pose": {"front-left": 0.5, "front-right": 1, "left-rear": 0.5}}
    )
    assert response.status_code == 200
    opened = response.json()
    assert opened["mesh_pose"] == "closed"
    assert opened["model"]["revision"] == evaluation["model"]["revision"]
    assert opened["report"] == evaluation["report"]
    before = {m["id"]: m["positions"] for m in evaluation["meshes"]}
    after = {m["id"]: m["positions"] for m in opened["meshes"]}
    assert after == before
    assert before["panel-roof"] == after["panel-roof"]


def test_revision_mismatch_blocks_export(client):
    response = client.post("/api/export/csv", json={"expected_revision": "obsolete"})
    assert response.status_code == 409


def test_preview_never_runs_verification(client, monkeypatch):
    import enclosure.service as service

    def unexpected(*_args):
        raise AssertionError("Preview must not invoke verification")

    monkeypatch.setattr(service, "_evaluate_cached", unexpected)
    response = client.post(
        "/api/preview", json={"parameters": {"width_mm": 1690}, "pose": {"front-right": 0.2}}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["report"] is None
    assert response.headers["x-verification-state"] == "preview"
    assert response.headers["x-design-revision"] == data["model"]["revision"]
    assert data["model"]["parameters"]["width_mm"] == 1690
    assert len(data["meshes"]) == len(data["model"]["parts"])
    assert client.post("/api/preview", json={"pose": {"front-left": 2}}).status_code == 422


def test_real_supplier_pack_revision_and_pending_status(client, evaluation):
    revision = evaluation["model"]["revision"]
    response = client.post("/api/export/pack", json={"expected_revision": revision})
    assert response.status_code == 200, response.text
    assert response.headers["x-design-revision"] == revision
    assert response.headers["x-order-ready"] == "false"
    with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
        assert json.loads(archive.read("model.json"))["revision"] == revision
        assert json.loads(archive.read("verification.json"))["revision"] == revision
        assert archive.read("supplier-drawings.pdf").startswith(b"%PDF")
        assert b"NOT RELEASED" in archive.read("README.txt")
        glass_rows = archive.read("glass-panels.csv").decode("utf-8-sig").splitlines()
        assert len(glass_rows) >= 3

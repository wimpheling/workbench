import math

import cadquery as cq
import pytest
from enclosure.core import build_model, pose_model
from enclosure.verification import check_solid_pair, swept_box, verify


def test_zero_clearance_does_not_authorize_penetration():
    cube = cq.Workplane("XY").box(10, 10, 10).val()
    assert check_solid_pair(cube, cube.translate((5, 0, 0)), 0)["status"] == "fail"
    assert check_solid_pair(cube, cube.translate((10, 0, 0)), 0)["status"] == "pass"
    assert check_solid_pair(cube, cube.translate((10.5, 0, 0)), 1)["status"] == "fail"


def test_continuous_bounds_include_unsampled_extremum():
    p = {
        "id": "tip",
        "size": [2, 2, 2],
        "position": [10, 0, 0],
        "rotation_deg": 0,
        "motion_leaf": "a",
        "motion_local": [10, 0, 0],
    }
    d = {
        "max_angle_deg": 180,
        "opening_sign": 1,
        "base_deg": 0,
        "link_length_mm": 10,
        "pivot": [0, 0, 0],
    }
    bounds = swept_box(p, d)
    # The y maximum is inside the interval, not at either endpoint.
    assert bounds[1][1] >= math.sqrt(122)
    assert bounds[0][0] <= -11 and bounds[1][0] >= 11


def test_independent_bifold_bounds_enclose_core_poses():
    model = build_model()
    for door in model["doors"]:
        for lower, upper in [(0, 1), (0.13, 0.46), (0.74, 0.99)]:
            original = {p["id"]: p for p in model["parts"]}
            bounds = {id: swept_box(original[id], door, lower, upper) for id in door["part_ids"]}
            for f in [lower, (lower + upper) / 2, upper]:
                posed = pose_model(model, {door["id"]: f})
                for p in posed["parts"]:
                    if p["id"] not in bounds:
                        continue
                    actual = swept_box(p, None)
                    bound = bounds[p["id"]]
                    assert all(
                        bound[0][i] - 1e-7 <= actual[0][i] and bound[1][i] + 1e-7 >= actual[1][i]
                        for i in range(3)
                    ), p["id"]


@pytest.fixture
def fast_verify(monkeypatch):
    # Integrity tests deliberately omit solids. Absence of expensive evidence
    # must remain unknown; no motion result is fabricated by this fixture.
    monkeypatch.setattr("enclosure.core.build_shapes", lambda *args, **kwargs: {})
    return lambda model: verify(model, {})


def test_missing_part_cannot_improve_readiness(fast_verify):
    model = build_model()
    model["parts"] = [p for p in model["parts"] if p["id"] != "post-left-front"]
    report = fast_verify(model)
    assert report["status"] == "invalid" and not report["order_ready"]
    assert next(c for c in report["checks"] if c["id"] == "integrity.inventory")["status"] == "fail"


def test_removed_requirement_and_door_fail(fast_verify):
    model = build_model()
    model["requirements"] = []
    model["doors"] = []
    report = fast_verify(model)
    assert all(
        next(c for c in report["checks"] if c["id"] == id)["status"] == "fail"
        for id in ("integrity.requirements", "integrity.doors")
    )


def test_invalid_transform_and_reference_fail_without_crashing(fast_verify):
    model = build_model()
    model["parts"][0]["rotation_deg"] = math.nan
    model["joints"][0]["part_a"] = "nonexistent"
    report = fast_verify(model)
    assert report["status"] == "invalid"
    assert any(c["category"] == "assembly" and c["status"] == "fail" for c in report["checks"])


def test_disconnected_rotated_member_fails_actual_mating(fast_verify):
    model = build_model()
    part = next(p for p in model["parts"] if p["id"] == "rail-front-top")
    part["rotation_deg"] = 90
    report = fast_verify(model)
    assert any(c["category"] == "assembly" and c["status"] == "fail" for c in report["checks"])


def test_missing_geometry_is_unknown_not_clear(fast_verify):
    report = fast_verify(build_model())
    assert not report["order_ready"]
    assert (
        next(c for c in report["checks"] if c["id"] == "geometry.pair_coverage")["status"]
        == "unknown"
    )
    assert report["coverage"]["continuous_motion"] == "unknown"


def test_tolerance_margin_failure_is_blocking(fast_verify):
    report = fast_verify(build_model({"clearance_mm": 3, "cut_tolerance_mm": 2}))
    assert report["status"] == "invalid"
    assert (
        next(c for c in report["checks"] if c["id"] == "tolerance.cut_margin")["status"] == "fail"
    )


@pytest.mark.parametrize(
    "mutation",
    [
        {"local_a": [0, 0]},
        {"local_b": [0, 0, math.nan]},
        {"tolerance_mm": math.inf},
        {"tolerance_mm": -1},
    ],
)
def test_malformed_joint_evidence_fails(fast_verify, mutation):
    model = build_model()
    model["joints"][0].update(mutation)
    report = fast_verify(model)
    assert (
        next(c for c in report["checks"] if c["id"] == "joint." + model["joints"][0]["id"])[
            "status"
        ]
        == "fail"
    )


def test_removed_motion_membership_cannot_certify_motion(fast_verify):
    model = build_model()
    part = next(p for p in model["parts"] if p.get("motion_leaf"))
    del part["motion_leaf"]
    report = fast_verify(model)
    assert report["status"] == "invalid"
    assert report["coverage"]["continuous_motion"] == "unknown"


def test_undersized_declared_box_blocks_motion(monkeypatch):
    model = build_model()
    part = model["parts"][0]
    monkeypatch.setattr("enclosure.core.build_shapes", lambda *args, **kwargs: {})
    shape = (
        cq.Workplane("XY")
        .box(*[v + 20 for v in part["size"]])
        .translate(tuple(part["position"]))
        .val()
    )
    report = verify(model, {part["id"]: shape})
    assert (
        next(c for c in report["checks"] if c["id"] == "geometry.motion_envelope." + part["id"])[
            "status"
        ]
        == "unknown"
    )
    assert report["coverage"]["continuous_motion"] == "unknown"


def test_real_board_obstruction_is_failure(monkeypatch):
    model = build_model()
    part = next(p for p in model["parts"] if p["id"] == "panel-right")
    part.update(size=[20, 20, 20], position=[800, 0, 650])
    blocker = cq.Workplane("XY").box(20, 20, 20).translate((800, 0, 650)).val()
    monkeypatch.setattr(
        "enclosure.core.build_shapes", lambda *args, **kwargs: {part["id"]: blocker}
    )
    report = verify(model, {})
    assert next(c for c in report["checks"] if c["id"] == "access.workpiece")["status"] == "fail"


def test_unsupported_basis_is_rejected(fast_verify):
    model = build_model()
    model["parts"][0]["basis"] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    assert fast_verify(model)["status"] == "invalid"


def test_displaced_door_cannot_reset_itself_during_verification(fast_verify):
    model = build_model()
    part = next(p for p in model["parts"] if p.get("motion_leaf"))
    part["position"][0] += 20
    report = fast_verify(model)
    assert (
        next(c for c in report["checks"] if c["id"] == "integrity.closed_pose." + part["id"])[
            "status"
        ]
        == "fail"
    )


def test_actual_mating_face_area_is_measured(monkeypatch):
    parts = [
        dict(
            id=id,
            size=[10, 10, 10],
            position=[x, 0, 0],
            rotation_deg=0,
            physical=True,
            category="panel",
        )
        for id, x in (("a", -5), ("b", 5))
    ]
    model = dict(
        units="mm",
        parameters={},
        parts=parts,
        doors=[],
        requirements=[],
        assumptions=[],
        joints=[
            dict(
                id="ab",
                part_a="a",
                part_b="b",
                local_a=[5, 0, 0],
                local_b=[-5, 0, 0],
                normal_a=[1, 0, 0],
                normal_b=[-1, 0, 0],
                contact={"minimum_contact_area_mm2": 50},
            )
        ],
    )
    monkeypatch.setattr("enclosure.core.build_model", lambda *args: model)
    shapes = {
        p["id"]: cq.Workplane("XY").box(10, 10, 10).translate(tuple(p["position"])).val()
        for p in parts
    }
    report = verify(model, shapes)
    check = next(c for c in report["checks"] if c["id"] == "joint.contact.ab")
    assert check["status"] == "pass" and check["measured"] == pytest.approx(100)

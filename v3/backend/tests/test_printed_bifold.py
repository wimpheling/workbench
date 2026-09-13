import json
import math
from pathlib import Path

import pytest
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.verification import swept_box


def test_browser_fixture_is_current_backend_output():
    samples = json.loads(
        (
            Path(__file__).resolve().parents[2] / "frontend/src/printedBifold.fixture.json"
        ).read_text()
    )
    model = build_model()
    doors = {d["id"]: d for d in model["doors"]}
    parts = {p["id"]: p for p in model["parts"]}
    for sample in samples:
        did = sample["door"]["id"]
        for key, value in sample["door"].items():
            assert doors[did][key] == value
        part_id = did + (
            "-carriage" if sample["leaf"] == "slider" else f"-{sample['leaf']}-stile-b"
        )
        assert parts[part_id]["position"] == pytest.approx(sample["closed"])
        posed = pose_model(model, {did: sample["fraction"]})
        current = next(p for p in posed["parts"] if p["id"] == part_id)
        assert current["position"] == pytest.approx(sample["expected"])


def test_revision_c_matches_printed_study_and_jambs():
    model = build_model()
    left, rear = model["doors"][2:]
    assert left["primary_width_mm"] == 384.75
    assert left["secondary_width_mm"] == 424.75
    assert rear["primary_width_mm"] == 347.5
    assert rear["secondary_width_mm"] == 387.5
    assert rear["opening_width_mm"] == 750
    assert rear["leaf_height_mm"] == 682
    assert rear["reserved_sweep_mm"] == pytest.approx(372.80085, abs=1e-4)
    assert left["reserved_sweep_mm"] == pytest.approx(410.01770, abs=1e-4)
    assert rear["guide"]["module_length_mm"] == pytest.approx(133.84)
    assert left["guide"]["module_length_mm"] == pytest.approx(147.74)
    assert all(d["guide"]["module_count"] == 5 for d in (left, rear))
    parts = {p["id"]: p for p in model["parts"]}
    assert parts["post-back-middle"]["position"][0] + 15 == 1674 - 750
    assert parts["post-left-middle"]["position"][1] + 15 == 1649 / 2
    assert parts["back-right-b-infill"]["material"] == "polycarbonate"
    assert parts["back-right-b-infill"]["size"][1] == 4
    assert not any("guide-adapter" in p["id"] for p in model["parts"])
    assert not any(p.get("product_code") == "GSD082.3000KIT" for p in model["parts"])
    hinges = [p for p in model["parts"] if p.get("product_code") == "CFG.30/30 SH-6-C33"]
    assert sum(p["quantity"] for p in hinges) == 12


def test_rail_section_matches_real_print_and_wide_header():
    model = build_model()
    wanted = {"left-rear-track", "rail-left-top", "rail-back-top"}
    parts = [p for p in model["parts"] if p["id"] in wanted]
    shapes = build_shapes({**model, "parts": parts})
    assert all(s.isValid() and s.Volume() > 0 for s in shapes.values())
    left = shapes["rail-left-top"].BoundingBox()
    rear = shapes["rail-back-top"].BoundingBox()
    assert (left.xlen, left.zlen) == pytest.approx((60, 30))
    assert (rear.ylen, rear.zlen) == pytest.approx((60, 30))
    body = next(p for p in parts if p["id"] == "left-rear-track")
    # Channel, bolt holes and key recesses are cut, not displayed as a solid bar.
    assert shapes[body["id"]].Volume() < body["size"][0] * (46 * 25 - 23 * 21)


@pytest.mark.parametrize("rear_width,depth", [(650, 1300), (750, 1649), (800, 2500)])
def test_nondefault_dimensions_keep_guide_and_bounds_valid(rear_width, depth):
    model = build_model({"back_opening_width_mm": rear_width, "depth_mm": depth})
    original = {p["id"]: p for p in model["parts"]}
    for d in model["doors"][2:]:
        bounds = swept_box(original[d["id"] + "-b-stile-b"], d, 0.123, 0.987)
        for f in (0.123, 0.333, 0.667, 0.987):
            posed = pose_model(model, {d["id"]: f})
            door = next(v for v in posed["doors"] if v["id"] == d["id"])
            assert math.dist(
                door["kinematics"]["elbow"], door["kinematics"]["slider"]
            ) == pytest.approx(d["secondary_link_length_mm"])
            body = next(v for v in posed["parts"] if v["id"] == d["id"] + "-b-stile-b")
            actual = swept_box(body, None)
            assert all(
                bounds[0][i] <= actual[0][i] and bounds[1][i] >= actual[1][i] for i in range(3)
            )
        assert d["guide"]["module_length_mm"] + 10 <= 180


def test_new_mechanism_is_not_given_old_native_solver_pass():
    from enclosure.verification import verify

    model = build_model()
    report = verify(model, {})
    checks = {c["id"]: c for c in report["checks"]}
    assert checks["kinematics.native.left-rear"]["status"] == "unknown"
    assert checks["kinematics.native.back-right"]["status"] == "unknown"
    assert not report["order_ready"]

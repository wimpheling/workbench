import copy
import json

import pytest
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.exports import rear_electrical_print_files
from enclosure.rear_electrical import printable, verification_checks
from enclosure.verification import check_solid_pair


@pytest.mark.parametrize("fraction", [0, 0.25, 0.5, 0.75, 1])
def test_rear_hardware_clears_doors_and_fixed_parts(fraction):
    model = pose_model(build_model(), {"left-rear": fraction, "back-right": fraction})
    shapes = build_shapes(model)
    for p in model["parts"]:
        if p["assembly"] != "rear-electrical" or not p.get("physical", True):
            continue
        for q in model["parts"]:
            if p["id"] == q["id"] or not q.get("physical", True):
                continue
            assert check_solid_pair(shapes[p["id"]], shapes[q["id"]])["status"] != "fail", (
                p["id"],
                q["id"],
            )


def test_connector_opening_is_real_and_removal_detected():
    model = build_model()
    wall = next(p for p in model["parts"] if p["id"] == "panel-back-left")
    shapes = build_shapes({"parts": [wall]})
    checks = verification_checks(model, shapes)
    assert checks[0]["status"] == "pass"
    assert checks[1]["status"] == "pass"
    assert checks[2]["status"] == "unknown"
    changed = copy.deepcopy(wall)
    changed["holes"] = [h for h in changed["holes"] if h["diameter_mm"] != 60]
    assert verification_checks(model, build_shapes({"parts": [changed]}))[0]["status"] == "fail"


def test_prints_are_connected_fit_bed_and_carry_revision():
    model = build_model()
    files = rear_electrical_print_files(model)
    assert len(files) == 6
    for role in ("pendant-cradle", "cable-cover-left", "cable-cover-right"):
        shape, _, _ = printable(role)
        assert shape.isValid() and len(shape.Solids()) == 1
    for name, content in files.items():
        if name.endswith(".json"):
            manifest = json.loads(content)
            assert manifest["revision"] == model["revision"]
            assert max(manifest["dimensions_mm"]) <= 180
            assert manifest["quantity"] == 1


def test_equipment_has_bearing_support_and_strap_access():
    model = build_model()
    rows = [p for p in model["parts"] if p["assembly"] == "rear-electrical"]
    shapes = build_shapes({"parts": rows})
    assert shapes["rear-controller"].distance(shapes["rear-controller-support-shelf"]) < 1e-6
    by = {p["id"]: p for p in rows}
    cradle = shapes["rear-pendant-cradle"]
    assert cradle.distance(shapes["rear-pendant-plate"]) == pytest.approx(6)
    for p in rows:
        if "cradle-spacer" in p["id"]:
            assert shapes[p["id"]].distance(cradle) < 1e-6
            assert shapes[p["id"]].distance(shapes["rear-pendant-plate"]) < 1e-6
    assert by["rear-controller"]["size"] == [171, 89, 337]

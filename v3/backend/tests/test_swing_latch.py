"""Check latch release, blocking, mounting and simple assembly access in real CAD."""

import json

import cadquery as cq
import pytest
from enclosure.core import _add, _rotate, build_model, build_shapes, pose_model
from enclosure.exports import swing_latch_print_files
from enclosure.verification import check_solid_pair


def assert_latch_clear(model):
    shapes = build_shapes(model)
    for p in model["parts"]:
        if "-swing-latch-" not in p["id"]:
            continue
        for q in model["parts"]:
            if p["id"] == q["id"] or q["category"].endswith("envelope"):
                continue
            assert check_solid_pair(shapes[p["id"]], shapes[q["id"]])["status"] != "fail", (
                p["id"],
                q["id"],
            )


@pytest.mark.parametrize("fraction", [0, 0.001, 0.01, 0.05, 0.25, 0.5, 0.75, 1])
def test_released_latch_full_motion(fraction):
    assert_latch_clear(pose_model(build_model(), {"left-rear": fraction, "back-right": fraction}))


@pytest.mark.parametrize(
    "parameters",
    [
        dict(depth_mm=1300, back_opening_width_mm=650, height_mm=650),
        dict(depth_mm=2500, back_opening_width_mm=800, height_mm=1500),
    ],
)
@pytest.mark.parametrize("fraction", [0, 0.5, 1])
def test_latch_dimension_extremes(parameters, fraction):
    assert_latch_clear(
        pose_model(build_model(parameters), {"left-rear": fraction, "back-right": fraction})
    )


def test_lift_sweep_and_locked_blocking():
    m = build_model()
    base = build_shapes(m)
    levers = [p for p in m["parts"] if p.get("product_code") == "BF-SWING-LEVER"]
    rigid = [p for p in m["parts"] if not p["category"].endswith("envelope")]
    for angle in range(0, 91, 5):
        for lever in levers:
            item = {**lever, "latch_release_deg": angle}
            s = build_shapes({"parts": [item]})[lever["id"]]
            if angle == 90:
                assert s.distance(base[lever["assembly"] + "-a-handle"]) > 15
            for q in rigid:
                if q["id"] == lever["id"]:
                    continue
                assert check_solid_pair(s, base[q["id"]])["status"] != "fail", (
                    angle,
                    lever["id"],
                    q["id"],
                )
    pm = pose_model(m, {"left-rear": 0.02, "back-right": 0.02})
    parts = [p for p in pm["parts"] if "-swing-latch-" in p["id"]]
    for p in parts:
        p["latch_release_deg"] = 0
    locked = build_shapes({"parts": parts})
    # This intentional obstruction proves retention; it is not excluded from collisions.
    for did in ("left-rear", "back-right"):
        assert (
            locked[did + "-swing-latch-lever"]
            .intersect(locked[did + "-swing-latch-keeper"])
            .Volume()
            > 1
        )


def test_mounts_access_and_prints():
    m = build_model()
    shapes = build_shapes(m)
    for d in m["doors"]:
        if d["type"] != "bifold":
            continue
        did = d["id"]
        for role, stile in [("lever", "a-stile-b"), ("keeper", "b-stile-a")]:
            assert shapes[f"{did}-swing-latch-{role}"].distance(shapes[f"{did}-{stile}"]) < 1e-5
        for p in m["parts"]:
            if p["assembly"] != did or p.get("geometry", {}).get("kind") != "swing-latch":
                continue
            role = p["geometry"]["role"]
            if role in ("lever", "keeper"):
                continue
            # 80 mm straight 4 mm hex driver approach, outside the nominal head.
            start = _add(
                p["position"], _rotate([0, -p["size"][1] / 2 - 0.01, 0], p["rotation_deg"])
            )
            axis = _rotate([0, -1, 0], p["rotation_deg"])
            tool = cq.Solid.makeCylinder(2.4, 80, cq.Vector(*start), cq.Vector(*axis))
            for q in m["parts"]:
                if q.get("deformable") or q["category"].endswith("envelope"):
                    continue
                assert check_solid_pair(tool, shapes[q["id"]])["status"] != "fail", (
                    p["id"],
                    q["id"],
                )
    files = swing_latch_print_files(m)
    assert len(files) == 4
    for name, content in files.items():
        if name.endswith(".json"):
            data = json.loads(content)
            assert data["quantity"] == 2 and data["revision"] == m["revision"]
            assert max(data["dimensions_mm"]) < 180

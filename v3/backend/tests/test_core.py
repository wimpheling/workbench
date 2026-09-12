import math

import pytest
from enclosure.constraints import solve_bifold_axes
from enclosure.core import build_model, build_shapes, pose_model


@pytest.mark.parametrize(
    "params",
    [
        {"width_mm": float("nan")},
        {"height_mm": -1},
        {"clearance_mm": True},
        {"unknown": 1},
        {"door_material": "paper"},
        {"bifold_material": "paper"},
    ],
)
def test_bad_inputs_rejected(params):
    with pytest.raises(ValueError):
        build_model(params)


def test_revision_and_inventory():
    a = build_model()
    b = build_model({"width_mm": 1800})
    assert a["revision"] != b["revision"]
    assert a["revision"] == build_model()["revision"]
    assert len({p["id"] for p in a["parts"]}) == len(a["parts"])
    assert {d["id"] for d in a["doors"]} == {
        "front-left",
        "front-right",
        "left-rear",
        "back-right",
    }
    assert all(not a["confirmed"] for a in a["assumptions"])


@pytest.mark.parametrize("fraction", [0, 0.2, 0.5, 0.9, 1])
def test_bifold_rigid_links_close_on_guide(fraction):
    m = build_model()
    posed = pose_model(m, {"left-rear": fraction, "back-right": fraction})
    for d in [d for d in posed["doors"] if d["type"] == "bifold"]:
        pivot = d["pivot"]
        elbow = d["kinematics"]["elbow"]
        slider = d["kinematics"]["slider"]
        L = d["link_length_mm"]
        assert math.dist(pivot, elbow) == pytest.approx(L)
        assert math.dist(elbow, slider) == pytest.approx(L)
        base = math.radians(d["base_deg"])
        normal = [-math.sin(base), math.cos(base)]
        assert sum((slider[i] - pivot[i]) * normal[i] for i in range(2)) == pytest.approx(
            0, abs=1e-8
        )
        assert sum((elbow[i] - pivot[i]) * normal[i] for i in range(2)) >= -1e-8
    assert m.get("pose") is None


def test_pose_rejects_unknown_and_nonfinite():
    for pose in [{"front-left": 1.01}, {"missing": 0}, {"back-right": float("nan")}]:
        with pytest.raises(ValueError):
            pose_model(build_model(), pose)


def test_supplier_section_swept_without_scaling():
    from enclosure.profiles import extrusion, section

    for length in [100, 740, 1674]:
        shape = extrusion(length, 2)
        assert shape.isValid()
        assert shape.BoundingBox().zlen == pytest.approx(length)
        assert shape.Volume() == pytest.approx(section().Area() * length, rel=1e-6)
        assert shape.Volume() < 30 * 30 * length * 0.5  # Slots and internal holes are preserved.


def test_roof_hole_matches_order_drawing():
    m = build_model()
    roof = next(p for p in m["parts"] if p["id"] == "panel-roof")
    shape = build_shapes({**m, "parts": [roof]})["panel-roof"]
    w, h, t = roof["cut_size_mm"]
    hole = roof["holes"][0]
    assert (hole["x_mm"], hole["y_mm"]) == (w / 2, h / 2)
    assert shape.Volume() == pytest.approx((w * h - math.pi * (hole["diameter_mm"] / 2) ** 2) * t)


def test_native_solver_finds_second_angle_from_constraints():
    result = solve_bifold_axes(400, 45)
    assert result["hinge_residual_mm"] < 1e-5
    assert result["guide_residual_mm"] < 1e-5
    assert result["link_length_residual_mm"] < 1e-5
    assert result["second_end"][0] == pytest.approx(800 * math.cos(math.pi / 4), abs=1e-5)


def test_zero_pose_preserves_every_nominal_transform():
    model = build_model()
    posed = pose_model(model, {d["id"]: 0 for d in model["doors"]})
    for original, current in zip(model["parts"], posed["parts"]):
        assert original["id"] == current["id"]
        assert current["position"] == pytest.approx(original["position"], abs=1e-8)
        assert current["rotation_deg"] == pytest.approx(original["rotation_deg"])


def test_front_brackets_clear_closed_leaves():
    model = build_model()
    selected = [
        p
        for p in model["parts"]
        if (p["id"].startswith("bracket-") and "-front-" in p["id"])
        or p["id"] in ("front-left-a-stile-a", "front-right-a-stile-a")
    ]
    shapes = build_shapes({**model, "parts": selected})
    for bracket in selected:
        if not bracket["id"].startswith("bracket-"):
            continue
        for leaf in ("front-left-a-stile-a", "front-right-a-stile-a"):
            assert shapes[bracket["id"]].intersect(shapes[leaf]).Volume() < 1e-5


def test_structural_mating_normals_oppose():
    for joint in build_model()["joints"]:
        assert sum(a * b for a, b in zip(joint["normal_a"], joint["normal_b"])) == pytest.approx(-1)

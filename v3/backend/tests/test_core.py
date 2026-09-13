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


def test_front_astragal_sequence_is_enforced():
    model = build_model()
    with pytest.raises(ValueError, match="Open right front leaf fully"):
        pose_model(model, {"front-left": 0.01, "front-right": 0.99})
    pose_model(model, {"front-right": 0.5})
    pose_model(model, {"front-right": 1, "front-left": 0.5})


def test_fixed_panels_lap_frame_and_roof_has_gasket_bearing():
    model = build_model()
    parts = {p["id"]: p for p in model["parts"]}
    assert parts["panel-right"]["size"][1:] == [1709, 800]
    assert parts["panel-right"]["position"][0] - parts["panel-right"]["size"][0] / 2 == 1706
    assert parts["panel-roof"]["position"][2] - parts["panel-roof"]["size"][2] / 2 == 772
    assert len([p for p in parts if p.startswith("roof-perimeter-gasket-")]) == 4


def test_roof_collar_is_a_real_annulus():
    model = build_model()
    collar = next(p for p in model["parts"] if p["id"] == "roof-hose-collar")
    shape = build_shapes({**model, "parts": [collar]})[collar["id"]]
    outer = collar["geometry"]["outer_diameter_mm"]
    inner = collar["geometry"]["inner_diameter_mm"]
    assert shape.Volume() == pytest.approx(math.pi * (outer**2 - inner**2) / 4 * collar["size"][2])


def test_wall_vent_cutout_matches_supplier_rectangle():
    model = build_model()
    wall = next(p for p in model["parts"] if p["id"] == "panel-right")
    hole = wall["cutouts"][0]
    shape = build_shapes({**model, "parts": [wall]})[wall["id"]]
    assert shape.Volume() == pytest.approx(
        math.prod(wall["size"]) - hole["width_mm"] * hole["height_mm"] * wall["size"][0]
    )
    assert hole["x_mm"] + hole["width_mm"] / 2 == wall["size"][1] / 2
    assert hole["y_mm"] + hole["height_mm"] / 2 - wall["size"][2] / 2 == hole["center_local_mm"][2]


def test_packing_bridges_glass_to_continuous_retainer():
    model = build_model()
    parts = {p["id"]: p for p in model["parts"]}
    pane = parts["front-left-a-infill"]
    packing = parts["front-left-a-infill-left-packing-out"]
    bead = parts["front-left-a-infill-left-retainer-out"]
    assert (
        packing["motion_local"][1] - packing["size"][1] / 2
        == pane["motion_local"][1] + pane["size"][1] / 2
    )
    assert (
        packing["motion_local"][1] + packing["size"][1] / 2
        == bead["motion_local"][1] - bead["size"][1] / 2
    )


def test_baffle_actual_solids_block_diagonal_opening_to_exit_rays():
    import cadquery as cq

    model = build_model()
    vent = next(e for e in model["containment"] if e["id"] == "makeup-air-inlet")
    selected = [p for p in model["parts"] if p["id"] in vent["part_ids"]]
    shapes = build_shapes({**model, "parts": selected})
    barrier = cq.Compound.makeCompound(list(shapes.values()))
    x, y, z = vent["opening_center_mm"]
    width, height = vent["opening_size_mm"]
    for startz in [z - height / 2, z + height / 2]:
        for exitx in [vent["exit_min_mm"][0] + 0.1, vent["exit_max_mm"][0] - 0.1]:
            line = cq.Edge.makeLine((x, y, startz), (exitx, y, vent["exit_min_mm"][2]))
            common = barrier.intersect(line)
            assert sum(edge.Length() for edge in common.Edges()) > 0
    assert vent["minimum_path_area_mm2"] >= 2 * vent["hose_area_mm2"]


def test_overhead_guides_clear_closed_header_in_every_checked_pose():
    model = build_model()
    assert not any(p["id"].endswith("-closure-stop") for p in model["parts"])
    for fraction in (0, 0.5, 1):
        posed = pose_model(model, {"left-rear": fraction, "back-right": fraction})
        for did in ("left-rear", "back-right"):
            selected = [
                p
                for p in posed["parts"]
                if p["id"].startswith(did + "-")
                and (
                    "-guide-adapter-" in p["id"]
                    or "-perimeter-top-" in p["id"]
                    or p["id"] in (did + "-track", did + "-carriage")
                )
            ]
            shapes = build_shapes({**posed, "parts": selected})
            headers = [p for p in selected if "-perimeter-top-" in p["id"]]
            hardware = [p for p in selected if p not in headers]
            for a in headers:
                for b in hardware:
                    assert shapes[a["id"]].intersect(shapes[b["id"]]).Volume() < 1e-5, (
                        a["id"],
                        b["id"],
                        fraction,
                    )


def test_old_buried_guide_layout_is_rejected_by_actual_geometry():
    from enclosure.verification import check_solid_pair

    model = build_model()
    parts = {p["id"]: p for p in model["parts"]}
    track = dict(parts["left-rear-track"])
    track["position"] = list(track["position"])
    track["position"][2] -= 100
    header = parts["left-rear-perimeter-top-stop"]
    shapes = build_shapes({**model, "parts": [track, header]})
    assert check_solid_pair(shapes[track["id"]], shapes[header["id"]])["status"] == "fail"

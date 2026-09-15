import csv
import io
import itertools

import pytest
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.exports import export_file
from enclosure.verification import check_solid_pair, swept_box


def test_front_inventory_datum_vendor_axes_and_quote():
    m = build_model()
    parts = {p["id"]: p for p in m["parts"]}
    assert (
        sum(p.get("quantity", 1) for p in parts.values() if p.get("cad_asset") == "CFG3030.stp")
        == 18
    )
    assert len([p for p in parts.values() if p.get("product_code") == "CJP3030L"]) == 28
    for d in m["doors"][:2]:
        assert d["pivot"][1] == -38
        assert d["max_angle_deg"] == 100
        for p in parts.values():
            if p["assembly"] != d["id"] or p["category"] not in ("extrusion", "glass", "panel"):
                continue
            assert p["position"][1] - p["size"][1] / 2 >= -30
        for i in range(3):
            moving = parts[f"{d['id']}-frame-hinge-{i}-positive"]
            fixed = parts[f"{d['id']}-frame-hinge-{i}-negative"]
            assert moving["motion_leaf"] == "a"
            assert "motion_leaf" not in fixed
    data, _, _ = export_file("csv", m, {"revision": m["revision"], "order_ready": False}, {})
    rows = {r["part_id"]: r for r in csv.DictReader(io.StringIO(data.decode("utf-8-sig")))}
    assert rows["front-left-a-infill-left-slot-gasket"]["product_code"] == "Selection pending"
    assert "NOT FSP08" in rows["front-left-a-infill"]["machining"]
    assert float(rows["front-left-a-infill"]["thickness_mm"]) == 6
    assert rows["front-left-hinge-spacer-0"]["product_code"] == "FRONT-HINGE-SPACER-6"
    assert float(rows["front-perimeter-left-stop"]["cut_length_mm"]) == 676


@pytest.mark.parametrize("material,thickness", [("glass", 4), ("glass", 6), ("wood", 6)])
def test_front_slot_holder_contacts_panel_and_clears_vendor_slots(material, thickness):
    m = build_model(
        {
            "door_material": material,
            "glass_thickness_mm": thickness,
            "panel_thickness_mm": thickness,
        }
    )
    parts = [p for p in m["parts"] if p["id"].startswith("front-left-a-")]
    s = build_shapes({**m, "parts": parts})
    pane = s["front-left-a-infill"]
    frames = [
        s["front-left-a-" + suffix] for suffix in ("stile-a", "stile-b", "rail-low", "rail-high")
    ]
    for frame in frames:
        assert pane.intersect(frame).Volume() < 1e-5
    for p in parts:
        if not p["id"].endswith("slot-gasket"):
            continue
        gasket = s[p["id"]]
        assert gasket.isValid() and len(gasket.Solids()) == 1
        assert gasket.intersect(pane).Volume() < 1e-5
        assert gasket.distance(pane) < 1e-5
        for frame in frames:
            assert gasket.intersect(frame).Volume() < 1e-5


@pytest.mark.parametrize(
    "left,right", [(0, 0), (0, 0.02), (0, 0.5), (0, 1), (0.02, 1), (0.5, 1), (1, 1)]
)
def test_front_staged_sweep_against_assembly(left, right):
    m = pose_model(build_model(), {"front-left": left, "front-right": right})
    # Entire inventory near the front, plus every front component. Far geometry
    # is separately covered by the production continuous-motion verifier.
    parts = [
        p
        for p in m["parts"]
        if p.get("physical")
        and not p.get("deformable")
        and (p["assembly"].startswith("front-") or p["position"][1] - max(p["size"]) / 2 < 100)
    ]
    s = build_shapes({**m, "parts": parts})
    for p, q in itertools.combinations(parts, 2):
        if any(
            x["assembly"].startswith("front-")
            or x["id"].startswith("bracket-")
            and "-front-" in x["id"]
            for x in (p, q)
        ):
            r = check_solid_pair(s[p["id"]], s[q["id"]])
            assert r["status"] == "pass", (left, right, p["id"], q["id"], r)


def test_right_door_must_open_before_left_and_sweep_bounds_include_intermediate_pose():
    m = build_model()
    with pytest.raises(ValueError):
        pose_model(m, {"front-left": 0.01, "front-right": 0.99})
    for d in m["doors"][:2]:
        p = next(p for p in m["parts"] if p["id"] == d["id"] + "-a-stile-b")
        box = swept_box(p, d)
        for fraction in (0.01, 0.33, 0.67, 0.99):
            posed = pose_model(
                m, {d["id"]: fraction, **({"front-right": 1} if d["id"] == "front-left" else {})}
            )
            q = next(q for q in posed["parts"] if q["id"] == p["id"])
            bb = build_shapes({**posed, "parts": [q]})[q["id"]].BoundingBox()
            for axis, lo, hi in (
                (0, bb.xmin, bb.xmax),
                (1, bb.ymin, bb.ymax),
                (2, bb.zmin, bb.zmax),
            ):
                assert box[0][axis] - 1e-6 <= lo <= hi <= box[1][axis] + 1e-6


def test_every_degree_of_both_opening_and_reverse_closing_sweeps():
    """Native-solid sampling at 1 degree, distinct from continuous interval proof."""
    m = build_model()
    parts = [
        p
        for p in m["parts"]
        if p.get("physical")
        and not p.get("deformable")
        and (p["assembly"].startswith("front-") or p["position"][1] - max(p["size"]) / 2 < 100)
    ]
    shapes = build_shapes({**m, "parts": parts})
    doors = {d["id"]: d for d in m["doors"] if d["type"] == "swing"}
    moving = {p["id"] for p in parts if p["assembly"] in doors and p.get("motion_leaf")}
    pairs = [
        (p, q)
        for p, q in itertools.combinations(parts, 2)
        if (p["id"] in moving or q["id"] in moving)
        and not (p["id"] in moving and q["id"] in moving and p["assembly"] == q["assembly"])
    ]
    # Each geometry traversed during opening is also traversed in reverse closing.
    for stage in ("front-right", "front-left"):
        for degree in range(101):
            posed = {}
            bounds = {}
            for p in parts:
                shape = shapes[p["id"]]
                if p["id"] in moving:
                    d = doors[p["assembly"]]
                    angle = (
                        degree if p["assembly"] == stage else (100 if stage == "front-left" else 0)
                    )
                    pivot = d["pivot"]
                    shape = shape.rotate(
                        tuple(pivot), (pivot[0], pivot[1], pivot[2] + 1), angle * d["opening_sign"]
                    )
                posed[p["id"]] = shape
                bb = shape.BoundingBox()
                bounds[p["id"]] = ((bb.xmin, bb.ymin, bb.zmin), (bb.xmax, bb.ymax, bb.zmax))
            for p, q in pairs:
                a, b = bounds[p["id"]], bounds[q["id"]]
                if any(min(a[1][i], b[1][i]) <= max(a[0][i], b[0][i]) for i in range(3)):
                    continue
                r = check_solid_pair(posed[p["id"]], posed[q["id"]])
                assert r["status"] == "pass", (stage, degree, p["id"], q["id"], r)

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
    assert rows["front-left-a-infill-left-slot-gasket"]["product_code"] == "FSP08"
    assert "FSP08 drawing-based candidate" in rows["front-left-a-infill"]["machining"]
    assert float(rows["front-left-a-infill"]["thickness_mm"]) == 4
    assert rows["front-left-hinge-spacer-0"]["product_code"] == "FRONT-HINGE-SPACER-6"
    assert float(rows["front-perimeter-left-stop"]["cut_length_mm"]) == 720


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
            x["id"].startswith("front-") or x["id"].startswith("bracket-") and "-front-" in x["id"]
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


def front_barriers(parameters=None):
    m = build_model(parameters)
    entries = [e for e in m["containment"] if e["id"].startswith("front-")]
    ids = {i for e in entries for i in e["part_ids"]}
    ids |= {i for e in entries for pair in e.get("nominal_contact_chain", []) for i in pair}
    parts = [p for p in m["parts"] if p["id"] in ids]
    return m, entries, build_shapes({**m, "parts": parts})


@pytest.mark.parametrize(
    "parameters",
    [
        None,
        {"width_mm": 1300, "height_mm": 650, "clearance_mm": 3},
        {"width_mm": 2500, "height_mm": 1500, "clearance_mm": 12},
    ],
)
def test_front_seams_cover_full_obligations_and_have_connected_support(parameters):
    from enclosure.verification import check_barrier_connection, check_barrier_region

    m, entries, shapes = front_barriers(parameters)
    for e in entries:
        for region in e["coverage_regions"]:
            assert check_barrier_region(shapes, region, 2, 0.5)["status"] == "pass", e["id"]
        for pair in e["nominal_contact_chain"]:
            assert check_barrier_connection(shapes, pair)["status"] == "pass", pair
    plug, header = shapes["front-header-channel-plug"], shapes["rail-left-top"]
    assert plug.isValid() and len(plug.Solids()) == 1
    assert plug.intersect(header).Volume() < 1e-5
    assert plug.distance(header) < 1e-5
    # The meeting obligation still spans the entire aperture, now around a
    # connected stepped section, with unchanged overlap/cut allowance.
    meeting = next(e for e in entries if e["id"] == "front-meeting")
    spans = sorted((r["min_mm"][1], r["max_mm"][1]) for r in meeting["coverage_regions"])
    assert spans[0][0] == 0 and spans[-1][1] == m["parameters"]["height_mm"]
    assert all(a[1] == b[0] for a, b in zip(spans, spans[1:]))
    for p in m["parts"]:
        for seat in p.get("installed_relief_ids", []):
            assert shapes[p["id"]].isValid()
            assert len(shapes[p["id"]].Solids()) == 1
            assert shapes[p["id"]].intersect(shapes[seat]).Volume() < 1e-5


def test_front_junction_evidence_rejects_removed_shifted_and_perforated_seals():
    import cadquery as cq
    from enclosure.verification import check_barrier_connection, check_barrier_region

    m, entries, shapes = front_barriers()
    by_id = {e["id"]: e for e in entries}
    # Every added meeting-end component is essential to coverage or connection.
    for level in ("bottom", "top"):
        for suffix in ("saddle", "apron"):
            pid = f"front-meeting-{level}-{suffix}"
            broken = {k: v for k, v in shapes.items() if k != pid}
            e = by_id["front-meeting"]
            assert any(
                check_barrier_connection(broken, pair)["status"] == "fail"
                for pair in e["nominal_contact_chain"]
            )
    region = by_id["front-perimeter-left"]["coverage_regions"][0]
    seal = "front-perimeter-left-seal"
    broken = {**shapes, seal: shapes[seal].translate((20, 0, 0))}
    assert check_barrier_region(broken, region, 2, 0.5)["status"] == "fail"
    hole = cq.Workplane("XY").box(4, 20, 4).translate((3, 9, 200)).val()
    broken = {**shapes, seal: shapes[seal].cut(hole)}
    assert check_barrier_region(broken, region, 2, 0.5)["status"] == "fail"
    broken = {k: v for k, v in shapes.items() if k != "front-header-channel-plug"}
    region = by_id["front-perimeter-top"]["coverage_regions"][0]
    assert check_barrier_region(broken, region, 2, 0.5)["status"] == "fail"
    # Removing a head return exposes the corner despite the remaining jamb.
    seal = "front-perimeter-top-seal"
    notch = cq.Workplane("XY").box(20, 20, 20).translate((5, 9, 738)).val()
    broken = {**shapes, seal: shapes[seal].cut(notch)}
    region = by_id["front-perimeter-top"]["coverage_regions"][0]
    assert check_barrier_region(broken, region, 2, 0.5)["status"] == "fail"


def test_relief_tongues_support_the_corner_returns_without_filling_bracket_space():
    from enclosure.verification import check_barrier_region

    m, _, shapes = front_barriers()
    W, H = m["parameters"]["width_mm"], m["parameters"]["height_mm"]
    for side, low, high in (("left", 0, 10), ("right", W - 10, W)):
        for bottom, top in ((10, 32), (H - 32, H - 10)):
            region = dict(
                normal_axis=1,
                plane_mm=13,
                min_mm=[low, bottom],
                max_mm=[high, top],
                part_ids=[f"front-perimeter-{side}-stop"],
            )
            assert check_barrier_region(shapes, region)["status"] == "pass"
    region = dict(
        normal_axis=1,
        plane_mm=13,
        min_mm=[0, H - 10],
        max_mm=[18, H - 3],
        part_ids=["front-perimeter-top-stop"],
    )
    assert check_barrier_region(shapes, region)["status"] == "pass"


def test_glass_target_applies_to_every_glass_pane_and_preserves_default_bifolds():
    m = build_model({"bifold_material": "glass"})
    glass = [p for p in m["parts"] if p["material"] == "glass"]
    assert len(glass) == 6
    assert all(p["cut_size_mm"][-1] == 4 for p in glass)
    normal = build_model()
    assert normal["parameters"]["bifold_material"] == "polycarbonate"
    assert all(p["size"][1] == 4 for p in normal["parts"] if p["material"] == "polycarbonate")

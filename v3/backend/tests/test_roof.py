import csv
import io
import itertools

import pytest
from enclosure.core import build_model, build_shapes
from enclosure.exports import export_file
from enclosure.verification import check_barrier_region


@pytest.mark.parametrize(
    "params",
    [
        None,
        {"width_mm": 1300, "depth_mm": 1300, "hose_diameter_mm": 200},
        {"width_mm": 2500, "depth_mm": 2500, "hose_diameter_mm": 200},
    ],
)
def test_six_panels_and_supports_fit_without_crossed_extrusions(params):
    m = build_model(params)
    roof = m["roof_layout"]
    by = {p["id"]: p for p in m["parts"]}
    ids = (
        roof["panel_ids"]
        + roof["centre_support_ids"]
        + ["beam-roof-1", "beam-roof-2", "rail-front-top", "rail-back-top"]
    )
    s = build_shapes({"parts": [by[i] for i in ids]})
    assert len(roof["panel_ids"]) == 6 and len(roof["centre_support_ids"]) == 3
    for a, b in itertools.combinations(ids, 2):
        assert s[a].intersect(s[b]).Volume() < 1e-5, (a, b)
    import cadquery as cq

    x, y = roof["hose_centre_mm"]
    radius = (m["parameters"]["hose_diameter_mm"] + 50) / 2
    passage = cq.Solid.makeCylinder(radius, 70, cq.Vector(x, y, m["parameters"]["height_mm"] - 10))
    for pid in roof["centre_support_ids"] + ["beam-roof-1", "beam-roof-2"]:
        assert passage.intersect(s[pid]).Volume() < 1e-5
    panel = by[roof["hose_panel_id"]]
    assert 2 * radius < min(panel["size"][:2])
    for pid in roof["centre_support_ids"]:
        assert by[pid]["product_code"] == "AST03006006"
        assert s[pid].BoundingBox().zmax == pytest.approx(m["parameters"]["height_mm"] + 30)
        joints = [j for j in m["joints"] if j["part_a"] == pid]
        assert len(joints) == 2
        for j in joints:
            assert j["connector_ids"]
            assert s[pid].distance(s[j["part_b"]]) < 1e-5
    for bay in ("front", "middle", "rear"):
        assert s[f"panel-roof-left-{bay}"].distance(s[f"panel-roof-right-{bay}"]) == pytest.approx(
            2
        )
    for side in ("left", "right"):
        for a, b in (("front", "middle"), ("middle", "rear")):
            assert s[f"panel-roof-{side}-{a}"].distance(
                s[f"panel-roof-{side}-{b}"]
            ) == pytest.approx(2)


def test_panel_gasket_loops_are_continuous_and_fixings_stay_outside():
    import cadquery as cq

    m = build_model()
    roof = m["roof_layout"]
    entry = next(e for e in m["containment"] if e["id"] == "roof-frame-seal")
    ids = roof["panel_ids"] + entry["part_ids"]
    ids += [
        p["id"]
        for p in m["parts"]
        if p["assembly"] == "roof"
        or p["id"].endswith("-top")
        or p["id"] in m["roof_layout"]["gasket"]["corner_post_ids"]
    ]
    s = build_shapes({"parts": [p for p in m["parts"] if p["id"] in ids]})
    h = m["parameters"]["height_mm"]
    supports = [p["id"] for p in m["parts"] if p["id"] in s and p["category"] == "extrusion"]
    for loop in roof["gasket_loops"]:
        panel = s[loop["panel_id"]]
        assert len(loop["gasket_ids"]) == 4
        for pid in loop["gasket_ids"]:
            assert panel.distance(s[pid]) < 1e-5
            assert panel.intersect(s[pid]).Volume() < 1e-5
            # Long runs bear on actual metal. At the four outer corners the
            # loop crosses the open post end section: explicitly unvalidated.
            probe = s[pid].translate((0, 0, -0.01))
            thin = (
                cq.Workplane("XY").box(10000, 10000, 0.01).translate((0, 0, h + 30 - 0.005)).val()
            )
            unsupported = probe.intersect(thin)
            for q in supports:
                if unsupported.Volume() < 1e-7:
                    break
                unsupported = unsupported.cut(s[q])
            for post_id in roof["gasket"]["corner_post_ids"]:
                bb = s[post_id].BoundingBox()
                end = (
                    cq.Workplane("XY")
                    .box(30, 30, 0.1)
                    .translate(((bb.xmin + bb.xmax) / 2, (bb.ymin + bb.ymax) / 2, h + 30))
                    .val()
                )
                if unsupported.Volume() < 1e-7:
                    break
                unsupported = unsupported.cut(end)
            # Butt interfaces meet a 2 mm outside radius on the cross-member.
            # Bound this local bridging exception to actual member junctions.
            w, d = (m["parameters"][k] for k in ("width_mm", "depth_mm"))
            junctions = [
                (w / 2, y, 60, 4)
                for y in (0, d / 3 - 30, d / 3 + 30, 2 * d / 3 - 30, 2 * d / 3 + 30, d)
            ]
            junctions += [(x, y, 4, 60) for x in (0, w) for y in (d / 3, 2 * d / 3)]
            for x, y, dx, dy in junctions:
                if unsupported.Volume() < 1e-7:
                    break
                rounded_joint = cq.Workplane("XY").box(dx, dy, 0.1).translate((x, y, h + 30)).val()
                unsupported = unsupported.cut(rounded_joint)
            assert unsupported.Volume() < 1e-5
    for region in entry["coverage_regions"]:
        assert check_barrier_region(s, region, 1, 0.5)["status"] == "pass"
    missing = roof["gasket_loops"][0]["gasket_ids"][2]
    broken = {k: v for k, v in s.items() if k != missing}
    assert any(
        check_barrier_region(broken, r, 1, 0.5)["status"] == "fail"
        for r in entry["coverage_regions"]
    )
    # A notch at a butt corner must fail too, not just a missing whole strip.
    corner_id = roof["gasket_loops"][0]["gasket_ids"][0]
    bounds = s[corner_id].BoundingBox()
    notch = (
        cq.Workplane("XY").box(3, 20, 10).translate((bounds.xmin + 4, bounds.ymax, h + 31)).val()
    )
    broken = dict(s, **{corner_id: s[corner_id].cut(notch)})
    assert any(
        check_barrier_region(broken, r, 1, 0.5)["status"] == "fail"
        for r in entry["coverage_regions"]
    )
    for clamp in roof["clamps"]:
        x, y = clamp["centre_mm"]
        passage = cq.Solid.makeCylinder(3.5, 30, cq.Vector(x, y, h + 20))
        for pid in roof["panel_ids"] + entry["part_ids"]:
            assert passage.intersect(s[pid]).Volume() < 1e-5, (clamp["part_id"], pid)
        assert len(clamp["panel_ids"]) == 1
        assert clamp["kind"] == "individual"
        for pid in clamp["panel_ids"]:
            assert s[clamp["part_id"]].distance(s[pid]) < 1e-5
            assert s[clamp["part_id"]].intersect(s[pid]).Volume() < 1e-5


def test_individual_fixing_schedule_and_full_bores_follow_parameter_changes():
    for params in (
        None,
        {"width_mm": 1300, "depth_mm": 1300},
        {"width_mm": 2500, "depth_mm": 2500, "panel_thickness_mm": 18},
    ):
        m = build_model(params)
        roof = m["roof_layout"]
        by = {p["id"]: p for p in m["parts"]}
        schedule = {p["product_code"]: p for p in roof["hardware_schedule"]}
        assert schedule["3403092"]["quantity"] == len(roof["clamps"])
        assert schedule["BTN08M6"]["quantity"] == len(roof["clamps"]) + 12
        for pid in roof["panel_ids"]:
            attached = [c for c in roof["clamps"] if pid in c["panel_ids"]]
            assert attached and all(c["panel_ids"] == [pid] for c in attached)
            holes = [q for q in by[pid]["holes"] if q["diameter_mm"] == 7]
            assert len(holes) == len(attached)
            sx, sy = by[pid]["size"][:2]
            for hole in holes:
                assert 3.5 < hole["x_mm"] < sx - 3.5
                assert 3.5 < hole["y_mm"] < sy - 3.5
        assert len(roof["internal_support_ids"]) == 5
        for pid in roof["internal_support_ids"]:
            assert by[pid]["product_code"] == "AST03006006"
            assert by[pid]["size"][2] == 30
        assert not any(
            "PREPARED" in (p.get("product_code") or "")
            for p in m["parts"]
            if p["assembly"] == "roof"
        )


def test_joining_hardware_contacts_actual_members():
    m = build_model()
    ids = [
        p["id"]
        for p in m["parts"]
        if p["assembly"] == "roof" or p["id"] in ("rail-front-top", "rail-back-top")
    ]
    s = build_shapes({"parts": [p for p in m["parts"] if p["id"] in ids]})
    for joint in m["joints"]:
        if not joint["part_a"].startswith("beam-roof-centre-"):
            continue
        connector = s[joint["connector_ids"][0]]
        for pid in (joint["part_a"], joint["part_b"]):
            assert connector.distance(s[pid]) < 1e-5
            assert connector.intersect(s[pid]).Volume() < 1e-5


def test_hose_opening_clear_of_structure_and_cut_list_has_six_panels():
    import cadquery as cq

    m = build_model()
    layout = m["roof_layout"]
    by = {p["id"]: p for p in m["parts"]}
    assert layout["hose_panel_id"] == "panel-roof-left-middle"
    x, y = layout["hose_centre_mm"]
    h = m["parameters"]["height_mm"]
    ids = ["beam-roof-1", "beam-roof-2"] + layout["centre_support_ids"]
    s = build_shapes({"parts": [by[i] for i in ids]})
    passage = cq.Solid.makeCylinder(75, 70, cq.Vector(x, y, h - 10))
    assert all(passage.intersect(shape).Volume() < 1e-5 for shape in s.values())
    data, _, _ = export_file("csv", m, {"revision": m["revision"], "order_ready": False}, {})
    rows = {r["part_id"]: r for r in csv.DictReader(io.StringIO(data.decode("utf-8-sig")))}
    assert "panel-roof" not in rows
    for pid in layout["panel_ids"]:
        expected = 547.6666666667 if "middle" in pid else 578.6666666667
        assert float(rows[pid]["width_mm"]) == 866
        assert float(rows[pid]["height_mm"]) == pytest.approx(expected)
        assert float(rows[pid]["thickness_mm"]) == 6


def test_candidate_screw_shanks_clear_slot_floors_and_longer_screws_do_not():
    import cadquery as cq

    m = build_model()
    w, d, h = (m["parameters"][k] for k in ("width_mm", "depth_mm", "height_mm"))
    ids = ["rail-front-top", "beam-roof-centre-1", "beam-roof-1"]
    shapes = build_shapes({"parts": [p for p in m["parts"] if p["id"] in ids]})
    under_head = h + 30 + 2 + 6 + 1.3
    for pid, x, y in ((ids[0], 60, -15), (ids[1], w / 2 - 15, 100), (ids[2], 100, d / 3 - 15)):
        for length in (16, 18, 20):
            shank = cq.Solid.makeCylinder(3, length, cq.Vector(x, y, under_head - length))
            overlap = shank.intersect(shapes[pid]).Volume()
            assert (overlap < 1e-5) == (length == 16)
    # Six mm purchased bracket leg plus 1.6 mm ISO 7089 washer; test member clearance independently of
    # unresolved nut threads and head seating. Longer screws bottom out.
    for length in (14, 16):
        shank = cq.Solid.makeCylinder(
            3, length, cq.Vector(w / 2 + 30 + 6 + 1.6 - length, 14, h + 15), cq.Vector(1, 0, 0)
        )
        overlap = shank.intersect(shapes["beam-roof-centre-1"]).Volume()
        assert (overlap < 1e-5) == (length == 14)


def test_panels_lift_without_touching_neighbor_fasteners():
    import cadquery as cq

    m = build_model()
    r = m["roof_layout"]
    by = {p["id"]: p for p in m["parts"]}
    clamp_ids = [c["part_id"] for c in r["clamps"]]
    shapes = build_shapes({"parts": [by[i] for i in clamp_ids]})
    for pid in r["panel_ids"]:
        panel = by[pid]
        sx, sy, sz = panel["size"]
        x, y, z = panel["position"]
        # Conservative full rectangular upward sweep; ignore this panel's own
        # fixings because those are removed. Keep every neighboring washer.
        sweep = cq.Workplane("XY").box(sx, sy, sz + 50).translate((x, y, z + 25)).val()
        for c in r["clamps"]:
            if pid not in c["panel_ids"]:
                assert sweep.intersect(shapes[c["part_id"]]).Volume() < 1e-5
        owned = [by[c["part_id"]] for c in r["clamps"] if c["panel_ids"] == [pid]]
        assert len(owned) == 14
    # Slots are distinct, and staggered washers cannot contact each other.
    for a, b in itertools.combinations(r["clamps"], 2):
        ax, ay = a["centre_mm"]
        bx, by_ = b["centre_mm"]
        assert (ax - bx) ** 2 + (ay - by_) ** 2 > 30**2

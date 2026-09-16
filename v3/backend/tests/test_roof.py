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
        assert by[pid]["product_code"] == "AST03003004"
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


def test_each_panel_has_four_gasket_bearings_and_continuous_seams():
    m = build_model()
    entry = next(e for e in m["containment"] if e["id"] == "roof-frame-seal")
    ids = m["roof_layout"]["panel_ids"] + entry["part_ids"]
    s = build_shapes({"parts": [p for p in m["parts"] if p["id"] in ids]})
    for side in ("left", "right"):
        for i, bay in enumerate(("front", "middle", "rear")):
            panel = s[f"panel-roof-{side}-{bay}"]
            bearings = [
                f"roof-perimeter-gasket-{2 if side == 'left' else 3}",
                f"roof-centre-gasket-{i + 1}",
                "roof-perimeter-gasket-0" if i == 0 else f"roof-crossbar-gasket-{i}",
                "roof-perimeter-gasket-1" if i == 2 else f"roof-crossbar-gasket-{i + 1}",
            ]
            for pid in bearings:
                assert panel.distance(s[pid]) < 1e-5
                assert panel.intersect(s[pid]).Volume() < 1e-5
    for region in entry["coverage_regions"]:
        assert (
            check_barrier_region(s, region, region["required_overlap_mm"], 0.5)["status"] == "pass"
        )
    broken = {k: v for k, v in s.items() if k != "roof-centre-gasket-2"}
    assert any(
        check_barrier_region(broken, r, r["required_overlap_mm"], 0.5)["status"] == "fail"
        for r in entry["coverage_regions"]
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

import pytest
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.glazing import panel_axis


def test_default_lexan_cuts_and_thermal_allowances():
    model = build_model()
    panes = [p for p in model["parts"] if p.get("glazing") and p["material"] == "polycarbonate"]
    assert [p["cut_size_mm"] for p in panes] == [
        [330.75, 628, 4],
        [370.75, 628, 4],
        [293.5, 628, 4],
        [333.5, 628, 4],
    ]
    for p in panes:
        for axis in p["glazing"]["axes"]:
            assert axis["engagement_mm"] == 3
            assert axis["edge_reserve_mm"] == 2
            assert axis["minimum_engagement_bound_mm"] > 1
            assert 2 * axis["edge_reserve_mm"] > axis["thermal_growth_bound_mm"] + 2
        assert not p["glazing"]["approved"]
        assert not any(
            q["id"].startswith(p["id"]) and "retainer" in q["id"] for q in model["parts"]
        )
    assert len([p for p in model["parts"] if p.get("product_code") == "FSP08"]) == 24
    assert any(
        a["id"] == "bifold-slot-glazing" and not a["confirmed"] for a in model["assumptions"]
    )


def test_thermal_sizing_changes_with_span_and_cut_tolerance():
    assert panel_axis(1200, 0.5)["edge_reserve_mm"] > panel_axis(600, 0.5)["edge_reserve_mm"]
    assert panel_axis(600, 1.5)["cut_mm"] < panel_axis(600, 0.5)["cut_mm"]


@pytest.mark.parametrize("fraction", [0, 0.5, 1])
def test_inserts_and_lexan_fit_actual_frame_and_animate(fraction):
    model = pose_model(build_model(), {"left-rear": fraction, "back-right": fraction})
    for did in ("left-rear", "back-right"):
        for leaf in ("a", "b"):
            prefix = f"{did}-{leaf}-"
            parts = [p for p in model["parts"] if p["id"].startswith(prefix)]
            shapes = build_shapes({**model, "parts": parts})
            panel = shapes[prefix + "infill"]
            frames = [shapes[prefix + s] for s in ("stile-a", "stile-b", "rail-low", "rail-high")]
            for frame in frames:
                assert panel.intersect(frame).Volume() < 1e-5
            inserts = [shapes[p["id"]] for p in parts if p.get("product_code") == "FSP08"]
            for i, first in enumerate(inserts):
                for second in inserts[i + 1 :]:
                    assert first.intersect(second).Volume() < 1e-5
            for p in parts:
                if p.get("product_code") != "FSP08":
                    continue
                gasket = shapes[p["id"]]
                assert gasket.isValid()
                assert len(gasket.Solids()) == 1
                assert "cad_asset" not in p
                assert gasket.intersect(panel).Volume() < 1e-5
                assert gasket.distance(panel) < 1e-5
                for frame in frames:
                    assert gasket.intersect(frame).Volume() < 1e-5


def test_other_bifold_materials_keep_retention_and_front_uses_slot_holder():
    model = build_model({"bifold_material": "glass"})
    assert not any(
        p.get("glazing") for p in model["parts"] if p["assembly"] in ("left-rear", "back-right")
    )
    assert any(p["id"] == "front-left-a-infill-left-slot-gasket" for p in model["parts"])


def test_quote_csv_uses_revised_cuts_and_keeps_material_warning():
    import csv
    import io

    from enclosure.exports import export_file

    model = build_model()
    report = {"revision": model["revision"], "order_ready": False}
    data, _, _ = export_file("csv", model, report, {})
    rows = {r["part_id"]: r for r in csv.DictReader(io.StringIO(data.decode("utf-8-sig")))}
    pane = rows["left-rear-a-infill"]
    assert float(pane["width_mm"]) == 330.75
    assert float(pane["height_mm"]) == 628
    assert "PVC compound compatibility" in pane["machining"]
    assert "NOT RELEASED" in pane["release_status"]
    gasket = rows["left-rear-a-infill-left-slot-gasket"]
    assert gasket["product_code"] == "FSP08"
    assert "drawing-based" in gasket["geometry_fidelity"]

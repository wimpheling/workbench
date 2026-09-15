"""Native checks for stock metal load paths, clearances and assembly stages."""

import pytest
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.verification import check_solid_pair


def screen_rigid_parts(parameters, fraction):
    m = pose_model(build_model(parameters), {"left-rear": fraction, "back-right": fraction})
    parts = [p for p in m["parts"] if not p.get("deformable") and p.get("physical", True)]
    shapes = build_shapes({**m, "parts": parts})
    for p in parts:
        if not p.get("geometry", {}).get("kind", "").startswith("stock-"):
            continue
        a = shapes[p["id"]]
        assert a.isValid() and len(a.Solids()) == 1
        for q in parts:
            if q["id"] == p["id"] or q["category"].endswith("envelope"):
                continue
            result = check_solid_pair(a, shapes[q["id"]])
            assert result["status"] != "fail", (fraction, p["id"], q["id"], result)


@pytest.mark.parametrize("fraction", [0, 0.001, 0.01, 0.05, 0.25, 0.5, 0.75, 1])
def test_stock_parts_and_fixings_clear_rigid_assembly(fraction):
    screen_rigid_parts(None, fraction)


@pytest.mark.parametrize("fraction", [0, 0.5, 1])
@pytest.mark.parametrize(
    "parameters",
    [
        dict(depth_mm=1300, back_opening_width_mm=650, height_mm=650),
        dict(depth_mm=2500, back_opening_width_mm=800, height_mm=1500),
    ],
)
def test_stock_at_dimension_extremes(parameters, fraction):
    screen_rigid_parts(parameters, fraction)


def test_stock_inventory_and_mounting_contacts():
    m = build_model()
    by = {p["id"]: p for p in m["parts"]}
    assert not any(p.get("product_code") == "BF-CARRIER-METAL" for p in m["parts"])
    assert not any(p["id"].endswith("carrier-shelf") for p in m["parts"])
    assert sum(p.get("product_code") == "DIN7991-M4x40" for p in m["parts"]) == 8
    assert sum(p.get("product_code") == "M6x14-CARRIER-ROOT-WASHER" for p in m["parts"]) == 4
    for did in ("left-rear", "back-right"):
        ids = [did + "-carrier-upright", did + "-b-stile-b", did + "-carrier-spacing-ring"]
        shapes = build_shapes({**m, "parts": [by[i] for i in ids]})
        # A thinner candidate that merely clears can leave a mounting gap.
        for target in ids[1:]:
            assert shapes[ids[0]].distance(shapes[target]) < 1e-5
            assert shapes[ids[0]].intersect(shapes[target]).Volume() < 1e-5
        carrier = by[ids[0]]
        assert carrier["material"] == "S275JR steel" and carrier["quantity"] == 1
        assert len(carrier["holes"]) == 3
        schedule = [r for r in m["bifold_completion"]["fastener_schedule"] if r["assembly"] == did]
        assert sum(r["quantity"] for r in schedule if r["screw"].startswith("M4 x 35")) == 26
        assert sum(r["quantity"] for r in schedule if r["screw"].startswith("M4 x 40")) == 4


def test_flush_end_heads_and_nominal_tool_routes():
    import cadquery as cq
    from enclosure.core import _rotate

    m = pose_model(build_model(), {"left-rear": 0.5, "back-right": 0.5})
    shapes = build_shapes(m)
    for p in m["parts"]:
        kind = p.get("geometry", {}).get("kind")
        if kind == "stock-end-screw":
            origin = [*p["position"][:2], p["position"][2] - 20]
            direction = (0, 0, -1)
            radius = 2.5
            carrier = shapes[p["assembly"] + "-carrier-upright"]
            assert shapes[p["id"]].distance(carrier) >= 3.1 - 1e-5
        elif kind == "stock-carrier-screw":
            offset = _rotate([0, -10, 0], p["rotation_deg"])
            origin = [p["position"][i] + offset[i] for i in range(3)]
            direction = _rotate([0, -1, 0], p["rotation_deg"])
            radius = 3.5
        else:
            continue
        driver = cq.Solid.makeCylinder(radius, 80, cq.Vector(*origin), cq.Vector(*direction))
        for q in m["parts"]:
            if q["id"] == p["id"] or q.get("deformable") or q["category"].endswith("envelope"):
                continue
            assert driver.intersect(shapes[q["id"]]).Volume() < 1e-5, (p["id"], q["id"])

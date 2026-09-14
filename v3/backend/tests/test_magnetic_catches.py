import pytest
from enclosure.magnetic_catches import ASSET, catch_component


def test_correct_vendor_variant_and_components():
    assert "4470-50-C2-L3-SR" in ASSET.read_text()
    shapes = {}
    for component, expected_size in (("magnet", [50, 10, 30.5]), ("strike", [28, 12, 38])):
        shape, centre, size = catch_component(component)
        assert size == pytest.approx(expected_size)
        assert shape.isValid() and len(shape.Solids()) == 1
        bb = shape.BoundingBox()
        for axis in "xyz":
            assert getattr(bb, axis + "min") == pytest.approx(-getattr(bb, axis + "max"))
        shapes[component] = shape.translate(tuple(centre))
    assert shapes["magnet"].distance(shapes["strike"]) < 1e-5
    assert shapes["magnet"].intersect(shapes["strike"]).Volume() < 1e-5


def test_unknown_component_rejected():
    with pytest.raises(ValueError):
        catch_component("A1-L2")


def test_parked_catches_are_omitted_from_active_design():
    from enclosure.core import build_model
    from enclosure.exports import parked_catch_print_files

    model = build_model()
    assert not any("-park-catch-" in p["id"] for p in model["parts"])
    assert not any(p.get("cad_asset") == ASSET.name for p in model["parts"])
    assert parked_catch_print_files(model) == {}
    requirements = model["bifold_completion"]["catch_requirements"]
    assert sum(r["quantity"] for r in requirements) == 0
    assert all("-closed-" in r["id"] for r in requirements)
    assert sum(p.get("product_code") == "BF-PARK-88" for p in model["parts"]) == 4
    assert not any(
        "park-catch" in r["part_id"] for r in model["bifold_completion"]["fastener_schedule"]
    )

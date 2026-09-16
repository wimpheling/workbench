import pytest
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.header_layout import point_deflection
from enclosure.profiles import extrusion
from enclosure.verification import check_solid_pair


def test_header_sections_are_unscaled_and_roof_is_level():
    m = build_model()
    by = {p["id"]: p for p in m["parts"]}
    ids = ["rail-front-top", "rail-left-top", "rail-back-top", "rail-right-top"]
    shapes = build_shapes({"parts": [by[i] for i in ids]})
    for pid in ids:
        p = by[pid]
        bb = shapes[pid].BoundingBox()
        assert [bb.xlen, bb.ylen, bb.zlen] == pytest.approx(p["size"], abs=1e-5)
        assert bb.zmax == pytest.approx(m["parameters"]["height_mm"] + 30)
        assert shapes[pid].Volume() == pytest.approx(
            extrusion(p["cut_length_mm"], p["length_axis"], p["product_code"]).Volume()
        )
        assert not p.get("cutouts")
    assert by["rail-front-top"]["size"][1:] == [30, 60]
    assert m["doors"][0]["opening_height_mm"] == 710


@pytest.mark.parametrize("fraction", [0, 0.25, 0.5, 0.75, 1])
def test_adapters_and_hood_spacers_clear_assembly_and_contact_header(fraction):
    m = pose_model(build_model(), {"left-rear": fraction, "back-right": fraction})
    parts = [p for p in m["parts"] if p.get("physical", True) and not p.get("deformable")]
    shapes = build_shapes(m)
    adapters = [p for p in parts if "header-adapter-" in p["id"] or "head-hood-spacer-" in p["id"]]
    assert len(adapters) == 16
    for p in adapters:
        for q in parts:
            if p["id"] == q["id"]:
                continue
            assert check_solid_pair(shapes[p["id"]], shapes[q["id"]])["status"] != "fail", (
                p["id"],
                q["id"],
            )
        header = "rail-left-top" if p["id"].startswith("left-rear") else "rail-back-top"
        assert shapes[p["id"]].distance(shapes[header]) < 1e-5


def test_beam_screen_exposes_load_and_stiffness_limits():
    m = build_model()
    layout = m["header_layout"]
    cases = layout["front_beam_screen"]["cases"]
    assert cases[0]["centre_100n_deflection_mm"] == pytest.approx(4.88402676)
    assert cases[1]["centre_100n_deflection_mm"] == pytest.approx(0.71174259)
    assert point_deflection(200, 1674, 199000) == pytest.approx(
        2 * cases[1]["centre_100n_deflection_mm"]
    )
    assert layout["guide_beam_screen"][0]["centre_100n_deflection_mm"] > 0.5
    assert not next(a for a in m["assumptions"] if a["id"] == "frame-header-loads")["confirmed"]

"""Active corner evidence and removal of both bottom installations."""

import pytest
from enclosure.core import build_model, build_shapes


def test_bottom_and_catch_removal_preserves_containment_obligations():
    from enclosure.closed_catches import engagement_checks
    from enclosure.exports import closed_catch_print_files

    m = build_model()
    assert m["bifold_completion"]["catch_requirements"] == []
    assert closed_catch_print_files(m) == {}
    assert engagement_checks(m, {}) == []
    assert not any("-closed-catch-" in p["id"] for p in m["parts"])
    assert not any(
        "-closed-catch-" in p["part_id"] for p in m["bifold_completion"]["fastener_schedule"]
    )
    for did in ("left-rear", "back-right"):
        assert not any(p["id"].startswith(did + "-perimeter-bottom-") for p in m["parts"])
        entry = next(e for e in m["containment"] if e["id"] == did + "-perimeter-bottom")
        assert entry["kind"] == "intentional-bottom-gap"
        assert "coverage_regions" not in entry
    assert any(p["id"] == "front-perimeter-bottom-seal" for p in m["parts"])


def test_corner_gasket_capture_and_hinge_station():
    m = build_model()
    by = {p["id"]: p for p in m["parts"]}
    ids = [
        p
        for p in m["parts"]
        if p.get("product_code") == "CJP3030L"
        or p.get("geometry", {}).get("kind") == "fsp08-study"
        or p["material"] == "polycarbonate"
    ]
    shapes = build_shapes({**m, "parts": ids})
    for p in ids:
        if p.get("product_code") != "CJP3030L":
            continue
        assert len(p["holes"]) == 5 and "cad_asset" not in p
        for q in ids:
            if q.get("product_code") == "CJP3030L":
                continue
            assert shapes[p["id"]].intersect(shapes[q["id"]]).Volume() < 1e-5
    for did in ("left-rear", "back-right"):
        assert by[did + "-interleaf-hinge-0-pin"]["position"][2] - by[did + "-frame-hinge-0-pin"][
            "position"
        ][2] == pytest.approx(25)
        assert by[did + "-interleaf-hinge-2-pin"]["position"][2] - by[did + "-frame-hinge-2-pin"][
            "position"
        ][2] == pytest.approx(-25)

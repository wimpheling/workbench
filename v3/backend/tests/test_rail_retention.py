import pytest
from enclosure.core import _rotate, build_model, build_shapes, pose_model


def test_continuous_metal_retention_inventory_and_stack():
    model = build_model()
    for did in ("left-rear", "back-right"):
        parts = {p["id"]: p for p in model["parts"]}
        keepers = [p for p in parts.values() if p["id"].startswith(did + "-keeper-strip")]
        assert len(keepers) == 2
        assert all(p["material"] == "304 stainless steel" for p in keepers)
        assert all(len(p["holes"]) == 15 for p in keepers)
        assert len([p for p in parts if p.startswith(did + "-retention-sleeve")]) == 30
        ids = [
            did + "-retention-sleeve-1-0--1",
            did + "-retention-bridge-washer-1-0--1",
            did + "-keeper-strip-continuous--1",
            "rail-left-top" if did == "left-rear" else "rail-back-top",
        ]
        shapes = build_shapes({**model, "parts": [parts[i] for i in ids]})
        for a, b in ((0, 1), (0, 2), (1, 3)):
            assert shapes[ids[a]].distance(shapes[ids[b]]) < 1e-5
            assert shapes[ids[a]].intersect(shapes[ids[b]]).Volume() < 1e-5


@pytest.mark.parametrize("fraction", [0, 0.25, 0.5, 0.75, 1])
def test_retention_clears_normal_travel_and_blocks_drop(fraction):
    model = pose_model(build_model(), {"left-rear": fraction, "back-right": fraction})
    for did in ("left-rear", "back-right"):
        selected = [
            p
            for p in model["parts"]
            if p["assembly"] == did
            and (
                p.get("motion_leaf") in ("slider", "b")
                or "keeper-strip" in p["id"]
                or "rail-end-stop" in p["id"]
            )
        ]
        shapes = build_shapes({**model, "parts": selected})
        fixed = [p for p in selected if "keeper-strip" in p["id"] or "rail-end-stop" in p["id"]]
        moving = [p for p in selected if p.get("motion_leaf") in ("slider", "b")]
        for a in fixed:
            for b in moving:
                assert shapes[a["id"]].intersect(shapes[b["id"]]).Volume() < 1e-5
        dropped = shapes[did + "-keeper-washer"].translate((0, 0, -4))
        assert all(
            dropped.intersect(shapes[p["id"]]).Volume() > 0
            for p in fixed
            if "keeper-strip" in p["id"]
        )


@pytest.mark.parametrize("did", ["left-rear", "back-right"])
def test_end_bars_block_roller_overtravel(did):
    for fraction, end, delta in ((0, "closed", 8), (1, "park", -12)):
        model = pose_model(build_model(), {did: fraction})
        door = next(d for d in model["doors"] if d["id"] == did)
        ids = [did + "-carriage", did + "-rail-end-stop-" + end]
        shapes = build_shapes({**model, "parts": [p for p in model["parts"] if p["id"] in ids]})
        assert shapes[ids[0]].intersect(shapes[ids[1]]).Volume() < 1e-5
        overshot = shapes[ids[0]].translate(tuple(_rotate([delta, 0, 0], door["base_deg"])))
        assert overshot.intersect(shapes[ids[1]]).Volume() > 1

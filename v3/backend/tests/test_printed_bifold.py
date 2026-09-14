import json
import math
from pathlib import Path

import pytest
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.verification import swept_box


@pytest.mark.parametrize("did", ["left-rear", "back-right"])
def test_vendor_roller_bushes_preserve_solids_and_clamp_only_inner_race(did):
    import cadquery as cq
    from enclosure.profiles import ASSET

    model = build_model()
    suffixes = (
        "carriage",
        "bearing-bush-upper",
        "bearing-bush-lower",
        "axle",
        "axle-head",
        "keeper-washer",
    )
    for fraction in (0, 0.5, 1):
        posed = pose_model(model, {did: fraction})
        parts = {
            p["id"].removeprefix(did + "-"): p
            for p in posed["parts"]
            if p["id"] in [did + "-" + suffix for suffix in suffixes]
        }
        built = build_shapes({**posed, "parts": list(parts.values())})
        shapes = {suffix: built[p["id"]] for suffix, p in parts.items()}
        for suffix in suffixes[:3]:
            p, shape = parts[suffix], shapes[suffix]
            raw = cq.importers.importStep(str(ASSET.parent / p["cad_asset"])).val()
            assert "geometry" not in p  # A generic annulus must not overwrite imported CAD.
            assert p["geometry_fidelity"] == "supplier-step-solid"
            assert shape.Volume() == pytest.approx(raw.Volume())
            assert shape.isValid()
            bb = shape.BoundingBox()
            assert [bb.xlen, bb.ylen, bb.zlen] == pytest.approx(p["size"], abs=1e-5)
        for bush in ("bearing-bush-upper", "bearing-bush-lower"):
            assert shapes[bush].distance(shapes["carriage"]) < 1e-5
            assert shapes[bush].intersect(shapes["carriage"]).Volume() < 1e-5
            assert shapes[bush].intersect(shapes["axle"]).Volume() < 1e-5
        assert shapes["bearing-bush-upper"].distance(shapes["axle-head"]) < 1e-5
        assert shapes["bearing-bush-lower"].distance(shapes["keeper-washer"]) < 1e-5
        assert shapes["bearing-bush-upper"].distance(shapes["bearing-bush-lower"]) == pytest.approx(
            1
        )
        assert shapes["carriage"].distance(shapes["keeper-washer"]) == pytest.approx(2)


def test_wrong_bush_orientation_causes_real_interference():
    model = build_model()
    parts = [
        p
        for p in model["parts"]
        if p["id"] in ("left-rear-carriage", "left-rear-bearing-bush-upper")
    ]
    upper = next(p for p in parts if "bush" in p["id"])
    upper["cad_reversed_axis"] = False
    shapes = build_shapes({**model, "parts": parts})
    assert shapes["left-rear-carriage"].intersect(shapes[upper["id"]]).Volume() > 10


@pytest.mark.parametrize("did", ["left-rear", "back-right"])
@pytest.mark.parametrize("kind", ["frame", "interleaf"])
def test_vendor_hinge_leaves_and_pin_stay_connected_through_travel(did, kind):
    import cadquery as cq
    from enclosure.profiles import ASSET, hinge_component

    source = cq.importers.importStep(str(ASSET.parent / "CFG3030.stp")).val().Solids()
    model = build_model()
    ids = [f"{did}-{kind}-hinge-0-{suffix}" for suffix in ("wing--1", "wing-1", "pin")]
    for fraction in (0, 0.25, 0.5, 0.75, 1):
        posed = pose_model(model, {did: fraction})
        parts = [p for p in posed["parts"] if p["id"] in ids]
        assert len(parts) == 3
        shapes = build_shapes({**posed, "parts": parts})
        pin = shapes[ids[2]]
        for p in parts:
            assert p["cad_asset"] == "CFG3030.stp"
            shape, _, _ = hinge_component(p["cad_component"], kind == "frame")
            assert shapes[p["id"]].Volume() == pytest.approx(shape.Volume())
            assert shapes[p["id"]].isValid()
        assert pin.Volume() == pytest.approx(source[1].Volume())
        for pid in ids[:2]:
            # Actual knuckle bores remain on the real pin, not merely nearby boxes.
            assert shapes[pid].distance(pin) < 1e-5
            assert shapes[pid].intersect(pin).Volume() < 1e-5
        assert shapes[ids[0]].intersect(shapes[ids[1]]).Volume() < 1e-5


def test_browser_fixture_is_current_backend_output():
    samples = json.loads(
        (
            Path(__file__).resolve().parents[2] / "frontend/src/printedBifold.fixture.json"
        ).read_text()
    )
    model = build_model()
    doors = {d["id"]: d for d in model["doors"]}
    parts = {p["id"]: p for p in model["parts"]}
    for sample in samples:
        did = sample["door"]["id"]
        for key, value in sample["door"].items():
            assert doors[did][key] == value
        part_id = did + (
            "-carriage" if sample["leaf"] == "slider" else f"-{sample['leaf']}-stile-b"
        )
        assert parts[part_id]["position"] == pytest.approx(sample["closed"])
        posed = pose_model(model, {did: sample["fraction"]})
        current = next(p for p in posed["parts"] if p["id"] == part_id)
        assert current["position"] == pytest.approx(sample["expected"])


def test_revision_c_matches_printed_study_and_jambs():
    model = build_model()
    left, rear = model["doors"][2:]
    assert left["primary_width_mm"] == 384.75
    assert left["secondary_width_mm"] == 424.75
    assert rear["primary_width_mm"] == 347.5
    assert rear["secondary_width_mm"] == 387.5
    assert rear["opening_width_mm"] == 750
    assert rear["leaf_height_mm"] == 682
    assert rear["reserved_sweep_mm"] == pytest.approx(372.80085, abs=1e-4)
    assert left["reserved_sweep_mm"] == pytest.approx(410.01770, abs=1e-4)
    assert rear["guide"]["module_length_mm"] == pytest.approx(133.84)
    assert left["guide"]["module_length_mm"] == pytest.approx(147.74)
    assert all(d["guide"]["module_count"] == 5 for d in (left, rear))
    parts = {p["id"]: p for p in model["parts"]}
    assert parts["post-back-middle"]["position"][0] + 15 == 1674 - 750
    assert parts["post-left-middle"]["position"][1] + 15 == 1649 / 2
    assert parts["back-right-b-infill"]["material"] == "polycarbonate"
    assert parts["back-right-b-infill"]["size"][1] == 4
    assert not any("guide-adapter" in p["id"] for p in model["parts"])
    assert not any(p.get("product_code") == "GSD082.3000KIT" for p in model["parts"])
    hinges = [p for p in model["parts"] if p.get("product_code") == "CFG.30/30 SH-6-C33"]
    assert sum(p["quantity"] for p in hinges) == 12


def test_rail_section_matches_real_print_and_wide_header():
    model = build_model()
    wanted = {"left-rear-track", "rail-left-top", "rail-back-top"}
    parts = [p for p in model["parts"] if p["id"] in wanted]
    shapes = build_shapes({**model, "parts": parts})
    assert all(s.isValid() and s.Volume() > 0 for s in shapes.values())
    left = shapes["rail-left-top"].BoundingBox()
    rear = shapes["rail-back-top"].BoundingBox()
    assert (left.xlen, left.zlen) == pytest.approx((60, 30))
    assert (rear.ylen, rear.zlen) == pytest.approx((60, 30))
    body = next(p for p in parts if p["id"] == "left-rear-track")
    # Channel, bolt holes and key recesses are cut, not displayed as a solid bar.
    assert shapes[body["id"]].Volume() < body["size"][0] * (46 * 25 - 23 * 21)


@pytest.mark.parametrize("rear_width,depth", [(650, 1300), (750, 1649), (800, 2500)])
def test_nondefault_dimensions_keep_guide_and_bounds_valid(rear_width, depth):
    model = build_model({"back_opening_width_mm": rear_width, "depth_mm": depth})
    original = {p["id"]: p for p in model["parts"]}
    for d in model["doors"][2:]:
        bounds = swept_box(original[d["id"] + "-b-stile-b"], d, 0.123, 0.987)
        for f in (0.123, 0.333, 0.667, 0.987):
            posed = pose_model(model, {d["id"]: f})
            door = next(v for v in posed["doors"] if v["id"] == d["id"])
            assert math.dist(
                door["kinematics"]["elbow"], door["kinematics"]["slider"]
            ) == pytest.approx(d["secondary_link_length_mm"])
            body = next(v for v in posed["parts"] if v["id"] == d["id"] + "-b-stile-b")
            actual = swept_box(body, None)
            assert all(
                bounds[0][i] <= actual[0][i] and bounds[1][i] >= actual[1][i] for i in range(3)
            )
        assert d["guide"]["module_length_mm"] + 10 <= 180


def test_new_mechanism_is_not_given_old_native_solver_pass():
    from enclosure.verification import verify

    model = build_model()
    report = verify(model, {})
    checks = {c["id"]: c for c in report["checks"]}
    assert checks["kinematics.native.left-rear"]["status"] == "unknown"
    assert checks["kinematics.native.back-right"]["status"] == "unknown"
    assert not report["order_ready"]


def test_header_relief_removes_real_overlap_without_a_collision_waiver():
    model = build_model()
    parts = [p for p in model["parts"] if p["id"] in ("rail-left-top", "rail-back-top")]
    shapes = build_shapes({**model, "parts": parts})
    assert shapes["rail-left-top"].intersect(shapes["rail-back-top"]).Volume() < 1e-5
    rear = next(p for p in parts if p["id"] == "rail-back-top")
    rear.pop("cutouts")
    uncut = build_shapes({**model, "parts": parts})
    assert uncut["rail-left-top"].intersect(uncut["rail-back-top"]).Volume() > 1000


@pytest.mark.parametrize(
    "did,bracket",
    [
        ("left-rear", "bracket-left-back-bottom-y"),
        ("back-right", "bracket-right-back-bottom-x"),
    ],
)
@pytest.mark.parametrize("material", ["polycarbonate", "glass"])
def test_closed_jamb_connector_and_carrier_clear_real_leaf_solids(did, bracket, material):
    model = build_model({"bifold_material": material})
    parts = {p["id"]: p for p in model["parts"]}
    assert parts[bracket]["cad_asset"] == "CIB08T.step"
    assert not parts[bracket]["mounting_orientation_confirmed"]
    pairs = [
        (bracket, did + "-a-stile-a"),
        (did + "-carrier-upright", did + "-b-retainer-right-in"),
    ]
    # Use the actual inventory name rather than inventing an absent test solid.
    bead = next(
        p["id"]
        for p in model["parts"]
        if p["id"].startswith(did + "-b-")
        and "right" in p["id"]
        and (
            p["id"].endswith("-slot-gasket")
            if material == "polycarbonate"
            else "retainer" in p["id"] and p["id"].endswith("-in")
        )
    )
    pairs[1] = (did + "-carrier-upright", bead)
    wanted = {pid for pair in pairs for pid in pair}
    shapes = build_shapes({**model, "parts": [parts[pid] for pid in wanted]})
    for a, b in pairs:
        assert shapes[a].intersect(shapes[b]).Volume() < 1e-5
    upright = parts[did + "-carrier-upright"]
    assert len(upright["holes"]) == 2
    assert all(h["axis"] == "y" and h["diameter_mm"] == 6.5 for h in upright["holes"])


@pytest.mark.parametrize("did", ["left-rear", "back-right"])
def test_free_stile_clears_rigid_perimeter_through_sampled_travel(did):
    model = build_model()
    fixed = [
        p
        for p in model["parts"]
        if p["id"].startswith(did + "-")
        and (
            p["id"].endswith("-stop") or p["id"].endswith("-backing") or "-closed-stop-" in p["id"]
        )
    ]
    fixed_shapes = build_shapes({**model, "parts": fixed})
    for step in range(21):
        posed = pose_model(model, {did: step / 20})
        stile = next(p for p in posed["parts"] if p["id"] == did + "-b-stile-b")
        shape = build_shapes({**posed, "parts": [stile]})[stile["id"]]
        for pid, barrier in fixed_shapes.items():
            assert shape.intersect(barrier).Volume() < 1e-5, (pid, step)

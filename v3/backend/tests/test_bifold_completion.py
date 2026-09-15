import pytest
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.verification import check_solid_pair


def test_completion_inventory_and_honest_procurement():
    m = build_model()
    parts = {p["id"]: p for p in m["parts"]}
    plates = [
        p
        for p in parts.values()
        if p.get("product_code") == "CJP3030L" and p["assembly"] in ("left-rear", "back-right")
    ]
    assert len(plates) == 16
    assert all(len(p["holes"]) == 5 for p in plates)
    assert (
        len(
            [j for j in m["joints"] if j.get("connector_ids", [""])[0] in {p["id"] for p in plates}]
        )
        == 16
    )
    handles = [p for p in parts.values() if p.get("product_code") == "GHD9008B"]
    assert len(handles) == 4
    assert all("cad_asset" not in p and "drawing-based" in p["geometry_fidelity"] for p in handles)
    assert sum(r["quantity"] for r in m["bifold_completion"]["catch_requirements"]) == 0
    assert all(
        r["status"].startswith("modeled-prototype")
        for r in m["bifold_completion"]["catch_requirements"]
    )
    for did in ("left-rear", "back-right"):
        carrier = [parts[did + "-carrier-upright"]]
        assert sum(p["quantity"] for p in carrier) == 1
        assert all(p["material"] == "S275JR steel" for p in carrier)
        for i in range(2):
            assert len(parts[f"{did}-closed-stop-{i}"]["holes"]) == 2
        screening = next(d for d in m["doors"] if d["id"] == did)["load_screening"]
        assert screening["included_mass_kg"] > 3
        assert screening["closed_frame_moment_Nm"] > screening["closed_interleaf_moment_Nm"] > 0
        assert screening["status"].startswith("partial")


@pytest.mark.parametrize("fraction", [0, 0.25, 0.5, 0.75, 1])
def test_added_hardware_clears_rigid_assembly(fraction):
    m = pose_model(build_model(), {"left-rear": fraction, "back-right": fraction})
    parts = [
        p for p in m["parts"] if not p.get("deformable") and not p["category"].endswith("envelope")
    ]
    shapes = build_shapes({**m, "parts": parts})
    additions = [
        p
        for p in parts
        if p.get("product_code") in ("BF-PARK-88", "M6-WASHER-12", "CJP3030L", "GHD9008B")
        or p["id"]
        in (
            "left-rear-perimeter-top-stop",
            "back-right-perimeter-top-stop",
            "left-rear-head-brush-return",
            "back-right-head-brush-return",
        )
    ]
    for p in additions:
        a = shapes[p["id"]]
        assert a.isValid() and len(a.Solids()) == 1
        for q in parts:
            if q["id"] != p["id"]:
                result = check_solid_pair(a, shapes[q["id"]])
                assert result["status"] != "fail", (fraction, p["id"], q["id"], result)


def test_printed_park_stop_inventory_print_export_and_mounting():
    import json

    import cadquery as cq
    from enclosure.bifold_completion import park_bracket
    from enclosure.exports import parked_stop_print_files

    m = build_model()
    stops = [p for p in m["parts"] if p.get("product_code") == "BF-PARK-88"]
    washers = [p for p in m["parts"] if p.get("product_code") == "M6-WASHER-12"]
    assert len(stops) == 4 and len(washers) == 8
    for p in stops:
        assert p["material"] == "PETG" and "cad_asset" not in p
        assert "prototype" in p["geometry_fidelity"]
        assert "M6 x 16" in p["fastener_schedule"]["screw"]
        assert "slam" in p["machining"]
        assert max(p["size"]) <= 180
    shape, center, size = park_bracket()
    assert shape.isValid() and len(shape.Solids()) == 1
    assert size[2] == pytest.approx(60)
    original = shape.translate(tuple(center))
    for z in (-15, 15):
        hole = cq.Solid.makeCylinder(3.2, 10, cq.Vector(-17.5, -1, z), cq.Vector(0, 1, 0))
        assert original.intersect(hole).Volume() < 1e-5
    s = build_shapes({**m, "parts": stops + washers})
    for washer in washers:
        parent = washer["id"].rsplit("-washer-", 1)[0]
        assert s[washer["id"]].distance(s[parent]) < 1e-5
        assert s[washer["id"]].intersect(s[parent]).Volume() < 1e-5
    files = parked_stop_print_files(m)
    assert len(files["printed-prototypes/BF-PARK-88.stl"]) > 1000
    manifest = json.loads(files["printed-prototypes/BF-PARK-88.json"])
    assert manifest["quantity"] == 4 and manifest["revision"] == m["revision"]
    assert "NOT IMPACT RATED" in manifest["status"]
    assert manifest["dimensions_mm"] == pytest.approx(size)


def test_park_pad_contacts_leaf_and_blocks_further_travel():
    m = pose_model(build_model(), {"left-rear": 1, "back-right": 1})
    for d in m["doors"]:
        if d["type"] != "bifold":
            continue
        did = d["id"]
        ids = [
            did + "-a-stile-a",
            did + "-park-operating-stop-0",
            did + "-park-operating-stop-0-pad",
        ]
        s = build_shapes({**m, "parts": [p for p in m["parts"] if p["id"] in ids]})
        assert s[ids[0]].distance(s[ids[2]]) < 1e-5
        # Deliberately overshoot the primary leaf, beyond permitted kinematics.
        # The hard stop must block travel after the nominal soft-pad contact.
        pivot = d["pivot"]
        overshot = s[ids[0]].rotate(tuple(pivot), (pivot[0], pivot[1], pivot[2] + 1), -5)
        assert overshot.intersect(s[ids[1]]).Volume() > 1


def test_printed_guide_reliefs_leave_connected_body():
    m = build_model()
    p = next(p for p in m["parts"] if p.get("geometry", {}).get("kind") == "printed-guide-body")
    local = {**p, "position": [0, 0, 0], "rotation_deg": 0}
    shape = build_shapes({**m, "parts": [local]})[p["id"]]
    assert shape.isValid() and len(shape.Solids()) == 1
    import cadquery as cq

    x, y = p["holes"][0]["center"]
    probe = cq.Workplane("XY").box(1, 0.3, 1).val().translate((x, 11.7 if y > 0 else -11.7, 0))
    assert probe.intersect(shape).Volume() < 1e-5


def test_handle_recess_and_plate_fixings_are_not_claimed_approved():
    from enclosure.bifold_completion import handle_shape

    m = build_model()
    handle = next(p for p in m["parts"] if p.get("product_code") == "GHD9008B")
    s = handle_shape()
    b = s.BoundingBox()
    assert [b.xlen, b.ylen, b.zlen] == pytest.approx([18, 36, 108])
    assert "length pending" in handle["fastener_schedule"]["screw"]
    assert "assumed" in handle["machining"]
    assert any(
        a["id"] == "bifold-corner-and-carrier-design" and not a["confirmed"]
        for a in m["assumptions"]
    )


@pytest.mark.parametrize("did", ["left-rear", "back-right"])
def test_exterior_head_barrier_sections_and_connection_mutations(did):
    from enclosure.verification import check_barrier_connection, check_barrier_region

    m = build_model()
    head = next(e for e in m["containment"] if e["id"] == did + "-perimeter-top")
    ids = set(head["part_ids"]) | {pid for pair in head["nominal_contact_chain"] for pid in pair}
    s = build_shapes({**m, "parts": [p for p in m["parts"] if p["id"] in ids]})
    for r in head["coverage_regions"]:
        assert check_barrier_region(s, r, 2, 0.5)["status"] == "pass"
    for pair in head["nominal_contact_chain"]:
        assert check_barrier_connection(s, pair)["status"] == "pass"
    brush = did + "-perimeter-top-seal"
    missing = {pid: shape for pid, shape in s.items() if pid != brush}
    assert check_barrier_region(missing, head["coverage_regions"][1], 2, 0.5)["status"] == "fail"
    moved = {**s, brush: s[brush].translate((0, 0, 50))}
    assert check_barrier_region(moved, head["coverage_regions"][1], 2, 0.5)["status"] == "fail"
    holder = did + "-head-brush-return"
    disconnected = {**s, holder: s[holder].translate((0, 0, 100))}
    assert (
        check_barrier_connection(disconnected, head["nominal_contact_chain"][0])["status"] == "fail"
    )


def test_retail_meeting_wipe_has_no_clamps_and_disengages():
    from enclosure.verification import check_barrier_region

    for f in (0, 0.25, 0.5, 0.75, 1):
        m = pose_model(build_model(), {"left-rear": f, "back-right": f})
        assert not any("meeting-clamp" in p["id"] for p in m["parts"])
        assert not any(
            "meeting-clamp" in row["part_id"] or "lip root" in row["screw"]
            for row in m["bifold_completion"]["fastener_schedule"]
        )
        for did in ("left-rear", "back-right"):
            ps = [
                p
                for p in m["parts"]
                if p["id"]
                in (
                    did + "-meeting-cover",
                    did + "-b-stile-a",
                    did + "-a-stile-b",
                    did + "-a-handle",
                    did + "-b-handle",
                )
            ]
            s = build_shapes({**m, "parts": ps})
            lip = next(p for p in ps if p["id"] == did + "-meeting-cover")
            assert lip["motion_leaf"] == "b"
            assert "disengages" in lip["seal_spec"]["attachment"]
            assert lip["product_code"] == "TESA-05422" and "cad_asset" not in lip
            assert lip["size"] == [38, 3, 688]
            assert lip["procurement"]["packs_required"] == 1
            assert "provisional" in lip["seal_spec"]["section_status"]
            assert s[lip["id"]].distance(s[did + "-b-stile-a"]) < 1e-5
            for leaf in ("a", "b"):
                assert s[lip["id"]].intersect(s[f"{did}-{leaf}-handle"]).Volume() < 1e-5
            handle = next(p for p in ps if p["id"] == did + "-a-handle")
            assert handle["motion_local"][1] == -10
            distance = s[lip["id"]].distance(s[did + "-a-stile-b"])
            if f == 0:
                assert distance < 1e-5
                region = next(e for e in m["containment"] if e["id"] == did + "-meeting")[
                    "coverage_regions"
                ][0]
                assert check_barrier_region(s, region, 2, 0.5)["status"] == "pass"
                assert (
                    check_barrier_region(
                        {k: v for k, v in s.items() if k != lip["id"]}, region, 2, 0.5
                    )["status"]
                    == "fail"
                )
            else:
                assert distance > 1

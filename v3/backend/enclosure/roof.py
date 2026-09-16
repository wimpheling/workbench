"""Six transportable roof panels and nominal support/seal interfaces, in mm."""

GAP = 2.0
GASKET_WIDTH = 15.0
GASKET_INSTALLED = 2.0
GASKET_SOURCE = "https://www.emka.com/products/1016-16"


def add_roof(part, p):
    w, d, h, t = (p[k] for k in ("width_mm", "depth_mm", "height_mm", "panel_thickness_mm"))
    x_ranges = [(-30, w / 2 - GAP / 2), (w / 2 + GAP / 2, w + 30)]
    y_ranges = [
        (-30, d / 3 - GAP / 2),
        (d / 3 + GAP / 2, 2 * d / 3 - GAP / 2),
        (2 * d / 3 + GAP / 2, d + 30),
    ]
    supports = []
    for i, (a, b) in enumerate(
        ((0, d / 3 - 15), (d / 3 + 15, 2 * d / 3 - 15), (2 * d / 3 + 15, d))
    ):
        row = part(
            f"beam-roof-centre-{i + 1}",
            [30, b - a, 30],
            [w / 2, (a + b) / 2, h + 15],
            assembly="roof",
        )
        supports.append(row["id"])
    panels = []
    for side, (x0, x1) in zip(("left", "right"), x_ranges):
        for bay, (y0, y1) in zip(("front", "middle", "rear"), y_ranges):
            row = part(
                f"panel-roof-{side}-{bay}",
                [x1 - x0, y1 - y0, t],
                [(x0 + x1) / 2, (y0 + y1) / 2, h + 30 + GASKET_INSTALLED + t / 2],
                "panel",
                "roof",
            )
            row["mounting"] = (
                "Removable lift-off panel. Perimeter/seam clamp tabs into top slots proposed; clamp product, positions, fixing lengths and any edge relief remain pending. No guessed panel fixing holes released."
            )
            panels.append(row["id"])
            if side == "left" and bay == "middle":
                hole_panel = row
    hole_panel["holes"] = [
        dict(
            center=[0, 0],
            axis="z",
            diameter_mm=p["hose_diameter_mm"] + 10,
            x_mm=hole_panel["size"][0] / 2,
            y_mm=hole_panel["size"][1] / 2,
        )
    ]
    # Under-slung flat straps join the 3030 members without crossing extrusions.
    for name, y, length, stations in (
        ("cross-1", d / 3, 150, (-60, -30, 0, 30, 60)),
        ("cross-2", 2 * d / 3, 150, (-60, -30, 0, 30, 60)),
        ("rear", d - 15, 90, (-30, 0, 30)),
    ):
        part(
            f"roof-joint-strap-{name}",
            [30, length, 3],
            [w / 2, y, h - 1.5],
            "hardware",
            "roof",
            material="steel",
            supplier="Local metalwork supplier",
            product_code="PREPARED-FLAT-30x3-ROOF",
            holes=[
                dict(center=[0, yy], axis="z", diameter_mm=6.5, countersink_bottom_diameter_mm=12)
                for yy in stations
            ],
            cut_size_mm=[30, length, 3],
            drawing_axes=[0, 1],
            thickness_axis=2,
            fastener_schedule=dict(
                quantity=len(stations),
                screw="M6 countersunk through 3 mm strap into underside slot nut; exact length/engagement pending",
                nut="M6 slot-8 candidate",
            ),
            machining="3 mm steel strap; drill 6.5 mm holes, 90 degree underside countersinks to 12 mm. Validate remaining seat thickness, stiffness and joint clamping.",
        )
    part(
        "roof-joint-front-angle",
        [30, 30, 30],
        [w / 2 - 30, 15, h + 15],
        "hardware",
        "roof",
        material="steel",
        supplier="Local metalwork supplier",
        product_code="PREPARED-ROOF-FRONT-ANGLE",
        geometry=dict(kind="roof-front-angle"),
        holes=[dict(center=[0, 0], axis=axis, diameter_mm=6.5) for axis in ("x", "y")],
        fastener_schedule=dict(
            quantity=2,
            screw="M6 through 3 mm angle into front upper side slot and centre-member side slot; lengths pending",
            nut="M6 slot-8 candidate",
        ),
        machining="Supplier-prepared 30 mm tall, 3 mm steel angle; nominal 30 x 30 mm legs in plan. Root radius, hole access, washers, stiffness and fabrication method require approval. Connects upper side slots above the front-door backing.",
    )
    return dict(
        panel_ids=panels,
        centre_support_ids=supports,
        grid=[2, 3],
        seam_gap_mm=GAP,
        hose_panel_id=hole_panel["id"],
        hose_centre_mm=hole_panel["position"][:2],
        gasket=dict(
            product_code="EMKA-1016-16",
            source=GASKET_SOURCE,
            width_mm=15,
            free_thickness_mm=3,
            installed_thickness_mm=2,
            status="candidate; installed compression and fixing pitch unvalidated",
        ),
        removal="Lift off panels; remove left panels first to access right-panel fixings from the open roof. Disconnect/support the hose before removing the middle-left panel. Actual reach and fixing access require measurement.",
        status="Design prototype; panel clamping, connections, stiffness, seal compression and actual hose routing remain unvalidated",
    )


def add_roof_seals(model, add):
    p = model["parameters"]
    w, d, h = (p[k] for k in ("width_mm", "depth_mm", "height_mm"))
    a = GASKET_WIDTH / 2
    strips = [
        ("roof-perimeter-gasket-0", -15 - a, w + 15 + a, -15 - a, -15 + a),
        ("roof-perimeter-gasket-1", -15 - a, w + 15 + a, d + 15 - a, d + 15 + a),
        ("roof-perimeter-gasket-2", -15 - a, -15 + a, -15 + a, d + 15 - a),
        ("roof-perimeter-gasket-3", w + 15 - a, w + 15 + a, -15 + a, d + 15 - a),
    ]
    strips += [
        (f"roof-crossbar-gasket-{i + 1}", -15 + a, w + 15 - a, y - a, y + a)
        for i, y in enumerate((d / 3, 2 * d / 3))
    ]
    strips += [
        (f"roof-centre-gasket-{i + 1}", w / 2 - a, w / 2 + a, y0, y1)
        for i, (y0, y1) in enumerate(
            ((-15 + a, d / 3 - a), (d / 3 + a, 2 * d / 3 - a), (2 * d / 3 + a, d + 15 - a))
        )
    ]
    ids = []
    regions = []
    for pid, x0, x1, y0, y1 in strips:
        row = add(
            pid,
            [x1 - x0, y1 - y0, GASKET_INSTALLED],
            [(x0 + x1) / 2, (y0 + y1) / 2, h + 31],
            assembly="roof",
            rubber=True,
            product_code="EMKA-1016-16",
            supplier="EMKA / distributor; availability to confirm",
            source=GASKET_SOURCE,
            machining="Cut 15 x 3 mm self-adhesive EPDM sponge strip; nominal installed height 2 mm is a study, not approved compression. Butt/seal grid junctions. Clamp pitch and adhesion require validation.",
        )
        row["seal_spec"].update(
            free_height_mm=3,
            installed_height_mm=2,
            compression_range="3 to 2 mm proposed; supplier/physical validation pending",
        )
        ids.append(pid)
        regions.append(
            dict(
                normal_axis=2,
                plane_mm=h + 31,
                min_mm=[x0 + 2, y0 + 2],
                max_mm=[x1 - 2, y1 - 2],
                part_ids=[pid],
                required_overlap_mm=1,
            )
        )
    # Full seam obligations cross each butt junction; a missing grid segment fails.
    regions += [
        dict(
            normal_axis=2,
            plane_mm=h + 31,
            min_mm=[w / 2 - 1, -15],
            max_mm=[w / 2 + 1, d + 15],
            part_ids=ids,
            required_overlap_mm=1,
        )
    ]
    regions += [
        dict(
            normal_axis=2,
            plane_mm=h + 31,
            min_mm=[-15, y - 1],
            max_mm=[w + 15, y + 1],
            part_ids=ids,
            required_overlap_mm=1,
        )
        for y in (d / 3, 2 * d / 3)
    ]
    roof = next(q for q in model["parts"] if q["id"] == model["roof_layout"]["hose_panel_id"])
    return roof, ids, regions


def front_angle_shape():
    import cadquery as cq

    # Plan-view corner: rear face of front rail and left face of centre member.
    upright = cq.Workplane("XY").box(30, 3, 30).translate((0, -13.5, 0)).val()
    foot = cq.Workplane("XY").box(3, 27, 30).translate((13.5, 1.5, 0)).val()
    return upright.fuse(foot).clean()

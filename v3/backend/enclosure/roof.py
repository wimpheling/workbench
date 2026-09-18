"""Six transportable roof panels and nominal support/seal interfaces, in mm."""

GAP = 2.0
GASKET_WIDTH = 6.0
GASKET_INSTALLED = 2.0
GASKET_SOURCE = (
    "https://rubberandsponge.co.uk/product/3mm-thick-x-6mm-wide-adhesive-epdm-sponge-strip/"
)
GASKET_CODE = "200-3-6-10-2"
WASHER_SOURCE = "https://www.obo.pt/datasheet/?file=WS_M6_G30_G-3403092-pt_PT.pdf"
NUT_SOURCE = "https://reiman.pt/pt/wlw-btn08m6-btn08m6-m6-slot-8-t-nut/"
BRACKET_SOURCE = "https://reiman.pt/pt/wlw-cbr3030-cbr3030-30x30-bracket/"
CLAMP_PITCH = 250.0
SLOT_OFFSET = 15.0
STAGGER = 12.0
BRACKET_SEAT = 12.43933982822  # measured mounting planes in intact supplier STEP


def stations(a, b):
    """Keep slot nuts clear of beam junctions; nominal pitch, not a load rating."""
    import math

    start, end = a + 75, b - 75
    count = max(1, math.ceil((end - start) / CLAMP_PITCH))
    return [start + (end - start) * i / count for i in range(count + 1)]


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
        ((0, d / 3 - 30), (d / 3 + 30, 2 * d / 3 - 30), (2 * d / 3 + 30, d))
    ):
        row = part(
            f"beam-roof-centre-{i + 1}",
            [60, b - a, 30],
            [w / 2, (a + b) / 2, h + 15],
            assembly="roof",
            product_code="AST03006006",
        )
        supports.append(row["id"])
    panels = []
    panel_rows = []
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
                "Remove this panel’s own screws and washers, then lift vertically. Every fixing bears on one panel only. Wood holes are wholly inside the rectangular blank. No neighboring fasteners need releasing; no metal drilling or cutting."
            )
            panels.append(row["id"])
            panel_rows.append(row)
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
    # Intact purchased brackets in plan, on the right side of each centre beam.
    joint_ids = []
    for i, (lo, hi) in enumerate(
        ((0, d / 3 - 30), (d / 3 + 30, 2 * d / 3 - 30), (2 * d / 3 + 30, d))
    ):
        ends = []
        for end, y, turn in (("front", lo, -90), ("rear", hi, 90)):
            pid = f"roof-joint-{i + 1}-{end}"
            part(
                pid,
                [29.12132034356, 29.12132034356, 26],
                [
                    w / 2 + 30 + BRACKET_SEAT,
                    y + (BRACKET_SEAT if end == "front" else -BRACKET_SEAT),
                    h + 15,
                ],
                "hardware",
                "roof",
                product_code="CBR3030",
                supplier="Reiman Portugal",
                cad_asset="CBR3030.step",
                geometry=dict(kind="roof-stock-bracket", turn_deg=turn),
                geometry_fidelity="supplier-step-rigid-transform",
                source=BRACKET_SOURCE,
                machining="Purchased complete; no drilling, cutting or tab removal. Side-slot mounting; verify tool access and joint capacity.",
                fastener_schedule=dict(
                    quantity=2,
                    screw="ISO 4762 M6x14 with ISO 7089 M6 washer (Wolweiss catalogue p168)",
                    washer="ISO 7089 M6",
                    nut="Wolweiss BTN08M6",
                    status="Length, seating and thread engagement require assembly check; fasteners not modeled",
                ),
            )
            ends.append(pid)
        joint_ids.append(ends)

    # Each rectangular panel gets its own slot on the 60 mm internal members.
    # Along a seam, the two independent rows are staggered by 24 mm.
    clamps = []
    for col, side in enumerate(("left", "right")):
        for bay_index, bay in enumerate(("front", "middle", "rear")):
            row = next(q for q in panel_rows if q["id"] == f"panel-roof-{side}-{bay}")
            x0, x1 = ((-15, w / 2 - SLOT_OFFSET), (w / 2 + SLOT_OFFSET, w + 15))[col]
            y0, y1 = (
                (-15, d / 3 - SLOT_OFFSET),
                (d / 3 + SLOT_OFFSET, 2 * d / 3 - SLOT_OFFSET),
                (2 * d / 3 + SLOT_OFFSET, d + 15),
            )[bay_index]
            row["roof_slot_bounds_mm"] = [x0, x1, y0, y1]
            points = [(x - STAGGER, y0) for x in stations(x0, x1)]
            points += [(x + STAGGER, y1) for x in stations(x0, x1)]
            points += [(x0, y - STAGGER) for y in stations(y0, y1)]
            points += [(x1, y + STAGGER) for y in stations(y0, y1)]
            for x, y in points:
                px, py = row["position"][:2]
                sx, sy = row["size"][:2]
                row.setdefault("holes", []).append(
                    dict(
                        center=[x - px, y - py],
                        axis="z",
                        diameter_mm=7,
                        x_mm=x - px + sx / 2,
                        y_mm=y - py + sy / 2,
                        purpose="Independent M6 panel fixing; full bore in wood",
                    )
                )
                row["machining"] = (
                    "Rectangular wood panel: 7 mm through-holes for individual fixings; no seam notches. Hose cut only where specified. No metalwork."
                )
                pid = f"roof-clamp-{len(clamps) + 1:02d}"
                part(
                    pid,
                    [30, 30, 1.3],
                    [x, y, h + 30 + GASKET_INSTALLED + t + 0.65],
                    "hardware",
                    "roof",
                    material="zinc-plated steel",
                    supplier="OBO Bettermann Portugal / distributor",
                    product_code="3403092",
                    source=WASHER_SOURCE,
                    geometry=dict(kind="annulus", outer_diameter_mm=30, inner_diameter_mm=6.4),
                    geometry_fidelity="supplier-dimensions-reconstruction",
                    retained_panel_ids=[row["id"]],
                    machining="Purchased 30 x 6.4 x 1.3 mm load-spreading washer. Bears on this panel only; no metal machining. Tightening and wood bearing require validation.",
                    fastener_schedule=dict(
                        quantity=1,
                        screw="ISO 4762 M6; M6x16 candidate for 6 mm wood",
                        nut="Wolweiss BTN08M6",
                        nut_source=NUT_SOURCE,
                        status="Select length for actual wood/gasket stack and nut seating; fasteners not modeled",
                    ),
                )
                clamps.append(
                    dict(part_id=pid, centre_mm=[x, y], panel_ids=[row["id"]], kind="individual")
                )
    return dict(
        panel_ids=panels,
        centre_support_ids=supports,
        internal_support_ids=["beam-roof-1", "beam-roof-2"] + supports,
        internal_support_section_mm=[60, 30],
        fixing_method="One panel per fixing; separate upward slots in horizontal 60x30 internal supports",
        fixing_stagger_mm=2 * STAGGER,
        support_connector_ids=joint_ids,
        clamps=clamps,
        clamp_pitch_limit_mm=CLAMP_PITCH,
        hardware_schedule=[
            dict(
                product_code="3403092",
                quantity=len(clamps),
                supplier="OBO Bettermann",
                source=WASHER_SOURCE,
                status="Individual panel load-spreading washer; tightening/wood bearing unvalidated",
            ),
            dict(
                product_code="CBR3030",
                quantity=6,
                supplier="Reiman",
                source=BRACKET_SOURCE,
                status="Intact supplier STEP; physical joint approval pending",
            ),
            dict(
                product_code="BTN08M6",
                quantity=len(clamps) + 12,
                supplier="Reiman",
                source=NUT_SOURCE,
                status="Not modeled; includes two nuts per support bracket",
            ),
            dict(
                product_code="ISO4762-M6-ROOF",
                quantity=len(clamps),
                supplier="Fastener retailer",
                status="M6x16 candidate only at 6 mm wood; length/grade to confirm",
            ),
            dict(
                product_code="ISO7089-M6",
                quantity=12,
                supplier="Fastener retailer",
                status="One stock flat washer per support-bracket screw; Wolweiss catalogue p168",
            ),
            dict(
                product_code="ISO4762-M6-BRACKETS",
                quantity=12,
                supplier="Fastener retailer",
                status="M6x14 plus ISO 7089 M6 washer per Wolweiss catalogue p168; installed seating/engagement to confirm",
            ),
        ],
        grid=[2, 3],
        seam_gap_mm=GAP,
        hose_panel_id=hole_panel["id"],
        hose_centre_mm=hole_panel["position"][:2],
        gasket=dict(
            product_code=GASKET_CODE,
            source=GASKET_SOURCE,
            width_mm=GASKET_WIDTH,
            free_thickness_mm=3,
            installed_thickness_mm=2,
            status="candidate; compression, fixing pitch and gasket bridging of open corner-post ends / 2 mm radiused butt junctions unvalidated",
            corner_post_ids=[
                "post-left-front",
                "post-left-back",
                "post-right-front",
                "post-right-back",
            ],
        ),
        removal="Remove only the selected panel’s screws and washers, then lift it vertically. Neighboring panels remain fastened. Remove left panels first to reach right-panel fixings from the open roof. Retrieve and reseat loose slot nuts. Disconnect/support the hose before removing the middle-left panel. Physical reach and nut handling require validation.",
        status="Design prototype; panel clamping, connections, stiffness, seal compression and actual hose routing remain unvalidated",
    )


def add_roof_seals(model, add):
    """One closed loop per panel, on flat lands beside the upward slot.

    Centres are 9 mm inward of each supporting slot: 6 mm stock occupies
    offsets 6..12 on a 15 mm half-face. Screw bores (radius 3.5) stay outside.
    """
    p = model["parameters"]
    h = p["height_mm"]
    ids, regions = [], []
    loops = []
    for col, side in enumerate(("left", "right")):
        for row, bay in enumerate(("front", "middle", "rear")):
            panel_id = f"panel-roof-{side}-{bay}"
            panel = next(q for q in model["parts"] if q["id"] == panel_id)
            xa, xb, ya, yb = panel["roof_slot_bounds_mm"]
            x0, x1, y0, y1 = xa + 6, xb - 6, ya + 6, yb - 6
            loop = []
            strips = [
                ("front", x0, x1, y0, y0 + GASKET_WIDTH),
                ("rear", x0, x1, y1 - GASKET_WIDTH, y1),
                ("left", x0, x0 + GASKET_WIDTH, y0 + GASKET_WIDTH, y1 - GASKET_WIDTH),
                ("right", x1 - GASKET_WIDTH, x1, y0 + GASKET_WIDTH, y1 - GASKET_WIDTH),
            ]
            for edge, xa, xb, ya, yb in strips:
                pid = f"roof-gasket-{side}-{bay}-{edge}"
                seal = add(
                    pid,
                    [xb - xa, yb - ya, GASKET_INSTALLED],
                    [(xa + xb) / 2, (ya + yb) / 2, h + 31],
                    assembly="roof",
                    rubber=True,
                    product_code=GASKET_CODE,
                    supplier="Rubber & Sponge / equivalent confirmed 6 x 3 mm EPDM sponge",
                    source=GASKET_SOURCE,
                    machining="Cut soft 6 x 3 mm adhesive EPDM sponge to length; bond/seal butt corners. No metal machining. Installed 2 mm height is unvalidated.",
                )
                seal["seal_spec"].update(
                    free_height_mm=3,
                    installed_height_mm=2,
                    compression_range="3 to 2 mm study; adhesive face, compression and corner bonding to confirm",
                )
                ids.append(pid)
                loop.append(pid)
            # Continuous targets extend through all four butt junctions.
            for xa, xb, ya, yb in (
                (x0 + 2, x1 - 2, y0 + 2, y0 + 4),
                (x0 + 2, x1 - 2, y1 - 4, y1 - 2),
                (x0 + 2, x0 + 4, y0 + 2, y1 - 2),
                (x1 - 4, x1 - 2, y0 + 2, y1 - 2),
            ):
                regions.append(
                    dict(
                        normal_axis=2,
                        plane_mm=h + 31,
                        min_mm=[xa, ya],
                        max_mm=[xb, yb],
                        part_ids=loop,
                        required_overlap_mm=1,
                    )
                )
            loops.append(dict(panel_id=panel_id, gasket_ids=loop))
    model["roof_layout"]["gasket_loops"] = loops
    roof = next(q for q in model["parts"] if q["id"] == model["roof_layout"]["hose_panel_id"])
    return roof, ids, regions


def stock_bracket_shape(turn_deg):
    from .profiles import bracket

    return bracket().rotate((0, 0, 0), (1, 0, 0), turn_deg)

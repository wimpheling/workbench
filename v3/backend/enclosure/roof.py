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
                "Remove stock M6 washer clamps before lifting. Shared clamps retain both adjacent edges; support neighboring panels during removal. Perimeter screws pass through wood only. No metal drilling or cutting."
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
        ((0, d / 3 - 15), (d / 3 + 15, 2 * d / 3 - 15), (2 * d / 3 + 15, d))
    ):
        ends = []
        for end, y, turn in (("front", lo, -90), ("rear", hi, 90)):
            pid = f"roof-joint-{i + 1}-{end}"
            part(
                pid,
                [29.12132034356, 29.12132034356, 26],
                [
                    w / 2 + 15 + BRACKET_SEAT,
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
                    screw="ISO 4762 M6x12 candidate",
                    nut="Wolweiss BTN08M6",
                    status="Length, seating and thread engagement require assembly check; fasteners not modeled",
                ),
            )
            ends.append(pid)
        joint_ids.append(ends)

    # Circular stock washers bridge each shared seam; identical washers retain
    # the perimeter via holes through wood. All fixing axes lie outside seals.
    xs, ys = [-15, w / 2, w + 15], [-15, d / 3, 2 * d / 3, d + 15]
    fixing_points = []
    for y in ys:
        for a, b in zip(xs, xs[1:]):
            fixing_points += [(x, y) for x in stations(a, b)]
    for x in xs:
        for a, b in zip(ys, ys[1:]):
            fixing_points += [(x, y) for y in stations(a, b)]
    clamps = []
    for index, (x, y) in enumerate(fixing_points, 1):
        retained = []
        for row in panel_rows:
            px, py = row["position"][:2]
            sx, sy = row["size"][:2]
            if abs(x - px) <= sx / 2 + 3.5 and abs(y - py) <= sy / 2 + 3.5:
                retained.append(row["id"])
                row.setdefault("holes", []).append(
                    dict(
                        center=[x - px, y - py],
                        axis="z",
                        diameter_mm=7,
                        x_mm=x - px + sx / 2,
                        y_mm=y - py + sy / 2,
                        purpose="M6 fixing clearance; circle intersecting panel edge defines local relief",
                    )
                )
                row["machining"] = (
                    "Wood only: 7 mm fixing holes and edge reliefs at declared centres. Edge circles may have centres outside the rectangular blank; remove only their intersection with wood. Hose cut only where specified. No metalwork."
                )
        pid = f"roof-clamp-{index:02d}"
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
            retained_panel_ids=retained,
            machining="Purchased WS M6 G30 G washer, 30 x 6.4 x 1.3 mm; no metal machining. Light-duty clamp application requires bearing/stiffness and tightening validation.",
            fastener_schedule=dict(
                quantity=1,
                screw="ISO 4762 M6; M6x16 candidate for 6 mm wood",
                nut="Wolweiss BTN08M6",
                nut_source=NUT_SOURCE,
                status="Select length for actual wood/gasket stack and nut seating; fasteners not modeled",
            ),
        )
        clamps.append(
            dict(
                part_id=pid,
                centre_mm=[x, y],
                panel_ids=retained,
                kind="shared" if len(retained) == 2 else "perimeter",
            )
        )
    return dict(
        panel_ids=panels,
        centre_support_ids=supports,
        support_connector_ids=joint_ids,
        clamps=clamps,
        clamp_pitch_limit_mm=CLAMP_PITCH,
        hardware_schedule=[
            dict(
                product_code="3403092",
                quantity=len(clamps),
                supplier="OBO Bettermann",
                source=WASHER_SOURCE,
                status="Stock washer used as clamp; application unvalidated",
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
                product_code="ISO4762-M6-BRACKETS",
                quantity=12,
                supplier="Fastener retailer",
                status="M6x12 candidate; length/grade to confirm",
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
        removal="Remove screws and washers, then lift panels; a circular washer cannot rotate clear. Remove left panels first to access right-panel fixings from the open roof. Shared clamps release both neighboring edges; support panels during removal. Retrieve and reseat loose slot nuts. Disconnect/support the hose before removing the middle-left panel. Actual reach and fixing access require measurement.",
        status="Design prototype; panel clamping, connections, stiffness, seal compression and actual hose routing remain unvalidated",
    )


def add_roof_seals(model, add):
    """One closed loop per panel, on flat lands beside the upward slot.

    Centres are 9 mm inward of each supporting slot: 6 mm stock occupies
    offsets 6..12 on a 15 mm half-face. Screw bores (radius 3.5) stay outside.
    """
    p = model["parameters"]
    w, d, h = (p[k] for k in ("width_mm", "depth_mm", "height_mm"))
    xs, ys = [-15, w / 2, w + 15], [-15, d / 3, 2 * d / 3, d + 15]
    ids, regions = [], []
    loops = []
    for col, side in enumerate(("left", "right")):
        for row, bay in enumerate(("front", "middle", "rear")):
            x0, x1 = xs[col] + 6, xs[col + 1] - 6
            y0, y1 = ys[row] + 6, ys[row + 1] - 6
            panel_id = f"panel-roof-{side}-{bay}"
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

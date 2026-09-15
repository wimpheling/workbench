"""Rear electrical mounting study. Original printable parts; measured fit pending."""

from functools import lru_cache

import cadquery as cq


def box(size, centre=(0, 0, 0)):
    return cq.Workplane("XY").box(*size).val().translate(centre)


@lru_cache(maxsize=8)
def printable(role):
    if role == "pendant-cradle":
        # Back against mounting plate, shelf below pendant, open button face.
        s = box((140, 6, 160), (0, 3, 0))
        s = s.fuse(box((140, 52, 6), (0, 26, -77)))
        for x in (-67, 67):
            s = s.fuse(box((6, 46, 40), (x, 29, -60)))
        s = s.fuse(box((140, 6, 12), (0, 49, -71)))
        for x in (-55, 55):
            for z in (-50, 50):
                s = s.cut(cq.Solid.makeCylinder(2.75, 8, cq.Vector(x, -1, z), cq.Vector(0, 1, 0)))
            # Two vertical strap slots each side; avoid button face when fitting.
            s = s.cut(box((5, 8, 26), (x, 3, 0)))
    elif role in ("cable-cover-left", "cable-cover-right"):
        # Two independently removable halves with a shared cable bundle aperture.
        sign = -1 if role.endswith("left") else 1
        s = box((49.75, 6, 100), (sign * 25.125, 3, 0))
        s = s.cut(cq.Solid.makeCylinder(15, 8, cq.Vector(0, -1, 0), cq.Vector(0, 1, 0)))
        for z in (-38, 38):
            s = s.cut(
                cq.Solid.makeCylinder(2.75, 8, cq.Vector(sign * 38, -1, z), cq.Vector(0, 1, 0))
            )
    else:
        raise ValueError(role)
    s = s.clean()
    bb = s.BoundingBox()
    centre = [(getattr(bb, a + "min") + getattr(bb, a + "max")) / 2 for a in "xyz"]
    return s.translate(tuple(-v for v in centre)), centre, [bb.xlen, bb.ylen, bb.zlen]


def add_rear_electrical(model):
    p = model["parameters"]
    w, d, h, t = (p[k] for k in ("width_mm", "depth_mm", "height_mm", "panel_thickness_mm"))
    by = {q["id"]: q for q in model["parts"]}
    wall = by["panel-back-left"]
    jamb = by["post-back-middle"]["position"][0]
    cx = min(w / 2, jamb - 140)
    outer = wall["position"][1] + t / 2
    plate_front = outer + 18

    def part(id, size, position, material="steel", **extra):
        row = dict(
            id=id,
            name=id.replace("-", " "),
            size=list(size),
            position=list(position),
            rotation_deg=0,
            category="hardware",
            assembly="rear-electrical",
            material=material,
            supplier="Local metalwork supplier",
            quantity=1,
            physical=True,
            product_code=id.upper(),
            geometry_fidelity="original-mounting-study",
        )
        row.update(extra)
        model["parts"].append(row)
        return row

    def hole(row, x, z, diameter):
        row.setdefault("holes", []).append(
            dict(
                center=[x, z],
                diameter_mm=diameter,
                axis="y",
                x_mm=x + row["size"][0] / 2,
                y_mm=z + row["size"][2] / 2,
            )
        )

    # Rail-to-rail stock flat strips keep equipment weight off the wood infill.
    for name, x, width in (("controller", cx, 210), ("pendant", 110, 140)):
        plate = part(
            f"rear-{name}-plate",
            (width, 3, h + 60),
            (x, plate_front + 1.5, h / 2),
            cut_size_mm=[width, h + 60, 3],
            drawing_axes=[0, 2],
            thickness_axis=1,
            machining="Drill declared frame/holder bores; controller case holes transfer from actual hardware only.",
            fastener_schedule=dict(
                quantity=4,
                screw="M6 through plate and steel spacer, length to suit actual stack",
                nut="BPN08M6 slot nut; confirm engagement and top-header slot position",
            ),
        )
        for xx in (-width / 2 + 20, width / 2 - 20):
            for z, rail_face in ((-15, d + 30), (h + 15, d + 45)):
                hole(plate, xx, z - h / 2, 6.5)
                length = plate_front - rail_face
                spacer = part(
                    f"rear-{name}-spacer-{xx:g}-{z:g}",
                    (12, length, 12),
                    (x + xx, rail_face + length / 2, z),
                    geometry=dict(kind="cylinder", axis=1, diameter_mm=12),
                    machining="12 mm OD steel sleeve, 6.5 mm bore; square cut to modeled length",
                )
                hole(spacer, 0, 0, 6.5)
                # Bottom sleeves pass through the fixed sheet, not through solid wood.
                if z == -15:
                    gasket = by["panel-back-left-perimeter-gasket-0"]
                    hole(gasket, x + xx - gasket["position"][0], z - gasket["position"][2], 12)
                    hole(wall, x + xx - wall["position"][0], z - wall["position"][2], 14)
        if name == "pendant":
            for xx in (-55, 55):
                for zz in (-50, 50):
                    hole(plate, xx, zz, 5.5)

    part(
        "rear-controller",
        (171, 89, 337),
        (cx, plate_front + 3 + 10 + 44.5, h / 2),
        material="aluminium",
        supplier="Existing Carbide 3D Shapeoko 5 Pro",
        product_code="SHAPEOKO-5-PRO-CONTROLLER",
        geometry_fidelity="owner-measured-envelope",
        mounting="Transfer actual four mounting points to plate after measuring. Provide 10 mm spacers; fastener size, mass and ventilation clearances pending. No case drilling.",
    )
    part(
        "rear-controller-support-shelf",
        (210, 109, 3),
        (cx, plate_front + 3 + 54.5, h / 2 - 170),
        machining="3 mm steel shelf, weld to separately listed root strip; two M5 plate fixings. Weld and capacity pending.",
    )
    root = part(
        "rear-controller-shelf-root",
        (210, 3, 40),
        (cx, plate_front + 4.5, h / 2 - 191.5),
        mounting="Weld top edge to underside of rear-controller-support-shelf",
        fastener_schedule=dict(
            quantity=2,
            screw="M5 through root and backing plate with washers and locking nuts; verify length",
        ),
    )
    for xx in (-75, 75):
        hole(root, xx, 0, 5.5)
        plate = next(q for q in model["parts"] if q["id"] == "rear-controller-plate")
        hole(plate, xx, -191.5, 5.5)
    # Connector/service reference is not a fabricated part or a proven cooling allowance.
    part(
        "rear-controller-connector-access",
        (191, 70, 357),
        (cx, plate_front + 3 + 10 + 89 + 35, h / 2),
        material="air",
        category="service-envelope",
        physical=False,
        supplier="Reference only",
        geometry_fidelity="provisional-service-clearance",
    )
    for role, origin in (
        ("pendant-cradle", (110, plate_front + 9, h / 2)),
        ("cable-cover-left", (cx - 180, outer + 2, h / 2)),
        ("cable-cover-right", (cx - 180, outer + 2, h / 2)),
    ):
        _, centre, size = printable(role)
        part(
            "rear-" + role,
            size,
            [origin[i] + centre[i] for i in range(3)],
            "PETG",
            supplier="In-house print · Bambu A1 mini",
            geometry=dict(kind="rear-electrical-print", role=role),
            print_spec=dict(
                printer="Bambu A1 mini",
                material="PETG",
                layer_mm=0.2,
                walls=5,
                infill_percent=50,
                orientation="Flat back on bed; shelf grows upwards",
                status="fit-prototype",
            ),
            fastener_schedule=dict(
                quantity=4 if role == "pendant-cradle" else 2,
                screw="M5 through bolt with broad washers and locking nut; length to suit actual stack",
            ),
        )
    for xx in (-55, 55):
        for zz in (-50, 50):
            spacer = part(
                f"rear-pendant-cradle-spacer-{xx:g}-{zz:g}",
                (12, 6, 12),
                (110 + xx, plate_front + 6, h / 2 + zz),
                geometry=dict(kind="cylinder", axis=1, diameter_mm=12),
                machining="6 mm long steel spacer, 12 mm OD, 5.5 mm bore; leaves strap access behind cradle",
            )
            hole(spacer, 0, 0, 5.5)
    # Empty cradle remains visible: no invented pendant dimensions disguised as vendor CAD.
    part(
        "rear-pendant-retaining-strap",
        (20, 2, 100),
        (110, plate_front + 9 + 48, h / 2),
        material="textile",
        supplier="Strap retailer",
        physical=False,
        category="service-envelope",
        product_code="20MM-RETAINING-STRAP",
        geometry_fidelity="routing-reference",
        mounting="One adjustable 20 mm strap through cradle slots around pendant body, clear of STOP/feed-hold. Fit and retention must be measured.",
    )
    hx = cx - 180
    hole(wall, hx - wall["position"][0], h / 2 - wall["position"][2], 60)
    for xx in (-38, 38):
        for zz in (-38, 38):
            hole(wall, hx + xx - wall["position"][0], h / 2 + zz - wall["position"][2], 5.5)
    wall["machining"] = (
        "Rear electrical study: 60 mm connector access, four M5 cover holes, four 14 mm bottom sleeve passages; verify against cables and frame before cutting."
    )
    model["rear_electrical"] = dict(
        controller_centre_mm=[cx, plate_front + 57.5, h / 2],
        cable_entry_centre_mm=[hx, outer, h / 2],
        cable_opening_mm=60,
        installed_bundle_aperture_mm=30,
        pendant_usable_cradle_mm=[128, 40, 154],
        required_bought_items=[
            "One 20 mm adjustable pendant retaining strap",
            "Split soft cable bushing for 30 mm aperture, sized to actual bundles",
            "2 mm split closed-cell gasket beneath cable cover; seal split and sleeve passages",
            "Two cushioned cable clamps on fixed rear structure, one inside and one outside entry; size and fixing locations after routing",
        ],
        route="Machine rear harness → supported loop on fixed rear structure → split rear entry → controller. Pendant lead follows fixed rear panel leftwards. Keep all cables clear of doors; lengths and bend radii unmeasured.",
    )
    message = "Rear electrical mounting is a provisional study: validate controller dimensions/mass, transfer its mounting pattern, size all fasteners and sleeves, check cooling and plug access. Measure pendant before printing; cradle 128 x 40 x 154 mm usable, strap must hold it against pressing force without obscuring controls. Confirm reach from left, cable connector passage/bundle size, lengths, strain relief, split bushing and dust sealing. No wiring or stop-system changes."
    model["assumptions"].append(
        dict(
            id="rear-electrical-fit",
            confirmed=False,
            description=message,
            references=[q["id"] for q in model["parts"] if q["assembly"] == "rear-electrical"],
        )
    )
    model["ordering"]["unresolved"].append(message)


def verification_checks(model, shapes):
    data = model["rear_electrical"]
    by = {p["id"]: p for p in model["parts"]}
    wall = by["panel-back-left"]
    x, y, z = data["cable_entry_centre_mm"]
    bore = cq.Solid.makeCylinder(
        29.9,
        wall["size"][1] + 2,
        cq.Vector(x, wall["position"][1] - wall["size"][1] / 2 - 1, z),
        cq.Vector(0, 1, 0),
    )
    overlap = bore.intersect(shapes[wall["id"]]).Volume()
    wall_left = wall["position"][0] - wall["size"][0] / 2
    wall_right = wall["position"][0] + wall["size"][0] / 2
    plates = [by["rear-controller-plate"], by["rear-pendant-plate"]]
    fits = all(
        q["position"][0] - q["size"][0] / 2 >= wall_left
        and q["position"][0] + q["size"][0] / 2 <= wall_right
        for q in plates
    )
    fits = fits and x - 50 > wall_left and x + 50 < wall_right
    return [
        dict(
            id="rear-electrical.cable-bore",
            status="pass" if overlap < 1e-5 else "fail",
            category="geometry",
            message="60 mm rear connector passage cut through actual panel",
            references=[wall["id"]],
            overlap_mm3=overlap,
        ),
        dict(
            id="rear-electrical.fixed-panel-fit",
            status="pass" if fits else "fail",
            category="clearance",
            message="Electrical backing plates and cable cover fit fixed rear panel width",
            references=[q["id"] for q in plates],
        ),
        dict(
            id="rear-electrical.installation",
            status="unknown",
            category="evidence",
            message="Actual component fit, controller fixings, pendant reach/strap retention, structural capacity, cable routing and split-entry sealing require measurement; open cable aperture is not dust-sealed by the rigid cover alone.",
            references=[q["id"] for q in model["parts"] if q["assembly"] == "rear-electrical"],
        ),
    ]

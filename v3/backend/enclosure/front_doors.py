"""Inset front swing doors: existing vendor hinges and corner connection studies."""


def complete_front_doors(model):
    from .bifold_completion import add_corner_plates
    from .core import _add, _rotate
    from .profiles import hinge_component

    H = model["parameters"]["height_mm"]
    for d in model["doors"]:
        if d["type"] != "swing":
            continue
        add_corner_plates(model, d, ("a",))
        left = d["id"] == "front-left"
        normal = 1 if left else -1

        def add(suffix, size, local, moving=True, **extra):
            pid = d["id"] + "-" + suffix
            item = dict(
                id=pid,
                name=suffix.replace("-", " "),
                category="hardware",
                material="aluminium",
                supplier="To be selected",
                product_code=None,
                quantity=1,
                physical=True,
                assembly=d["id"],
                size=size,
                position=_add(d["pivot"], _rotate(local, d["base_deg"])),
                rotation_deg=d["base_deg"],
                geometry_fidelity="nominal-solid",
            )
            item.update(extra)
            if moving:
                item.update(motion_leaf="a", motion_local=local)
            model["parts"].append(item)
            d["part_ids"].append(pid)

        for i, z in enumerate((120, H / 2, H - 120)):
            for component in ("negative", "positive", "pin"):
                _, center, size = hinge_component(component, left)
                add(
                    f"frame-hinge-{i}-{component}",
                    size,
                    _add(center, [0, 0, z]),
                    moving=component == "positive",
                    cad_asset="CFG3030.stp",
                    cad_component=component,
                    hinge_exterior=left,
                    product_code="CFG.30/30 SH-6-C33",
                    quantity=0 if component == "pin" else 0.5,
                    material="steel pin" if component == "pin" else "PA glass-fibre reinforced",
                    supplier="Reiman Portugal / Elesa+Ganter",
                    geometry_fidelity="supplier-step-solid",
                    source="https://www.elesa-ganter.com/siteassets/PDF/EN/CFG..pdf",
                    mounting_orientation_confirmed=False,
                    machining="One complete hinge per station; real vendor axis. Moving wing on 6 mm spacer. Two M6 countersunk slot fixings per hinge; length, engagement, sag and capacity pending.",
                )
            add(
                f"hinge-spacer-{i}",
                [26, 6, 36],
                [17.5, normal * 11, z],
                product_code="FRONT-HINGE-SPACER-6",
                holes=[dict(axis="y", center=[0, 0], diameter_mm=6.5)],
                machining="Cut 26 x 36 x 6 mm aluminium spacer, central 6.5 mm hole. Between moving CFG wing and door front face; M6 screw/slot nut length and engagement pending.",
            )
        d["inset"] = dict(
            frame_front_y_mm=-30,
            leaf_front_y_mm=-24,
            leaf_back_y_mm=6,
            hinge_axis_y_mm=-38,
            moving_wing_spacer_mm=6,
            jamb_gap_mm=5,
            meeting_gap_mm=5,
        )
    # Front-face L plates follow frame slots; their open quadrant clears the aperture.
    W = model["parameters"]["width_mm"]
    for side, sx, x in (("left", 1, 16), ("right", -1, W - 16)):
        for level, sz, z in (("bottom", 1, 16), ("top", -1, H - 16)):
            plate = next(p for p in model["parts"] if p["id"] == f"bracket-{side}-front-{level}-x")
            plate.pop("cad_asset", None)
            plate.update(
                name="CJP3030L front frame front-face corner plate",
                size=[88, 2, 88],
                position=[x, -31, z],
                rotation_deg=0,
                product_code="CJP3030L",
                material="zinc-plated steel",
                supplier="Reiman Portugal / Wolweiss",
                geometry_fidelity="drawing-based-unconfirmed-solid",
                holes=[
                    dict(axis="y", center=[sx * a, sz * b], diameter_mm=6.5)
                    for a, b in ((-31, -31), (-31, -1), (-31, 29), (-1, -31), (29, -31))
                ],
                cutouts=[
                    dict(
                        kind="rectangle",
                        normal_axis=1,
                        width_mm=62,
                        height_mm=62,
                        center_local_mm=[sx * 13, 0, sz * 13],
                    )
                ],
                fastener_schedule=dict(
                    quantity=5,
                    screw="M6 x 10 ISO 7380 button head + 1.6 mm washer candidate; engagement pending",
                    nut="BPN08M6 pre-assembly; seating pending",
                ),
                machining="Bought CJP3030L on front face of front frame replaces aperture-projecting CBR3030. Five M6 slot fixings; corner radii, stiffness, torque and engagement pending.",
                source="https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/cjp.pdf",
            )
            joint = next(
                j
                for j in model["joints"]
                if j["part_a"] == f"post-{side}-front" and j["part_b"] == f"rail-front-{level}"
            )
            joint["connector_ids"] = [plate["id"]]
    model["assumptions"].append(
        dict(
            id="front-inset-hardware",
            confirmed=False,
            references=["front-left", "front-right"],
            description="Inset doors: six CFG hinges with 6 mm moving-wing spacers, eight CJP3030L plates. Door profiles and meeting strip behind frame front face; handles and hinge barrels project. Verify screw lengths, slot nuts, glass setting support, sag, stiffness and physical travel limits. No load rating or latch preload established.",
        )
    )
    model["ordering"]["unresolved"].append(
        "Front slot holder for actual infill thickness, glass setting support, closure seals and hinge/spacer fixings unapproved; do not order glass from provisional cuts."
    )

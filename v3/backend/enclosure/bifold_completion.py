"""Bifold design completion; supplier approval is distinct from nominal geometry."""

import math
from functools import lru_cache

CATALOGUE = "https://reiman.pt/pub/media/catalogue_pdfs/Wolweiss/Wolweiss.pdf"


@lru_cache(maxsize=1)
def handle_shape():
    """GHD9008B drawing study; the grip contour is not vendor CAD."""
    import cadquery as cq

    # L=90 fixing pitch, D2=18 feet, H=36 projection; vertical installation.
    shape = cq.Workplane("XY").box(18, 12, 90).val().translate((0, -12, 0))
    for z in (-45, 45):
        foot = cq.Solid.makeCylinder(9, 36, cq.Vector(0, -18, z), cq.Vector(0, 1, 0))
        shape = shape.fuse(foot)
    return shape


def add_handle_studies(model, door, by_id):
    from .core import _add, _rotate

    for role in ("a", "b"):
        handle = by_id[f"{door['id']}-{role}-handle"]
        stile = by_id[f"{door['id']}-{role}-stile-b"]
        local = list(handle["motion_local"])
        local[1] = stile["motion_local"][1] - 15 - 18
        offset = [local[i] - handle["motion_local"][i] for i in range(3)]
        handle.update(
            name="GHD9008B U handle · drawing study",
            material="PA6",
            supplier="Reiman Portugal / Wolweiss",
            product_code="GHD9008B",
            source=CATALOGUE + "#page=130",
            size=[18, 36, 108],
            position=_add(handle["position"], _rotate(offset, door["base_deg"])),
            motion_local=local,
            geometry_fidelity="drawing-based-unconfirmed-solid",
            geometry=dict(kind="ghd9008b-study"),
            holes=[dict(axis="y", center=[0, z], diameter_mm=6.5) for z in (-45, 45)],
            mass_kg=0.023,
            fastener_schedule=dict(
                quantity=2,
                screw="M6; length pending recessed head-seat depth",
                nut="slot-8 M6; confirm inclusion with handle",
            ),
            machining="Catalogue p130: 90 mm fixing pitch, 18 mm feet, 36 mm projection, 6.5 mm bores. Grip contour and screw-seat recess are assumed; no vendor STEP available. Do not machine the bought handle from this study.",
        )


def add_design_schedules(model):
    """Machine-readable unresolved procurement, without invented installed CAD."""
    schedules = []
    for d in model["doors"]:
        if d["type"] != "bifold":
            continue
        schedules.extend(
            dict(
                id=f"{d['id']}-{state}-catch-requirement",
                assembly=d["id"],
                product_code="GBL3030.KIT",
                quantity=count,
                location=location,
                source=CATALOGUE + "#page=147",
                status="installation-unresolved-no-vendor-step",
                known_dimensions_mm=dict(
                    body_width=17,
                    body_depth=18.5,
                    body_height=60,
                    body_hole_pitch=48,
                    body_bore=4.5,
                ),
                unresolved="Kit adapter/strike installation, adjustment, tool access and release force. Catalogue dimensions alone do not prove engagement in this assembly.",
            )
            for state, count, location in (
                (
                    "closed",
                    2,
                    "Secondary free stile; upper and lower stations clear of carrier, handle and gussets",
                ),
                (
                    "parked",
                    1,
                    "Stationary prepared bracket engaging the folded door; independent of operating stop",
                ),
            )
        )
    model["bifold_completion"] = dict(
        catch_requirements=schedules,
        fastener_schedule=[
            dict(part_id=p["id"], assembly=p["assembly"], **p["fastener_schedule"])
            for p in model["parts"]
            if p.get("fastener_schedule")
        ],
        status="digital-design-incomplete-not-for-manufacture",
    )
    model["ordering"]["unresolved"].append(
        "GBL3030.KIT: four closed and two parked catches required but installation unresolved; not included as fitted hardware in parts CSV. See model.bifold_completion.catch_requirements. No STEP available from retailer."
    )


def add_load_screening(model):
    from .profiles import section

    for d in model["doors"]:
        if d["type"] != "bifold":
            continue
        rows = []
        for p in model["parts"]:
            if p["assembly"] != d["id"] or p.get("motion_leaf") not in ("a", "b"):
                continue
            mass = None
            if p["category"] == "extrusion":
                mass = section(p["product_code"]).Area() * p["cut_length_mm"] * 2700e-9
            elif p["material"] == "polycarbonate":
                mass = math.prod(p["size"]) * 1200e-9
            elif p.get("product_code") == "BF-CORNER-65":
                mass = ((65**2 - 35**2) * 4 - 3 * math.pi * 3.25**2 * 4) * 8000e-9
            elif p.get("product_code") == "BF-CARRIER-METAL":
                # Gross envelope, no credit for holes; radii remain unspecified.
                mass = math.prod(p["size"]) * 2700e-9
            elif p.get("product_code") == "GHD9008B":
                mass = p["mass_kg"]
            if mass is not None:
                x = p["motion_local"][0]
                frame_x = x + (d["primary_link_mm"][0] if p["motion_leaf"] == "b" else 0)
                rows.append(
                    dict(
                        part_id=p["id"],
                        leaf=p["motion_leaf"],
                        mass_kg=mass,
                        frame_moment_Nm=mass * 9.81 * frame_x / 1000,
                        interleaf_moment_Nm=mass * 9.81 * x / 1000
                        if p["motion_leaf"] == "b"
                        else 0,
                    )
                )
        d["load_screening"] = dict(
            included_parts=rows,
            included_mass_kg=sum(r["mass_kg"] for r in rows),
            closed_frame_moment_Nm=sum(r["frame_moment_Nm"] for r in rows),
            closed_interleaf_moment_Nm=sum(r["interleaf_moment_Nm"] for r in rows),
            status="partial-dead-load-screening-not-a-rating",
            assumptions="3030 vendor section area, aluminium 2700 kg/m3, PC 1200, stainless 8000; 9.81 m/s2. Carrier gross envelope. Excludes hinges, fasteners, catches, seals, impact, sag and guide reactions. Not a complete door mass or design load.",
        )


@lru_cache(maxsize=1)
def park_bracket():
    import cadquery as cq

    def box(size, pos):
        return cq.Workplane("XY").box(*size).val().translate(pos)

    # Rigid three-dimensional bracket mounted on the jamb's external slot.
    shape = box((30, 4, 60), (-17.5, 6, 0))
    shape = shape.fuse(box((4, 27, 20), (-4.5, -5.5, 0)))
    shape = shape.fuse(box((12, 4, 20), (-0.5, -17, 0)))
    stop = box((18, 4, 20), (17.5, 4, 0)).rotate((0, 0, 0), (0, 0, 1), -88)
    shape = shape.fuse(stop)
    for z in (-15, 15):
        shape = shape.cut(
            cq.Solid.makeCylinder(3.25, 6, cq.Vector(-17.5, 3, z), cq.Vector(0, 1, 0))
        )
    bb = shape.BoundingBox()
    center = [(bb.xmin + bb.xmax) / 2, (bb.ymin + bb.ymax) / 2, 0]
    return shape.translate(tuple(-v for v in center)), center, [bb.xlen, bb.ylen, bb.zlen]


def complete_bifolds(model):
    from .core import _add, _rotate

    parts = model["parts"]
    by_id = {p["id"]: p for p in parts}
    H = model["parameters"]["height_mm"]
    for d in model["doors"]:
        if d["type"] != "bifold":
            continue
        did = d["id"]
        add_handle_studies(model, d, by_id)
        for role in ("a", "b"):
            prefix = f"{did}-{role}"
            a, b, low, high = [
                by_id[prefix + "-" + k] for k in ("stile-a", "stile-b", "rail-low", "rail-high")
            ]
            for sx, stile in ((1, a), (-1, b)):
                for sz, rail in ((1, low), (-1, high)):
                    local = list(stile["motion_local"])
                    local[0] += sx * 17.5
                    local[1] += 17
                    local[2] = rail["motion_local"][2] + sz * 17.5
                    offset = [local[i] - stile["motion_local"][i] for i in range(3)]
                    pid = prefix + f"-corner-plate-{sx}-{sz}"
                    holes = [
                        dict(axis="y", center=[sx * x, sz * z], diameter_mm=6.5)
                        for x, z in ((-17.5, -17.5), (-17.5, 12.5), (12.5, -17.5))
                    ]
                    parts.append(
                        dict(
                            id=pid,
                            name="Leaf corner gusset 65 x 65 x 4",
                            category="hardware",
                            material="304 stainless steel",
                            supplier="Prepared part; supplier pending",
                            product_code="BF-CORNER-65",
                            size=[65, 4, 65],
                            position=_add(stile["position"], _rotate(offset, d["base_deg"])),
                            rotation_deg=d["base_deg"],
                            assembly=did,
                            quantity=1,
                            physical=True,
                            geometry_fidelity="nominal-solid",
                            motion_leaf=role,
                            motion_local=local,
                            holes=holes,
                            cutouts=[
                                dict(
                                    kind="rectangle",
                                    normal_axis=1,
                                    width_mm=35,
                                    height_mm=35,
                                    center_local_mm=[sx * 15, 0, sz * 15],
                                )
                            ],
                            fastener_schedule=dict(
                                quantity=3,
                                screw="M6 x 12 socket head candidate",
                                nut="slot-8 M6; thread position/engagement pending",
                            ),
                            machining="L plate 65 square, 30 mm legs, 4 thick, three 6.5 bores; inward face, glazing slot unobstructed. Capacity and fastener engagement pending.",
                        )
                    )
                    d["part_ids"].append(pid)
                    # Actual stile/rail butt faces, in their shared leaf-local basis.
                    world = _add(
                        rail["position"], _rotate([-sx * rail["size"][0] / 2, 0, 0], d["base_deg"])
                    )
                    la = _rotate(
                        [world[i] - stile["position"][i] for i in range(3)], -d["base_deg"]
                    )
                    lb = _rotate([world[i] - rail["position"][i] for i in range(3)], -d["base_deg"])
                    model["joints"].append(
                        dict(
                            id=f"{stile['id']}--{rail['id']}",
                            part_a=stile["id"],
                            part_b=rail["id"],
                            local_a=la,
                            local_b=lb,
                            normal_a=[sx, 0, 0],
                            normal_b=[-sx, 0, 0],
                            feature_type="mating-plane",
                            angular_tolerance_deg=0.01,
                            tolerance_mm=0.01,
                            contact=dict(
                                type="mating", max_overlap_mm3=0.01, minimum_contact_area_mm2=1
                            ),
                            mounting_verified=False,
                            connector_ids=[pid],
                        )
                    )
        for suffix in ("carrier-upright", "carrier-shelf"):
            carrier = by_id[did + "-" + suffix]
            carrier.update(
                material="6061-T6 aluminium",
                product_code="BF-CARRIER-METAL",
                geometry_fidelity="nominal-solid",
                purchase_unit="One-piece machined upright and shelf; not separate bonded pieces",
                quantity=1 if suffix == "carrier-upright" else 0,
                machining="Machine upright and shelf as one metal component with internal radii; final radii, alloy certificate and capacity pending. Existing M6 mounting and M4 axle datums retained.",
            )
            carrier["mounting"] = (
                "Metal carrier; two M6 slot fixings on 30 mm centres. Confirm clamp torque, screw lengths and tool clearance."
            )
            if suffix == "carrier-upright":
                carrier["fastener_schedule"] = dict(
                    quantity=2,
                    screw="M6 x 16 candidate; 8 mm carrier plus nut setback/engagement",
                    nut="M6 slot-8; exact thread depth pending",
                )
        # Two vertically separated fixings resist rotation of each closing tab.
        for i in range(2):
            stop = by_id[f"{did}-closed-stop-{i}"]
            stop["size"][2] = 50
            stop["holes"] = [dict(axis="y", center=[-15, zz], diameter_mm=6.5) for zz in (-15, 15)]
            stop["machining"] = (
                "60 x 50 x 4 closing tab; two 6.5 holes on vertical 30 mm pitch, M6 slot fixings. Contact pad and impact rating pending."
            )
            stop["fastener_schedule"] = dict(
                quantity=2, screw="M6 x 12 candidate", nut="M6 slot-8; engagement pending"
            )
        for i, z in enumerate((150, H - 55 - 150)):
            _, center, size = park_bracket()
            local = [center[0], center[1], z]
            pid = f"{did}-park-operating-stop-{i}"
            parts.append(
                dict(
                    id=pid,
                    name="88 degree parked operating stop bracket",
                    category="hardware",
                    material="steel",
                    supplier="Prepared part; supplier pending",
                    product_code="BF-PARK-88",
                    size=size,
                    position=_add(d["pivot"], _rotate(local, d["base_deg"])),
                    rotation_deg=d["base_deg"],
                    assembly=did,
                    physical=True,
                    quantity=1,
                    geometry_fidelity="nominal-solid",
                    geometry=dict(kind="park-stop-bracket"),
                    fastener_schedule=dict(quantity=2, screw="M6 x 12 candidate", nut="M6 slot-8"),
                    machining="Joined metal bracket with two jamb fixings on 30 mm centres. Stop face at 88 degrees; impact, radii and pad specification require approval.",
                )
            )
            d["part_ids"].append(pid)
            pad_local = _rotate([17.5, 7, z], -88)
            pad_id = pid + "-pad"
            parts.append(
                dict(
                    id=pad_id,
                    name="Parked stop contact pad",
                    category="hardware",
                    material="EPDM rubber",
                    supplier="To be selected",
                    product_code="BF-PARK-PAD",
                    size=[18, 2, 20],
                    position=_add(d["pivot"], _rotate(pad_local, d["base_deg"])),
                    rotation_deg=d["base_deg"] - 88,
                    assembly=did,
                    physical=True,
                    quantity=1,
                    deformable=True,
                    geometry_fidelity="unconfirmed-flexible-seal",
                    machining="2 mm replaceable contact pad; adhesive/mechanical retention, hardness and compression pending",
                )
            )
            d["part_ids"].append(pad_id)
        d["design_completion"] = dict(
            frame_joint="Four inward-face L plates per leaf; glazing slots stay clear",
            carrier="One-piece metal carrier; unchanged axle/mounting datums",
            closing_tabs="Two M6 fixing stations per tab, 30 mm apart",
            retailer_questions_pending=True,
        )
    model["assumptions"].append(
        dict(
            id="bifold-corner-and-carrier-design",
            confirmed=False,
            description="Leaf corner plates and metal carriers are dimensioned design proposals, not capacity approval. Confirm M6 slot hardware, engagement, carrier root radii, hinge loading, racking and adjustment. Handle/catch CAD and gasket compound evidence pending.",
            references=["left-rear-a-corner-plate-1-1", "back-right-carrier-upright"],
        )
    )
    model["ordering"]["unresolved"].append(
        "Bifold L-plate connections, metal carrier details and full M6 fixing schedule require supplier review; fabrication/commissioning excluded from current design pass"
    )
    add_design_schedules(model)
    add_load_screening(model)

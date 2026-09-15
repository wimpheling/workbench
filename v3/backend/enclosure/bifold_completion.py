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
    # Both bottom catch installations were removed by user instruction.
    from .swing_latch import add_latches

    add_latches(model)
    schedules = []
    model["assumptions"].append(
        dict(
            id="bifold-bottom-removal",
            confirmed=False,
            description="Both bifolds omit bottom perimeter strips and complete closed catches by user choice. Lower openings are unsealed; light retention uses a manual printed swing latch at each folding joint. Intentional lower gaps are accepted for a simple enclosure; fitted barriers remain checked.",
            references=[d["id"] for d in model["doors"] if d["type"] == "bifold"],
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
        "Both bifold bottom seals/backing/stops and complete closed catches omitted by user choice. No magnetic catch procurement or magnet holder prints required. Lower openings are unsealed and manual printed swing latches provide light retention; parked retention remains omitted."
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
            elif p.get("product_code") == "CJP3030L":
                mass = ((88**2 - 62**2) * 2 - 5 * math.pi * 3.25**2 * 2) * 7850e-9
            elif p.get("product_code") == "STOCK-ANGLE-80x40x6-CARRIER":
                mass = p["mass_kg"]
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
            assumptions="3030 vendor section area, aluminium 2700 kg/m3, PC 1200, plated steel 7850; 9.81 m/s2. Carrier catalogue unperforated stock mass. Excludes hinges, fasteners, catches, seals, impact, sag and guide reactions. Not a complete door mass or design load.",
        )


@lru_cache(maxsize=1)
def park_bracket():
    import cadquery as cq

    def box(size, pos):
        return cq.Workplane("XY").box(*size).val().translate(pos)

    # One-piece PETG prototype. Keep jamb/contact datums; thicken away from
    # the moving leaf. Two transverse ribs carry the arm back to the root.
    shape = box((30, 8, 60), (-17.5, 4, 0))
    shape = shape.fuse(box((8, 27, 20), (-6.5, -5.5, 0)))
    shape = shape.fuse(box((12, 8, 20), (-0.5, -17, 0)))
    stop = box((18, 8, 20), (17.5, 2, 0)).rotate((0, 0, 0), (0, 0, 1), -88)
    shape = shape.fuse(stop)
    for z in (-10, 4):
        rib = (
            cq.Workplane("XY")
            .polyline([(-26, 1), (-2.5, 1), (0, -24), (-8, -24)])
            .close()
            .extrude(6)
            .val()
            .translate((0, 0, z))
        )
        shape = shape.fuse(rib)
    for z in (-15, 15):
        # Open washer/socket access from outside, without thinning the root.
        shape = shape.cut(
            cq.Solid.makeCylinder(7, 40, cq.Vector(-17.5, -40, z), cq.Vector(0, 1, 0))
        )
        shape = shape.cut(
            cq.Solid.makeCylinder(3.25, 10, cq.Vector(-17.5, -1, z), cq.Vector(0, 1, 0))
        )
    shape = shape.clean()
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
                    local[0] += sx * 31
                    local[1] += 16
                    local[2] = rail["motion_local"][2] + sz * 31
                    offset = [local[i] - stile["motion_local"][i] for i in range(3)]
                    pid = prefix + f"-corner-plate-{sx}-{sz}"
                    holes = [
                        dict(axis="y", center=[sx * x, sz * z], diameter_mm=6.5)
                        for x, z in ((-31, -31), (-31, -1), (-31, 29), (-1, -31), (29, -31))
                    ]
                    parts.append(
                        dict(
                            id=pid,
                            name="CJP3030L standard leaf joining plate · drawing study",
                            category="hardware",
                            material="zinc-plated steel",
                            supplier="Reiman Portugal / Wolweiss",
                            product_code="CJP3030L",
                            source="https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/cjp.pdf",
                            size=[88, 2, 88],
                            position=_add(stile["position"], _rotate(offset, d["base_deg"])),
                            rotation_deg=d["base_deg"],
                            assembly=did,
                            quantity=1,
                            physical=True,
                            geometry_fidelity="drawing-based-unconfirmed-solid",
                            motion_leaf=role,
                            motion_local=local,
                            holes=holes,
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
                                screw="M6 x 10 ISO 7380 button head (10.5 dia x 3.3 high) + 1.6 mm metal washer candidate; 2 mm plate, nut engagement pending",
                                nut="BPN08M6 pre-assembly; exact stepped section/engagement pending",
                            ),
                            machining="Bought CJP3030L: 88 mm arms, 26 mm wide, 2 mm thick, five 6.5 mm holes on 30 mm pitch. Drawing study uses sharp corners; actual radii and STEP pending. Inward face leaves glazing slots free. M6 slot nuts, thread engagement, torque and joint capacity remain unvalidated.",
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
        # Two vertically separated fixings resist rotation of each closing tab.
        for i in range(2):
            stop = by_id[f"{did}-closed-stop-{i}"]
            stop.update(
                product_code="STOCK-FLAT-50x4-CLOSING-TAB",
                supplier="COMMENT FER stock candidate; cut/drill locally",
                source="https://www.leroymerlin.pt/produtos/barra-chata-aco-50mm-esp-4-mm-comprimento-0-5-metro-89948500.html",
                cut_length_mm=60,
            )
            stop["size"][2] = 50
            stop["holes"] = [dict(axis="y", center=[-15, zz], diameter_mm=6.5) for zz in (-15, 15)]
            stop["machining"] = (
                "Saw 60 mm length from 50 x 4 steel flat stock; two 6.5 holes on vertical 30 mm pitch, M6 slot fixings. Contact pad and impact rating pending."
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
                    name="88 degree parked stop · ribbed PETG prototype",
                    category="hardware",
                    material="PETG",
                    supplier="In-house print · Bambu A1 mini",
                    product_code="BF-PARK-88",
                    size=size,
                    position=_add(d["pivot"], _rotate(local, d["base_deg"])),
                    rotation_deg=d["base_deg"],
                    assembly=did,
                    physical=True,
                    quantity=1,
                    geometry_fidelity="custom-print-prototype-solid",
                    geometry=dict(kind="park-stop-bracket"),
                    fastener_schedule=dict(
                        quantity=2,
                        screw="M6 x 16 candidate; 8 mm PETG + metal washer, engagement pending",
                        nut="M6 slot-8; no printed threads",
                    ),
                    machining="One-piece PETG print with 8 mm root/arm and two 6 mm ribs; two 6.5 mm through-holes at 30 mm pitch. Use metal M6 washers and slot nuts. Gentle travel stop only: PETG clamp creep, layer strength, impact and bumper adhesion unvalidated; not a slam stop or parked latch.",
                    print_spec=dict(
                        printer="Bambu A1 mini",
                        build_volume_mm=[180, 180, 180],
                        material="PETG",
                        orientation="Assembly Z vertical; lower end of 60 mm mounting plate on bed. XY layers follow arm/rib load path; support arm undersides, keep supports out of holes.",
                        layer_height_mm=0.2,
                        wall_loops=6,
                        infill_percent=50,
                        settings_status="Starting coupon settings, not strength validation; inspect slicer/supports and hole fit",
                        quantity_total=4,
                        use="Gentle end-of-travel only; no parked retention fitted, so closing drift is possible",
                    ),
                )
            )
            d["part_ids"].append(pid)
            for j, dz in enumerate((-15, 15)):
                washer_id = pid + f"-washer-{j}"
                washer_local = [-17.5, -0.8, z + dz]
                parts.append(
                    dict(
                        id=washer_id,
                        name="M6 metal washer · nominal 12 x 6.4 x 1.6 mm",
                        category="hardware",
                        material="steel",
                        supplier="Standard fastener retailer; exact item pending",
                        product_code="M6-WASHER-12",
                        quantity=1,
                        physical=True,
                        size=[12, 1.6, 12],
                        position=_add(d["pivot"], _rotate(washer_local, d["base_deg"])),
                        rotation_deg=d["base_deg"],
                        assembly=did,
                        geometry_fidelity="nominal-standard-fastener-no-vendor-step",
                        geometry=dict(kind="park-stop-washer"),
                        machining="Buy metal M6 flat washer; do not print. Nominal dimensions, exact item/grade and bearing/creep validation pending.",
                    )
                )
                d["part_ids"].append(washer_id)
            pad_local = _rotate([17.5, 7, z], -88)
            pad_id = pid + "-pad"
            parts.append(
                dict(
                    id=pad_id,
                    name="Parked stop pad · cut from retail 2 mm EPDM sponge candidate",
                    category="hardware",
                    material="EPDM rubber sponge",
                    supplier="RS PRO 205-418 stock-sheet candidate",
                    product_code="BF-PARK-PAD",
                    size=[18, 2, 20],
                    position=_add(d["pivot"], _rotate(pad_local, d["base_deg"])),
                    rotation_deg=d["base_deg"] - 88,
                    assembly=did,
                    physical=True,
                    quantity=1,
                    deformable=True,
                    geometry_fidelity="unconfirmed-flexible-seal",
                    source="https://docs.rs-online.com/88bf/A700000012600528.pdf",
                    purchase_url="https://pt.rs-online.com/web/p/laminas-de-caucho/0205418",
                    machining="Scissor-cut 18 x 20 mm pad from bought 2 mm self-adhesive EPDM sponge (RS PRO 205-418 candidate); four pads share one sheet/offcut, not four sheets. No custom machining. Actual adhesive stack, compression, PETG adhesion and wear unvalidated; poor oil resistance; not impact-rated.",
                )
            )
            d["part_ids"].append(pad_id)
        d["design_completion"] = dict(
            frame_joint="Four inward-face L plates per leaf; glazing slots stay clear",
            carrier="Cut/drilled 80x40x6 stock steel angle; unchanged axle/mounting datums",
            closing_tabs="Two M6 fixing stations per tab, 30 mm apart",
            retailer_questions_pending=True,
        )
    model["assumptions"].append(
        dict(
            id="bifold-corner-and-carrier-design",
            confirmed=False,
            description="Standard CJP3030L plates are drawing studies; metal carriers are dimensioned design proposals, not capacity approval. Confirm M6 slot hardware, engagement, carrier root radii, hinge loading, racking and adjustment. Handle CAD, slot-nut seating and gasket compound evidence pending.",
            references=["left-rear-a-corner-plate-1-1", "back-right-carrier-upright"],
        )
    )
    model["ordering"]["unresolved"].append(
        "Bifold L-plate connections, metal carrier details and full M6 fixing schedule require supplier review; fabrication/commissioning excluded from current design pass"
    )
    model["assumptions"].append(
        dict(
            id="printed-park-stop-prototype",
            confirmed=False,
            description="Four ribbed PETG parked stops are unvalidated gentle-travel prototypes, not rated impact restraints. Verify printed strength, M6 washer bearing/clamp creep, fixing engagement, pad adhesion and cycle life. No parked retention is fitted; the stops do not prevent closing drift.",
            references=[
                f"{did}-park-operating-stop-{i}"
                for did in ("left-rear", "back-right")
                for i in range(2)
            ],
        )
    )
    model["ordering"]["unresolved"].append(
        "PETG parked stops: print/support and hole-fit trial, washer bearing/clamp creep, rubber pad attachment and gentle-contact load/cycle validation pending; no slam rating"
    )
    add_design_schedules(model)
    add_load_screening(model)

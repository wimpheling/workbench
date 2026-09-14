"""Unscaled GN4470 vendor components; importing CAD is not mounting approval."""

import math
from functools import lru_cache
from pathlib import Path

ASSET = Path(__file__).parent / "assets" / "GN_4470-50-C2-L3-SR.step"


@lru_cache(maxsize=2)
def catch_component(component):
    """Return centred vendor solid, source centre and size in source axes.

    The source magnetic face is Z=15.5; the L3 contact face is coincident.
    Body counterbores open toward +Y; flat mounting back is Y=-5. Do not use the supplied touching assembly as
    proof of engagement on the enclosure or as a printed adapter.
    """
    import cadquery as cq

    if component not in ("magnet", "strike"):
        raise ValueError("Expected GN4470 magnet or strike")
    solids = cq.importers.importStep(str(ASSET)).val().Solids()
    if len(solids) != 2:
        raise ValueError("GN4470 C2/L3 STEP must contain magnet and contact plate")
    # Identify by full-length dimension, not importer-specific solid ordering.
    target = 50 if component == "magnet" else 28
    matches = [s for s in solids if abs(s.BoundingBox().xlen - target) < 1e-5]
    if len(matches) != 1 or not matches[0].isValid():
        raise ValueError("Unexpected GN4470 component geometry")
    shape = matches[0]
    bb = shape.BoundingBox()
    centre = [(getattr(bb, a + "min") + getattr(bb, a + "max")) / 2 for a in "xyz"]
    size = [bb.xlen, bb.ylen, bb.zlen]
    return shape.translate(tuple(-v for v in centre)), centre, size


def rotate_xy(point, angle):
    a = math.radians(angle)
    x, y, z = point
    return [x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a), z]


def source_origin(role):
    return [-47.5, -30, 0] if role == "magnet" else rotate_xy([-45.5, -30, 0], 88)


def orient_source(shape, role):
    # Source X becomes vertical. Strike's +88 rotation cancels primary -88 at park.
    shape = shape.rotate((0, 0, 0), (0, 1, 0), 90)
    if role == "strike":
        shape = shape.rotate((0, 0, 0), (0, 0, 1), 88)
    return shape.translate(tuple(source_origin(role)))


def centred(shape):
    bb = shape.BoundingBox()
    centre = [(getattr(bb, a + "min") + getattr(bb, a + "max")) / 2 for a in "xyz"]
    return shape.translate(tuple(-v for v in centre)), centre, [bb.xlen, bb.ylen, bb.zlen]


@lru_cache(maxsize=2)
def installed_component(role):
    shape, centre, _ = catch_component(role)
    shape = shape.translate(tuple(centre))
    if role == "magnet":
        # Face the counterbores away from the holder, keeping magnetic +Z face.
        shape = shape.rotate((0, 0, 0), (0, 0, 1), 180)
    return centred(orient_source(shape, role))


@lru_cache(maxsize=2)
def holder_component(role):
    """One-piece PETG holder in fixed-frame or primary-leaf local coordinates."""
    import cadquery as cq

    def box(size, position):
        return cq.Workplane("XY").box(*size).val().translate(position)

    root_x = -17.5 if role == "magnet" else 17.5
    root = box((30, 8, 64), (root_x, 4, 0))
    if role == "magnet":
        head = box((33, 8, 64), (-47.5, -21, 0))
        for z in (-19, 19):
            head = head.cut(
                cq.Solid.makeCylinder(2.75, 10, cq.Vector(-47.5, -26, z), cq.Vector(0, 1, 0))
            )
        polygon = [(-64, -17), (-31, -17), (-2.5, 0), (-2.5, 8), (-32.5, 8), (-64, -9)]
        shape = root.fuse(head)
        for z, thickness in ((-32, 6), (-4, 8), (26, 6)):
            web = (
                cq.Workplane("XY")
                .polyline(polygon)
                .close()
                .extrude(thickness)
                .val()
                .translate((0, 0, z))
            )
            shape = shape.fuse(web)
    else:
        head = box((32, 6, 32), (0, 0, 37.5))
        for x in (-8, 8):
            head = head.cut(
                cq.Solid.makeCylinder(2.75, 8, cq.Vector(x, -4, 37.5), cq.Vector(0, 1, 0))
            )
        shape = root.fuse(orient_source(head, role))
        polygon = [(12, 0), (24, -24), (27, -24), (27, 5), (12, 5)]
        for z in (-22, 16):
            web = cq.Workplane("XY").polyline(polygon).close().extrude(6).val().translate((0, 0, z))
            shape = shape.fuse(web)
    for z in (-22, 22):
        shape = shape.cut(
            cq.Solid.makeCylinder(7, 50, cq.Vector(root_x, -50, z), cq.Vector(0, 1, 0))
        )
        shape = shape.cut(
            cq.Solid.makeCylinder(3.25, 10, cq.Vector(root_x, -1, z), cq.Vector(0, 1, 0))
        )
    return centred(shape.clean())


@lru_cache(maxsize=4)
def fixing_component(role, index):
    """Nominal bought M5 screw/washer/nut solids, not vendor STEP or a grade approval."""
    import cadquery as cq

    x = (-19, 19)[index] if role == "magnet" else (-8, 8)[index]
    z = 0 if role == "magnet" else 37.5
    seat, length, washer_y = (0.4, 25, 13) if role == "magnet" else (-5, 16, 3)
    axis = cq.Vector(0, 1, 0)
    head = cq.Solid.makeCylinder(4.25, 5, cq.Vector(x, seat - 5, z), axis)
    shaft = cq.Solid.makeCylinder(2.5, length, cq.Vector(x, seat, z), axis)
    screw = head.fuse(shaft)
    washer = cq.Solid.makeCylinder(5, 1, cq.Vector(x, washer_y, z), axis).cut(
        cq.Solid.makeCylinder(2.65, 3, cq.Vector(x, washer_y - 1, z), axis)
    )
    nut = cq.Workplane("XY").polygon(6, 8 / math.cos(math.pi / 6)).extrude(5).val()
    nut = nut.cut(cq.Solid.makeCylinder(2.5, 7, cq.Vector(0, 0, -1)))
    nut = nut.rotate((0, 0, 0), (1, 0, 0), -90).translate((x, washer_y + 1, z))
    return centred(orient_source(cq.Compound.makeCompound([screw, washer, nut]), role))


def add_parked_catches(model):
    from .core import _add, _rotate

    ids = []
    for door in model["doors"]:
        if door["type"] != "bifold":
            continue
        did = door["id"]
        # Centre station scales with leaf height, away from the hinge/stop stations.
        z = model["parameters"]["height_mm"] / 4 + 65
        for role in ("magnet", "strike"):
            for kind, geometry_fn in (
                ("vendor", installed_component),
                ("holder", holder_component),
            ):
                _, centre, size = geometry_fn(role)
                local = _add(centre, [0, 0, z])
                pid = f"{did}-park-catch-{role}" + ("-holder" if kind == "holder" else "")
                part = dict(
                    id=pid,
                    name=f"Parked catch {role} · "
                    + (
                        "ribbed PETG holder prototype"
                        if kind == "holder"
                        else "GN4470 C2/L3 vendor STEP"
                    ),
                    category="hardware",
                    material="PETG"
                    if kind == "holder"
                    else ("zinc alloy / NdFeB / TPE" if role == "magnet" else "zinc-plated steel"),
                    supplier="In-house A1 mini print" if kind == "holder" else "Ganter",
                    product_code=f"BF-CATCH-{role.upper()}-HOLDER"
                    if kind == "holder"
                    else "GN 4470-50-C2-L3-SR",
                    quantity=0 if kind == "vendor" and role == "strike" else 1,
                    purchase_unit="One complete magnet + L3 strike kit"
                    if kind == "vendor"
                    else "One printed holder",
                    size=size,
                    position=_add(door["pivot"], _rotate(local, door["base_deg"])),
                    rotation_deg=door["base_deg"],
                    assembly=did,
                    physical=True,
                    geometry_fidelity="custom-print-prototype-solid"
                    if kind == "holder"
                    else "supplier-step-mounted-prototype",
                    geometry=dict(kind="parked-catch-" + kind, role=role),
                    machining="Retention-only prototype; 2 mm nominal parked air gap is NOT a holding-force rating. Fixing engagement, print strength/creep, tolerances and cycle tests pending.",
                )
                if role == "strike":
                    part.update(motion_leaf="a", motion_local=local)
                if kind == "vendor":
                    part.update(
                        cad_asset=ASSET.name,
                        source="https://www.ganternorm.com/en/products/3.9-Holding-with-magnets/Retaining-magnets-rectangular-shaped/GN-4470-Magnetic-catches-with-rubberized-magnetic-surface",
                    )
                else:
                    part.update(
                        fastener_schedule=dict(
                            quantity=2,
                            screw="M6 x 16 candidate + metal flat washer; 8 mm PETG root, engagement/creep pending",
                            nut="M6 slot-8; no printed threads",
                        ),
                        print_spec=dict(
                            printer="Bambu A1 mini",
                            material="PETG",
                            build_volume_mm=[180, 180, 180],
                            layer_height_mm=0.2,
                            wall_loops=6,
                            infill_percent=50,
                            orientation="Assembly Z vertical, lowest root edge on bed. Support projecting shelves; inspect bore/support access. Trial settings, not strength approval.",
                        ),
                    )
                model["parts"].append(part)
                door["part_ids"].append(pid)
                ids.append(pid)
            for index in range(2):
                _, centre, size = fixing_component(role, index)
                local = _add(centre, [0, 0, z])
                part = dict(
                    id=f"{did}-park-catch-{role}-m5-{index}",
                    name="M5 catch fixing · nominal screw, washer and locknut",
                    category="hardware",
                    material="steel",
                    supplier="Standard fastener retailer; grade/item pending",
                    product_code="M5-FIXING-CATCH",
                    quantity=1,
                    physical=True,
                    size=size,
                    position=_add(door["pivot"], _rotate(local, door["base_deg"])),
                    rotation_deg=door["base_deg"],
                    assembly=did,
                    geometry_fidelity="nominal-fastener-assembly-no-vendor-step",
                    geometry=dict(kind="parked-catch-fixing", role=role, index=index),
                    fastener_schedule=dict(
                        quantity=1,
                        screw="M5 x "
                        + ("25" if role == "magnet" else "16")
                        + " candidate + M5 metal washer",
                        nut="M5 metal locknut; seat, protrusion, grade and locking validation pending",
                    ),
                    machining="Nominal unthreaded screw/washer/nut geometry; buy actual fasteners, not printed copies. Recheck supplied head/nut dimensions.",
                )
                if role == "strike":
                    part.update(motion_leaf="a", motion_local=local)
                model["parts"].append(part)
                door["part_ids"].append(part["id"])
    model["assumptions"].append(
        dict(
            id="parked-magnetic-catch-prototype",
            confirmed=False,
            description="GN4470 parked catches use real STEP on PETG offset holders with nominal metal fixings. Two millimetres parked gap has unconfirmed holding force; no force, slam, creep or cycle rating. Separate operating stops remain required.",
            references=ids,
        )
    )
    model["ordering"]["unresolved"].append(
        "GN4470 parked retention: verify real gap/pull, M5/M6 fastening, PETG print/clamp strength and creep, tolerance, approach and accidental-release/cycle tests; not a rated stop"
    )

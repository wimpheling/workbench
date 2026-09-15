"""Closed-only retention study; genuine A1/L2 CAD and separate PETG adapters."""

from functools import lru_cache
from pathlib import Path

ASSET = Path(__file__).parent / "assets" / "GN_4470-50-A1-L2-SR.step"
SOURCE = "https://reiman.pt/pt/gn-4470-50-a1-l2-sr-magnetic-catches-magnetic-surface-top-with-bore/"


@lru_cache(maxsize=2)
def vendor(role):
    import cadquery as cq

    from .magnetic_catches import centred

    if role not in ("magnet", "strike"):
        raise ValueError("Unknown closed catch component")
    solids = cq.importers.importStep(str(ASSET)).val().Solids()
    target = 50 if role == "magnet" else 28
    shape = next(s for s in solids if abs(s.BoundingBox().xlen - target) < 1e-5)
    shape = shape.rotate((0, 0, 0), (1, 0, 0), 180).translate(
        (0, 70, 39 if role == "magnet" else 37.5)
    )
    return centred(shape)


@lru_cache(maxsize=2)
def holder(role):
    import cadquery as cq

    from .magnetic_catches import centred

    def box(size, pos):
        return cq.Workplane("XY").box(*size).val().translate(pos)

    def bore(s, r, origin, axis, length):
        return s.cut(cq.Solid.makeCylinder(r, length, cq.Vector(*origin), cq.Vector(*axis)))

    if role == "magnet":
        s = box((80, 6, 30), (0, 41, -15))
        for xx in (-37, 37):
            s = s.fuse(box((6, 6, 46), (xx, 41, -7)))
            s = s.fuse(box((6, 43, 6), (xx, 59.5, 13)))
        s = s.fuse(box((80, 6, 70), (0, 78, 29)))
        for xx in (-40, 34):
            rib = (
                cq.Workplane("YZ")
                .polyline([(44, 16), (75, 16), (75, 58)])
                .close()
                .extrude(6)
                .val()
                .translate((xx, 0, 0))
            )
            s = s.fuse(rib)
        for xx in (-20, 20):
            s = bore(s, 3.25, (xx, 37, -15), (0, 1, 0), 8)
            s = s.cut(cq.Solid.makeCone(3, 6, 3, cq.Vector(xx, 41.7, -15), cq.Vector(0, 1, 0)))
        for xx in (-19, 19):
            s = bore(s, 2.75, (xx, 74, 39), (0, 1, 0), 8)
    else:
        s = box((60, 6, 28.5), (0, 41, 17.25))
        s = s.fuse(box((60, 24, 6), (0, 50, 28.5)))
        for xx in (-30, 26):
            rib = (
                cq.Workplane("YZ")
                .polyline([(44, 3), (62, 25.5), (44, 25.5)])
                .close()
                .extrude(4)
                .val()
                .translate((xx, 0, 0))
            )
            s = s.fuse(rib)
        for xx in (-19, 19):
            s = bore(s, 3.25, (xx, 37, 18), (0, 1, 0), 8)
        for xx in (-8, 8):
            s = bore(s, 2.75, (xx, 53.5, 24.5), (0, 0, 1), 8)
    return centred(s.clean())


def station(door):
    # Keep the 80 mm fixed adapter at least 5 mm from the interleaf plate,
    # including the supported 650 mm openings.
    span = door["primary_link_mm"][0]
    return min(span * 0.6, span - 137.5)


def add_closed_catches(model):
    from .core import _add, _rotate

    for d in model["doors"]:
        if d["type"] != "bifold":
            continue
        x = station(d)
        z = 0
        d["closed_retention_screening"] = dict(
            quantity=1,
            station_from_primary_pivot_mm=x,
            nominal_catalogue_force_N=30,
            nominal_closed_moment_Nm=30 * x / 1000,
            status="kinematic-screening-not-a-retention-rating",
        )
        for role in ("magnet", "strike"):
            for kind, fn in (("vendor", vendor), ("holder", holder)):
                _, centre, size = fn(role)
                local = _add(centre, [x, 0, z])
                pid = d["id"] + "-closed-catch-" + role + ("-holder" if kind == "holder" else "")
                p = dict(
                    id=pid,
                    name="Closed catch "
                    + role
                    + " · "
                    + (
                        "PETG adapter prototype" if kind == "holder" else "GN4470 A1/L2 vendor STEP"
                    ),
                    category="hardware",
                    material="PETG" if kind == "holder" else "zinc alloy / steel / NdFeB / TPE",
                    supplier="In-house A1 mini print"
                    if kind == "holder"
                    else "Ganter / Reiman Portugal",
                    product_code="BF-CLOSED-" + role.upper() + "-HOLDER"
                    if kind == "holder"
                    else "GN 4470-50-A1-L2-SR",
                    quantity=0 if kind == "vendor" and role == "strike" else 1,
                    physical=True,
                    size=size,
                    position=_add(d["pivot"], _rotate(local, d["base_deg"])),
                    rotation_deg=d["base_deg"],
                    assembly=d["id"],
                    geometry_fidelity="custom-print-prototype-solid"
                    if kind == "holder"
                    else "supplier-step-mounted-prototype",
                    geometry=dict(kind="closed-catch-" + kind, role=role),
                    source=SOURCE,
                    machining="Closed retention only. Adjust L2 strike slots for full face contact; no forced interference/preload. PETG adapters are retention studies, not structural joints. Clamp creep, strength, actual pull force, screw engagement and tolerance pending.",
                )
                if kind == "vendor":
                    p.update(
                        cad_asset=ASSET.name,
                        purchase_unit="Complete magnet + L2 strike kit",
                        fastener_schedule=dict(
                            quantity=2,
                            screw=("M5 x 20" if role == "magnet" else "M5 x 16")
                            + " socket head candidate, metal washers",
                            nut="M5 metal locknuts; through adapter, no printed threads",
                        ),
                    )
                else:
                    p["fastener_schedule"] = dict(
                        quantity=2,
                        screw=(
                            "M6 x 14 DIN 7991 countersunk candidate; head 1 mm proud, no washer"
                            if role == "magnet"
                            else "M6 x 14 socket head candidate + 1.6 mm metal washer"
                        ),
                        nut="BPN08M6 pre-assembly slot-8 nuts; length/engagement pending",
                    )
                    p["print_spec"] = dict(
                        printer="Bambu A1 mini",
                        material="PETG",
                        layer_height_mm=0.2,
                        wall_loops=6,
                        infill_percent=50,
                        orientation="Assembly Z vertical, support as needed; trial settings, strength unvalidated",
                    )
                if role == "strike":
                    p.update(
                        motion_leaf="a",
                        motion_local=local,
                    )
                model["parts"].append(p)
                d["part_ids"].append(pid)
        for role in ("magnet", "strike"):
            for index in range(2):
                _, centre, size = fixing(role, index)
                local = _add(centre, [x, 0, z])
                part = dict(
                    id=f"{d['id']}-closed-catch-{role}-m5-{index}",
                    name="Closed catch M5 screw, washer and locknut · nominal",
                    category="hardware",
                    material="steel",
                    supplier="Standard fastener retailer",
                    product_code=("M5X20" if role == "magnet" else "M5X16")
                    + "-CLOSED-CATCH-FIXING",
                    quantity=1,
                    physical=True,
                    size=size,
                    position=_add(d["pivot"], _rotate(local, d["base_deg"])),
                    rotation_deg=d["base_deg"],
                    assembly=d["id"],
                    geometry_fidelity="nominal-fastener-assembly-no-vendor-step",
                    geometry=dict(kind="closed-catch-fixing", role=role, index=index),
                    machining="M5 nominal unthreaded envelope, 8.5 mm head, 10 mm washer, 8 mm AF x 5 mm nut. Actual grade, locking and tolerances pending.",
                )
                if role == "strike":
                    part.update(
                        motion_leaf="a",
                        motion_local=local,
                    )
                model["parts"].append(part)
                d["part_ids"].append(part["id"])
        for role in ("magnet", "strike"):
            for index in range(2):
                _, centre, size = root_fixing(role, index)
                local = _add(centre, [x, 0, 0])
                part = dict(
                    id=f"{d['id']}-closed-catch-{role}-root-m6-{index}",
                    name="Closed catch M6 root fixing · nominal",
                    category="hardware",
                    material="steel",
                    supplier="Standard fastener retailer",
                    product_code="M6X14-CSK-CLOSED-ROOT"
                    if role == "magnet"
                    else "M6X14-CAP-WASHER-CLOSED-ROOT",
                    quantity=1,
                    physical=True,
                    size=size,
                    position=_add(d["pivot"], _rotate(local, d["base_deg"])),
                    rotation_deg=d["base_deg"],
                    assembly=d["id"],
                    geometry_fidelity="nominal-fastener-assembly-no-vendor-step",
                    geometry=dict(kind="closed-catch-root-fixing", role=role, index=index),
                    machining="Nominal unthreaded M6x14. Fixed countersunk head 1 mm proud to preserve slot-bottom clearance; moving socket head with 1.6 mm washer. Actual nut thread engagement/locking and head dimensions pending.",
                )
                if role == "strike":
                    part.update(motion_leaf="a", motion_local=local)
                model["parts"].append(part)
                d["part_ids"].append(part["id"])
    model["assumptions"].append(
        dict(
            id="closed-catch-installation",
            confirmed=False,
            description="One GN4470 A1/L2 closed catch per guided bifold: one independent opening coordinate per pair. Nominal 30 N catalogue pull is not installation retention or seal preload proof. PETG adapters, fastening, adjustment, release access and motion/tolerances require validation.",
            references=[
                d["id"] + "-closed-catch-magnet" for d in model["doors"] if d["type"] == "bifold"
            ],
        )
    )


@lru_cache(maxsize=4)
def fixing(role, index):
    """Bought M5 screw/washer/nut envelope; unthreaded nominal metal, not CAD."""
    import math

    import cadquery as cq

    from .magnetic_catches import centred

    # Build along +Z first, with bearing plane at zero and thread extending -Z.
    head = cq.Solid.makeCylinder(4.25, 5, cq.Vector(0, 0, 0))
    length = 20 if role == "magnet" else 16
    shaft = cq.Solid.makeCylinder(2.5, length, cq.Vector(0, 0, -length))
    # Distances below bearing plane to washer and nut depend on the mount stack.
    washer_depth = 10.6 if role == "magnet" else 8
    washer = cq.Solid.makeCylinder(5, 1, cq.Vector(0, 0, -washer_depth - 1)).cut(
        cq.Solid.makeCylinder(2.65, 3, cq.Vector(0, 0, -washer_depth - 2))
    )
    nut = (
        cq.Workplane("XY")
        .polygon(6, 8 / math.cos(math.pi / 6))
        .extrude(5)
        .val()
        .translate((0, 0, -washer_depth - 6))
    )
    nut = nut.cut(cq.Solid.makeCylinder(2.5, 7, cq.Vector(0, 0, -washer_depth - 7)))
    s = cq.Compound.makeCompound([head.fuse(shaft), washer, nut])
    if role == "magnet":
        s = s.rotate((0, 0, 0), (1, 0, 0), 90).translate(((-19, 19)[index], 70.4, 39))
    else:
        s = s.translate(((-8, 8)[index], 53.5, 33.5))
    return centred(s)


def engagement_checks(model, shapes):
    """Measure the actual rubber face covered by the strike, in closed CAD."""
    import math

    checks = []
    required = {
        r["assembly"] for r in model.get("bifold_completion", {}).get("catch_requirements", [])
    }
    for d in model["doors"]:
        if d["type"] != "bifold" or d["id"] not in required:
            continue
        aid = d["id"] + "-closed-catch-magnet"
        bid = d["id"] + "-closed-catch-strike"
        row = dict(
            id="assembly.closed-catch-contact." + d["id"],
            category="assembly",
            references=[aid, bid],
            message="Entire magnetic face covered by closed strike; nominal contact only",
            method="OpenCascade magnetic planar face / strike intersection",
            unit="mm²",
        )
        if aid not in shapes or bid not in shapes:
            checks.append(
                dict(**row, status="fail", message_detail="Required closed catch solid missing")
            )
            continue
        angle = math.radians(d["base_deg"])
        normal = (math.sin(angle), -math.cos(angle), 0)
        faces = [
            f
            for f in shapes[aid].Faces()
            if f.geomType() == "PLANE"
            and sum(a * b for a, b in zip(f.normalAt().toTuple(), normal, strict=True)) > 1 - 1e-6
        ]
        # Outermost +Y face is the rubberized contact surface, ahead of the body.
        face = max(
            faces,
            key=lambda f: sum(a * b for a, b in zip(f.Center().toTuple(), normal, strict=True)),
        )
        area = face.Area()
        covered = face.intersect(shapes[bid]).Area()
        checks.append(
            dict(
                **row,
                status="pass" if covered >= area - 1e-5 else "fail",
                measured=covered,
                required=area,
            )
        )
    return checks


@lru_cache(maxsize=4)
def root_fixing(role, index):
    import cadquery as cq

    from .magnetic_catches import centred

    x = ((-20, 20) if role == "magnet" else (-19, 19))[index]
    axis = cq.Vector(0, 1, 0)
    if role == "magnet":
        head = cq.Solid.makeCone(3, 6, 3, cq.Vector(x, 41.7, -15), axis).fuse(
            cq.Solid.makeCylinder(6, 0.3, cq.Vector(x, 44.7, -15), axis)
        )
        shaft = cq.Solid.makeCylinder(3, 10.7, cq.Vector(x, 31, -15), axis)
        s = head.fuse(shaft)
    else:
        head = cq.Solid.makeCylinder(5, 6, cq.Vector(x, 45.6, 18), axis)
        shaft = cq.Solid.makeCylinder(3, 14, cq.Vector(x, 31.6, 18), axis)
        washer = cq.Solid.makeCylinder(6, 1.6, cq.Vector(x, 44, 18), axis).cut(
            cq.Solid.makeCylinder(3.2, 3.6, cq.Vector(x, 43, 18), axis)
        )
        s = cq.Compound.makeCompound([head.fuse(shaft), washer])
    return centred(s)

"""Original PETG swing latch prototype; no vendor CAD or structural rating."""

from functools import lru_cache

import cadquery as cq


def box(size, centre):
    return cq.Workplane("XY").box(*size).val().translate(centre)


@lru_cache(maxsize=8)
def component(role):
    if role == "lever":
        s = cq.Solid.makeCylinder(12, 8, cq.Vector(0, 0, 0), cq.Vector(0, 1, 0))
        s = s.fuse(box((42, 8, 16), (21, 4, 0)))
        s = s.fuse(cq.Solid.makeCylinder(8, 8, cq.Vector(42, 0, 0), cq.Vector(0, 1, 0)))
        s = s.cut(cq.Solid.makeCylinder(3.25, 10, cq.Vector(0, -1, 0), cq.Vector(0, 1, 0)))
    elif role == "keeper":
        s = box((20, 6, 57), (35, 5, -36.5))
        s = s.fuse(box((20, 12.4, 4), (35, 1.8, -10)))
        s = s.fuse(box((20, 4, 22), (35, -2.4, -1)))
        for z in (-30, -55):
            s = s.cut(cq.Solid.makeCylinder(3.25, 10, cq.Vector(35, 0, z), cq.Vector(0, 1, 0)))
    else:
        raise ValueError(role)
    s = s.clean()
    bb = s.BoundingBox()
    c = [(getattr(bb, a + "min") + getattr(bb, a + "max")) / 2 for a in "xyz"]
    return s.translate(tuple(-v for v in c)), c, [bb.xlen, bb.ylen, bb.zlen]


@lru_cache(maxsize=2)
def fixing(role):
    # Nominal ISO 7380 M6 + ISO 7089 washer. No threads or drive recess modeled.
    face = 0 if role == "pivot" else 2
    length = 16 if role == "pivot" else 14
    shaft = cq.Solid.makeCylinder(3, length, cq.Vector(0, face - 1.6, 0), cq.Vector(0, 1, 0))
    head = cq.Solid.makeCylinder(5.25, 3.3, cq.Vector(0, face - 4.9, 0), cq.Vector(0, 1, 0))
    washer = cq.Solid.makeCylinder(6, 1.6, cq.Vector(0, face - 1.6, 0), cq.Vector(0, 1, 0)).cut(
        cq.Solid.makeCylinder(3.2, 2, cq.Vector(0, face - 1.8, 0), cq.Vector(0, 1, 0))
    )
    s = cq.Compound.makeCompound([shaft.fuse(head), washer])
    bb = s.BoundingBox()
    c = [(getattr(bb, a + "min") + getattr(bb, a + "max")) / 2 for a in "xyz"]
    return s.translate(tuple(-v for v in c)), c, [bb.xlen, bb.ylen, bb.zlen]


def add_latches(model):
    from .core import _add, _rotate

    by = {p["id"]: p for p in model["parts"]}
    for d in model["doors"]:
        if d["type"] != "bifold":
            continue
        x = by[d["id"] + "-a-stile-b"]["motion_local"][0]
        z = model["parameters"]["height_mm"] / 2 - 150
        rows = [
            ("lever", "a", component("lever"), [0, 0, 0]),
            ("keeper", "b", component("keeper"), [0, 0, 0]),
            ("pivot", "a", fixing("pivot"), [0, 0, 0]),
            ("root-0", "b", fixing("root"), [35, 0, -30]),
            ("root-1", "b", fixing("root"), [35, 0, -55]),
        ]
        for role, leaf, (_, c, size), offset in rows:
            local = _add([x, 0, z], _add(c, offset))
            world = _add(d["pivot"], _rotate(local, d["base_deg"]))
            if leaf == "b":
                local = [local[i] - d["primary_link_mm"][i] for i in range(3)]
            printed = role in ("lever", "keeper")
            p = dict(
                id=f"{d['id']}-swing-latch-{role}",
                name=f"Swing latch {role} · prototype",
                category="hardware",
                material="PETG" if printed else "steel",
                supplier="In-house print · Bambu A1 mini"
                if printed
                else "Standard fastener retailer",
                product_code=f"BF-SWING-{role.upper()}"
                if printed
                else ("M6x16-ISO7380-WASHER" if role == "pivot" else "M6x14-ISO7380-WASHER"),
                quantity=1,
                assembly=d["id"],
                size=size,
                position=world,
                rotation_deg=d["base_deg"],
                motion_leaf=leaf,
                motion_local=local,
                geometry_fidelity="original-print-prototype"
                if printed
                else "nominal-fastener-no-vendor-step",
                geometry=dict(kind="swing-latch", role=role),
            )
            if role == "lever":
                p["latch_pivot_offset"] = [-v for v in c]
                p["latch_axis_world"] = _rotate([0, 1, 0], d["base_deg"])
                p["latch_pivot_world"] = _add(d["pivot"], _rotate([x, 0, z], d["base_deg"]))
            if printed:
                p["print_spec"] = dict(
                    printer="Bambu A1 mini",
                    material="PETG",
                    layer_mm=0.2,
                    walls=5,
                    infill_percent=50,
                    orientation=(
                        "Broad XZ face on bed" if role == "lever" else "Side YZ face on bed"
                    )
                    + "; ream 6.5 mm bores",
                    status="fit-and-hand-force-prototype",
                )
            else:
                p["fastener_schedule"] = dict(
                    quantity=1,
                    screw="Modeled M6 button head and 1.6 mm washer; 16 mm pivot / 14 mm keeper",
                    nut="BPN08M6 slot nut, one per screw; exact engagement pending, not modeled",
                )
            model["parts"].append(p)
            d["part_ids"].append(p["id"])
        d["manual_latch"] = dict(
            type="lift-to-release-swing-lever",
            quantity=1,
            operation="Lift lever 90 degrees and hold clear while starting to fold. Set it horizontal into keeper after fully closing. Viewer assumes release before opening; not automatic hardware.",
        )
    model["assumptions"].append(
        dict(
            id="swing-latch-prototype",
            confirmed=False,
            description="One PETG lever/keeper per folding joint provides light closed retention only. Adjust pivot friction, verify slot-nut engagement, print fit/creep and gentle pull/cycling. No seal preload, security or slam rating. Lift manually before opening.",
            references=[p["id"] for p in model["parts"] if "-swing-latch-" in p["id"]],
        )
    )

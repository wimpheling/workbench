"""Revision C printed-guide prototype. Dimensions in mm, not a hardware release."""

import math

GAP = 5.0
HEAD = 55.0
BOTTOM = 3.0


def linkage(width):
    primary = (width - 15 - 40) / 2
    secondary = primary + 40
    return dict(
        primary_width_mm=primary,
        secondary_width_mm=secondary,
        primary_link_mm=[primary + 5, 46, 0],
        secondary_link_mm=[secondary - 12.5, -23, 0],
        guide_normal_mm=23.0,
    )


def local_pose(door, theta_deg):
    """Coordinates relative to exterior frame pin, local +Y points inward."""
    p = door["primary_link_mm"]
    q = door["secondary_link_mm"]
    theta = math.radians(theta_deg)
    elbow = [
        p[0] * math.cos(theta) - p[1] * math.sin(theta),
        p[0] * math.sin(theta) + p[1] * math.cos(theta),
        0,
    ]
    ratio = (door["guide_normal_mm"] - elbow[1]) / math.hypot(*q[:2])
    if abs(ratio) > 1 + 1e-10:
        raise ValueError("Printed bifold guide is unreachable")
    phi = math.asin(max(-1, min(1, ratio))) - math.atan2(q[1], q[0])
    if abs(math.degrees(phi) - theta_deg) > 180 + 1e-8:
        raise ValueError("CFG interleaf hinge exceeds 180 degrees")
    slider = [elbow[0] + q[0] * math.cos(phi) - q[1] * math.sin(phi), door["guide_normal_mm"], 0]
    return elbow, slider, math.degrees(phi)


def add_bifolds(part, leaf, doors, parameters):
    from .core import _add, _rotate

    p = parameters
    W, D, H = (p[k] for k in ("width_mm", "depth_mm", "height_mm"))
    for did, origin, base, width, space in [
        ("left-rear", [-30, D, 0], 270, D / 2, 800),
        ("back-right", [W, D + 30, 0], 180, p["back_opening_width_mm"], 450),
    ]:
        pivot = _add(origin, _rotate([2.5, -8, 0], base))
        d = dict(
            id=did,
            type="bifold",
            mechanism="printed-guide-revision-c",
            prototype_status="fit-and-wear-prototype-not-for-manufacture",
            pivot=pivot,
            base_deg=base,
            opening_sign=-1,
            max_angle_deg=88,
            opening_width_mm=width,
            leaf_height_mm=H - HEAD - BOTTOM,
            available_outward_space_mm=space,
            axis_offset_mm=23,
            **linkage(width),
        )
        d["link_length_mm"] = math.hypot(*d["primary_link_mm"][:2])
        d["secondary_link_length_mm"] = math.hypot(*d["secondary_link_mm"][:2])
        closed_elbow, closed_slider, _ = local_pose(d, 0)
        ids = []
        # Frame corners are offset from both pin axes by half the 5 mm gaps.
        for role, width_key, anchor, normal in [
            ("a", "primary_width_mm", pivot, 23),
            ("b", "secondary_width_mm", _add(pivot, _rotate(closed_elbow, base)), -23),
        ]:
            ids += leaf(
                did,
                role,
                d[width_key],
                anchor,
                base,
                normal,
                BOTTOM,
                H - HEAD,
                edge_gap=0,
                start=2.5,
            )

        samples = [local_pose(d, -i / 4) for i in range(353)]
        travel = [s[1][0] + 2.5 for s in samples]
        start = math.floor((min(travel) - 16) / 5) * 5
        rail_length = width - start
        count = math.ceil(rail_length / 150)
        module_length = (rail_length - (count - 1) * 0.2) / count
        d.update(
            guide_travel_mm=[min(travel), max(travel)],
            track_id=f"{did}-track",
            guide_height_mm=H - 15,
            carriage_height_mm=H - 15,
            guide=dict(
                material="PETG",
                printer="Bambu A1 mini",
                module_count=count,
                module_length_mm=module_length,
                rail_start_mm=start,
                rail_end_mm=width,
                mounting_screw_count=count * 6,
                mounting_rows_mm=[-15, 15],
                roller="GN 753.1-22-B5-ZL-1",
                keeper_washer="M6 DIN 9021",
                retention="removable welded steel cassette; connection and impact validation pending",
                exit_slot_mm=10,
                washer_overlap_per_side_mm=4,
                end_bar_thickness_mm=4,
                status="prototype; carrier and retention require physical tests",
            ),
        )

        def add(suffix, size, local, motion=None, **kwargs):
            anchor = pivot
            if motion == "b":
                anchor = _add(pivot, _rotate(closed_elbow, base))
            elif motion == "slider":
                anchor = _add(pivot, _rotate(closed_slider, base))
            item = part(
                f"{did}-{suffix}",
                size,
                _add(anchor, _rotate(local, base)),
                "hardware",
                did,
                base,
                **kwargs,
            )
            if motion:
                item.update(motion_leaf=motion, motion_local=local)
            ids.append(item["id"])
            return item

        for i in range(count):
            x = start + i * (module_length + 0.2) + module_length / 2 - 2.5
            stations = [12 - module_length / 2, 0, module_length / 2 - 12]
            holes = [
                dict(
                    center=[xx, yy],
                    diameter_mm=6.2,
                    counterbore_top_diameter_mm=12.4,
                    counterbore_top_depth_mm=2.2,
                )
                for xx in stations
                for yy in (-15, 15)
            ]
            reliefs = []
            if i == 0:
                reliefs.append(-module_length / 2 + 2)
            if i == count - 1:
                reliefs.append(module_length / 2 - 2)
            add(
                "track" if i == 0 else f"track-{i + 1}",
                [module_length, 46, 25],
                [x, 23, H - 12.5],
                material="PETG",
                product_code="printed-guide-body",
                geometry_fidelity="parametric-print-prototype",
                holes=holes,
                geometry=dict(kind="printed-guide-body"),
                cutouts=[
                    dict(
                        kind="rectangle",
                        normal_axis=2,
                        width_mm=4.4,
                        height_mm=48,
                        center_local_mm=[xx, 0, 0],
                    )
                    for xx in reliefs
                ],
                mounting="Six M4 bolts through continuous steel keepers, 23 mm sleeves and 2 mm steel bridge washers into two 3060 underside slot rows",
                fastener_schedule=dict(quantity=6, screw="M4 x 35 provisional", nut="M4 slot-8"),
            )
            for j, xx in enumerate(stations):
                for side in (-1, 1):
                    add(
                        f"retention-sleeve-{i + 1}-{j}-{side}",
                        [6, 6, 23],
                        [x + xx, 23 + side * 15, H - 13.5],
                        material="steel",
                        product_code="Prepared compression sleeve 6 OD x 4.3 ID x 23",
                        geometry_fidelity="nominal-solid",
                        geometry=dict(kind="annulus", outer_diameter_mm=6, inner_diameter_mm=4.3),
                        machining="Supplier-cut metal tube; deburr, confirm 23 mm sleeve + 2 mm bridge washer stack tolerance. Not a sourced vendor STEP.",
                    )
                    add(
                        f"retention-bridge-washer-{i + 1}-{j}-{side}",
                        [12, 12, 2],
                        [x + xx, 23 + side * 15, H - 1],
                        material="steel",
                        product_code="Prepared bridge washer 12 OD x 4.5 ID x 2",
                        geometry_fidelity="nominal-solid",
                        geometry=dict(kind="annulus", outer_diameter_mm=12, inner_diameter_mm=4.5),
                        machining="Bridge header slot mouth so sleeve does not bear into empty slot; confirm contact, washer bending and bolt preload. Supplier selection pending.",
                    )
            if i:
                seam = start + i * (module_length + 0.2) - 0.1 - 2.5
                for side in (-1, 1):
                    add(
                        f"alignment-key-{i}-{side}",
                        [10, 3, 1.8],
                        [seam, 23 + side * 20, H - 0.9],
                        material="PETG",
                        product_code="printed-alignment-key",
                    )

        # Custom welded retainer assembly; no supplier STEP or rated load claimed.
        # Continuous strips bridge module seams. End bars sit in relieved print
        # ends and are welded to BOTH strips; bolts clamp through steel sleeves.
        for side in (-1, 1):
            holes = []
            for i in range(count):
                station = i * (module_length + 0.2) + module_length / 2 - rail_length / 2
                holes += [
                    dict(center=[station + xx, side], diameter_mm=4.5)
                    for xx in (12 - module_length / 2, 0, module_length / 2 - 12)
                ]
            add(
                f"keeper-strip-continuous-{side}",
                [rail_length, 18, 4],
                [(start + width) / 2 - 2.5, 23 + side * 14, H - 27],
                material="304 stainless steel",
                product_code="Custom continuous rail retainer 18 x 4",
                geometry_fidelity="nominal-solid",
                holes=holes,
                cut_length_mm=rail_length,
                machining="Supplier cut/drill 18 x 4 strip; weld end bars to both strips; maintain 10 mm straight slot. Weld distortion, sleeve lengths, M4 bolt grade/engagement and clamp torque require approval.",
            )
        for end, x in (("park", start + 2 - 2.5), ("closed", width - 2 - 2.5)):
            add(
                f"rail-end-stop-{end}",
                [4, 46, 25],
                [x, 23, H - 12.5],
                material="304 stainless steel",
                product_code="Custom welded rail end bar 46 x 25 x 4",
                geometry_fidelity="nominal-solid",
                machining="Weld lower edge to both continuous keeper strips; fits relieved PETG end. Backup overtravel barrier only, not an operating slam stop; weld/load and assembly approval pending.",
            )

        # Intact supplier roller solid, with recessed bearing faces and real bore.
        add(
            "carriage",
            [22, 22, 7],
            [0, 0, H - 15],
            "slider",
            product_code="GN 753.1-22-B5-ZL-1",
            material="polyacetal / steel bearing",
            cad_asset="GN_753.1-22-B5-ZL-1.stp",
            geometry_fidelity="supplier-step-solid",
            supplier="Reiman Portugal",
            source="https://reiman.pt/en/gn-753-1-22-b5-zl-1-guide-rollers-cylindrical/",
        )
        add(
            "keeper-washer",
            [18, 18, 1.6],
            [0, 0, H - 21.3],
            "slider",
            product_code="M6 DIN 9021",
            material="steel",
            geometry=dict(kind="annulus", outer_diameter_mm=18, inner_diameter_mm=6.4),
        )
        add(
            "axle",
            [4, 4, 40],
            [0, 0, H - 29.5],
            "slider",
            product_code="M4 x 40",
            material="steel",
            geometry=dict(kind="cylinder", diameter_mm=4),
        )
        add(
            "axle-head",
            [7, 7, 3],
            [0, 0, H - 8],
            "slider",
            product_code="M4 axle head",
            material="steel",
            geometry=dict(kind="cylinder", diameter_mm=7),
        )
        # 3 mm bodies retain the original clamping faces. Each real collar
        # extends 2 mm into the 5 mm bearing bore, leaving a 1 mm axial gap.
        for name, drop in [("upper", 12), ("lower", 18)]:
            add(
                f"bearing-bush-{name}",
                [8, 8, 5],
                [0, 0, H - drop],
                "slider",
                product_code="GN 753.2-4-5-3-AE-NI",
                material="stainless steel AISI 303",
                geometry_fidelity="supplier-step-solid",
                cad_asset="GN_753.2-4-5-3-AE-NI.stp",
                cad_reversed_axis=name == "upper",
                supplier="Reiman Portugal",
                source="https://reiman.pt/en/gn-753-2-4-5-3-ae-ni-mounting-accessories-bushing-one-sided-centering/",
            )
        add(
            "stem-spacer",
            [8, 8, 10],
            [0, 0, H - 27.1],
            "slider",
            product_code="311431040050 candidate",
            material="nickel-plated brass",
            geometry=dict(kind="annulus", outer_diameter_mm=8, inner_diameter_mm=4.3),
        )
        q = d["secondary_link_mm"]
        add(
            "carrier-spacing-ring",
            [8, 8, 4],
            [0, 0, H - 34.1],
            "slider",
            product_code="4 mm metal spacing ring; supplier selection pending",
            material="steel",
            geometry=dict(kind="annulus", outer_diameter_mm=8, inner_diameter_mm=4.3),
        )
        add(
            "axle-bottom-washer",
            [9, 9, 1],
            [0, 0, H - 42.6],
            "slider",
            product_code="M4 washer; thickness confirmation pending",
            material="steel",
            geometry=dict(kind="annulus", outer_diameter_mm=9, inner_diameter_mm=4.3),
        )
        add(
            "axle-locknut",
            [8, 8, 5],
            [0, 0, H - 45.6],
            "slider",
            product_code="M4 prevailing-torque nut",
            material="steel",
            geometry_fidelity="unconfirmed-locknut-envelope",
            geometry=dict(kind="annulus", outer_diameter_mm=8, inner_diameter_mm=4),
        )
        add(
            "carrier-shelf",
            [14, 28, 6],
            [q[0], q[1] - 9, H - 39.1],
            "b",
            material="PETG",
            holes=[dict(center=[0, 9], diameter_mm=4.5)],
            geometry_fidelity="parametric-carrier-prototype",
            mounting="Integral shelf on exterior slot-mounted plate; 4 mm extra steel spacer lowers shelf below rail bolt heads",
        )
        add(
            "carrier-upright",
            [18, 8, 75],
            [q[0], q[1] - 19, H - 79.6],
            "b",
            material="PETG",
            geometry_fidelity="parametric-carrier-prototype",
            holes=[dict(axis="y", center=[0, zz], diameter_mm=6.5) for zz in (4.6, -25.4)],
            mounting="Two M6 slot nuts on exterior free-stile face; supplier must confirm screws, engagement and PETG clamp stress",
        )
        # Vendor leaves and pin articulate about the source STEP's real Z axis.
        from .profiles import hinge_component

        for i, z in enumerate([BOTTOM + 90, (BOTTOM + H - HEAD) / 2, H - HEAD - 90]):
            for kind, anchor in [("frame", [0, 0, 0]), ("interleaf", closed_elbow)]:
                for side, component in [(-1, "negative"), (1, "positive"), (0, "pin")]:
                    motion = (
                        None
                        if kind == "frame" and side != 1
                        else ("a" if kind == "frame" or side != 1 else "b")
                    )
                    _, centre, size = hinge_component(component, kind == "frame")
                    local = _add(centre, [0, 0, z])
                    if kind == "interleaf" and side != 1:
                        local = _add(local, anchor)
                    add(
                        f"{kind}-hinge-{i}-" + ("pin" if side == 0 else f"wing-{side}"),
                        size,
                        local,
                        motion,
                        product_code="CFG.30/30 SH-6-C33",
                        material="nickel-plated steel"
                        if side == 0
                        else "PA glass-fibre reinforced, RAL 7040",
                        geometry_fidelity="supplier-step-solid",
                        cad_asset="CFG3030.stp",
                        cad_component=component,
                        hinge_exterior=kind == "frame",
                        mounting_orientation_confirmed=False,
                        quantity=0 if side == 0 else 0.5,
                        purchase_unit="complete two-leaf hinge including pin",
                        source="https://www.elesa-ganter.com/siteassets/PDF/EN/CFG..pdf",
                        mounting="Real STEP axis and mounting faces; M6 countersunk screws and supplied slot inserts. Fastener engagement, loads and tolerances pending.",
                    )
        # Small positive stops act on the primary stile near its pivot. The
        # secondary free stile never reaches this x band. Continuous rigid
        # dust backing is deliberately NOT used as the closure stop.
        for i, z in enumerate([175, H - HEAD - 175]):
            add(
                f"closed-stop-{i}",
                [60, 4, 20],
                [-2.5, 40, z],
                material="steel",
                product_code="Supplier-prepared primary-leaf stop tab",
                geometry_fidelity="nominal-solid",
                holes=[dict(axis="y", center=[-15, 0], diameter_mm=6.5)],
                machining="60 x 20 x 4 mm tab, 6.5 mm through hole at jamb slot centre. Confirm M6 screw/slot nut, anti-rotation restraint and impact load before use",
            )
        # Sampled bare frame sweep, with a named (not proven) hardware allowance.
        sweep = 0.0
        for i, (elbow, _, phi) in enumerate(samples):
            for role, angle, anchor, normal in [
                ("a", -i / 4, [0, 0, 0], 23),
                ("b", phi, elbow, -23),
            ]:
                width_leaf = d["primary_width_mm" if role == "a" else "secondary_width_mm"]
                for x in (2.5, 2.5 + width_leaf):
                    for y in (normal - 15, normal + 15):
                        sweep = max(sweep, 8 - _add(anchor, _rotate([x, y, 0], angle))[1])
        d.update(
            reserved_sweep_mm=sweep + 15,
            remaining_outward_space_mm=space - sweep - 15,
            part_ids=ids,
        )
        doors.append(d)

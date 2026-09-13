"""Nominal chip/dust barriers. Flexible material performance requires commissioning."""

from __future__ import annotations

import math


def add_containment(model):
    from .core import _add, _rotate

    p = model["parameters"]
    W = p["width_mm"]
    D = p["depth_mm"]
    H = p["height_mm"]
    c = p["clearance_mm"]
    t = p["panel_thickness_mm"]
    parts = model["parts"]
    doors = {d["id"]: d for d in model["doors"]}
    entries = []

    def add(id, size, pos, rotation=0, assembly="containment", rubber=False, **extra):
        item = dict(
            id=id,
            name=id.replace("-", " "),
            category="hardware",
            material="EPDM rubber" if rubber else "aluminium",
            supplier="To be selected",
            product_code=None,
            size=list(size),
            position=list(pos),
            rotation_deg=rotation,
            assembly=assembly,
            geometry_fidelity="unconfirmed-flexible-seal" if rubber else "nominal-solid",
            quantity=1,
            physical=True,
            cut_length_mm=max(size),
            machining="Supplier-cut stock; attachment and corner finishing pending",
        )
        if rubber:
            item.update(
                deformable=True,
                seal_spec=dict(
                    kind="continuous compression gasket",
                    free_height_mm=None,
                    installed_height_mm=min(size),
                    compression_range="Supplier confirmation required",
                    material="EPDM candidate; final grade pending",
                    attachment="Mechanically retained or supplier-approved adhesive; butt joints sealed",
                ),
            )
        item.update(extra)
        parts.append(item)
        return item

    def region(id, pivot, base, normal, rect, ids, kind, overlap=2):
        corners = [_add(pivot, _rotate([x, normal, z], base)) for x in rect[:2] for z in rect[2:]]
        normal_axis = 1 if abs(math.sin(math.radians(base))) < 0.5 else 0
        axes = [i for i in range(3) if i != normal_axis]
        return dict(
            id=id,
            kind=kind,
            part_ids=ids,
            coverage_regions=[
                dict(
                    normal_axis=normal_axis,
                    plane_mm=corners[0][normal_axis],
                    min_mm=[min(q[i] for q in corners) for i in axes],
                    max_mm=[max(q[i] for q in corners) for i in axes],
                    part_ids=ids,
                    required_overlap_mm=overlap,
                )
            ],
            performance_confirmed=False,
        )

    # Fixed rear stops sit on external structural faces; fitted rubber bridges to leaves.
    for did in ["front", "left-rear", "back-right"]:
        if did == "front":
            pivot = [0, 0, 0]
            base = 0
            span = W
            top = H
            stopnormal = -31
            sealnormal = -31 - c / 2
            depth = c - 2
        else:
            d = doors[did]
            pivot = _add(d["pivot"], _rotate([-2.5, 8, 0], d["base_deg"]))
            base = d["base_deg"]
            span = d["opening_width_mm"]
            top = H - 55
            stopnormal = 33
            sealnormal = 31
            depth = 2
        ids = []
        specs = [
            ("left", [-5, (H) / 2], [30, H + 40]),
            ("right", [span + 5, H / 2], [30, H + 40]),
            ("bottom", [span / 2, -5], [span - 20, 30]),
            ("top", [span / 2, (top - 10 + H + 20) / 2], [span - 20, H + 30 - top]),
        ]
        for side, (xx, zz), (ww, hh) in specs:
            if did != "front" and side in ("left", "right"):
                zz, hh = (35 + top) / 2, top - 35
            if did != "front" and side == "top":
                # Do not invent a solid header through the roller/carrier path.
                # The remaining head opening deliberately fails sealing coverage
                # until a brush/cover attachment and clearance is established.
                zz, hh = top, 20
            for kind, nn, dd, rubber in [
                ("stop", stopnormal, 2, False),
                ("seal", sealnormal, depth, True),
            ]:
                id = f"{did}-perimeter-{side}-{kind}"
                item = add(
                    id, [ww, dd, hh], _add(pivot, _rotate([xx, nn, zz], base)), base, rubber=rubber
                )
                ids.append(id)
        if did != "front":
            # The shared jamb stop mounts onto the overlapping fixed wood panel.
            # Other sides use cut backing strips to reach the same stop plane.
            for side, (xx, zz), (ww, hh) in specs:
                if side in ("left", "top"):
                    continue
                if side == "right":
                    zz, hh = (35 + top) / 2, top - 35
                id = f"{did}-perimeter-{side}-backing"
                add(id, [ww, 8, hh], _add(pivot, _rotate([xx, 38, zz], base)), base)
                ids.append(id)
        for side, rect in [
            ("left", [0, c, 0, H]),
            ("right", [span - c, span, 0, H]),
            ("bottom", [0, span, 0, c]),
            ("top", [0, span, top, H]),
        ]:
            entries.append(
                region(
                    f"{did}-perimeter-{side}", pivot, base, sealnormal, rect, ids, "door-perimeter"
                )
            )
    # The right front leaf carries an exterior meeting astragal and closes last.
    d = doors["front-right"]
    L = d["link_length_mm"]
    d["closing_order"] = ["front-left", "front-right"]
    d["opening_order"] = ["front-right", "front-left"]
    ids = []
    for suffix, nn, dd, rubber in [("astragal", 20, 2, False), ("meeting-gasket", 17, 4, True)]:
        local = [L, nn, H / 2]
        item = add(
            f"front-{suffix}",
            [40, dd, H + 8],
            _add(d["pivot"], _rotate(local, d["base_deg"])),
            d["base_deg"],
            d["id"],
            rubber,
            motion_leaf="a",
            motion_local=local,
        )
        ids.append(item["id"])
        d["part_ids"].append(item["id"])
    entries.append(
        region(
            "front-meeting", d["pivot"], d["base_deg"], 20, [L - c, L + c, 0, H], ids, "astragal"
        )
    )
    # Flexible external seam cover follows leaf A; its deformation is not a rigid-motion claim.
    for did in ["left-rear", "back-right"]:
        d = doors[did]
        L = d["primary_link_mm"][0]
        local = [L, 6, (3 + H - 55) / 2]
        item = add(
            f"{did}-meeting-cover",
            [20, 2, H - 55 - 3],
            _add(d["pivot"], _rotate(local, d["base_deg"])),
            d["base_deg"],
            did,
            True,
            motion_leaf="a",
            motion_local=local,
            seal_spec=dict(
                kind="flexible folding membrane",
                free_height_mm=None,
                installed_height_mm=2,
                compression_range="Not a compression seal; bend allowance pending",
                material="Reinforced EPDM candidate",
                attachment="Continuous clamp bars on both leaves; flex path requires confirmation",
            ),
        )
        d["part_ids"].append(item["id"])
        entries.append(
            region(
                f"{did}-meeting",
                d["pivot"],
                d["base_deg"],
                6,
                [L - 2.5, L + 2.5, 3, H - 55],
                [item["id"]],
                "flexible-fold-cover",
            )
        )
    # Replace isolated clips by continuous opposing retaining beads with edge gaskets.
    removed = {q["id"] for q in parts if "-clip-" in q["id"]}
    parts[:] = [q for q in parts if q["id"] not in removed]
    for d in doors.values():
        d["part_ids"][:] = [id for id in d["part_ids"] if id not in removed]
    for pane in [q for q in parts if q["id"].endswith("-infill")]:
        did = pane["assembly"]
        d = doors[did]
        leaf = pane["motion_leaf"]
        L = d["link_length_mm"]
        center = pane["motion_local"]
        pw, pt, ph = pane["size"]
        ids = []
        origin = (
            d["pivot"]
            if leaf == "a"
            else _add(d["pivot"], _rotate(d.get("primary_link_mm", [L, 0, 0]), d["base_deg"]))
        )
        for side, xx, zz, ww, hh in [
            ("left", center[0] - pw / 2 - c / 2, center[2], c + 10, ph + 2 * c + 20),
            ("right", center[0] + pw / 2 + c / 2, center[2], c + 10, ph + 2 * c + 20),
            ("bottom", center[0], center[2] - ph / 2 - c / 2, pw - 10, c + 10),
            ("top", center[0], center[2] + ph / 2 + c / 2, pw - 10, c + 10),
        ]:
            for face in [-1, 1]:
                local = [xx, center[1] + face * 18, zz]
                id = f"{pane['id']}-{side}-retainer-{'in' if face < 0 else 'out'}"
                item = add(
                    id,
                    [ww, 2, hh],
                    _add(origin, _rotate(local, d["base_deg"])),
                    d["base_deg"],
                    did,
                    motion_leaf=leaf,
                    motion_local=local,
                )
                d["part_ids"].append(id)
                ids.append(id)
            # Soft packing bridges from both pane faces to the continuous beads.
            # It occupies only the pane overlap, never the neighbouring rigid frame.
            for face in [-1, 1]:
                packx = (
                    xx + (c / 2 + 2.5)
                    if side == "left"
                    else xx - (c / 2 + 2.5)
                    if side == "right"
                    else xx
                )
                packz = (
                    zz + (c / 2 + 2.5)
                    if side == "bottom"
                    else zz - (c / 2 + 2.5)
                    if side == "top"
                    else zz
                )
                local = [packx, center[1] + face * (17 + pt / 2) / 2, packz]
                size = (
                    [5, 17 - pt / 2, ph] if side in ("left", "right") else [pw - 10, 17 - pt / 2, 5]
                )
                id = f"{pane['id']}-{side}-packing-{'in' if face < 0 else 'out'}"
                add(
                    id,
                    size,
                    _add(origin, _rotate(local, d["base_deg"])),
                    d["base_deg"],
                    did,
                    True,
                    motion_leaf=leaf,
                    motion_local=local,
                )
                d["part_ids"].append(id)
                ids.append(id)
            # Edge gasket occupies the pane-to-frame gap without hard interference.
            size = [c, 34, ph] if side in ("left", "right") else [pw + 2 * c, 34, c]
            local = [xx, center[1], zz]
            id = f"{pane['id']}-{side}-edge-gasket"
            add(
                id,
                size,
                _add(origin, _rotate(local, d["base_deg"])),
                d["base_deg"],
                did,
                True,
                motion_leaf=leaf,
                motion_local=local,
            )
            d["part_ids"].append(id)
            ids.append(id)
            rect = (
                [xx - c / 2, xx + c / 2, center[2] - ph / 2, center[2] + ph / 2]
                if side in ("left", "right")
                else [center[0] - pw / 2 + 5, center[0] + pw / 2 - 5, zz - c / 2, zz + c / 2]
            )
            entries.append(
                region(
                    f"{pane['id']}-{side}-retention",
                    origin,
                    d["base_deg"],
                    center[1] + 18,
                    rect,
                    ids.copy(),
                    "continuous-infill-retention",
                )
            )
        pane["retention"] = (
            "Continuous opposing supplier-cut retaining beads plus perimeter edge gasket; glass-compatible setting/packing profile and fixing pitch pending"
        )
    # Fixed panels lap the complete 30 mm frame border and compress continuous gaskets.
    for wall_id in ["panel-right", "panel-left-front", "panel-back-left"]:
        panel = next(q for q in parts if q["id"] == wall_id)
        normal = panel["thickness_axis"]
        axes = panel["drawing_axes"]
        for axis in axes:
            panel["size"][axis] += 60
        if wall_id in ("panel-left-front", "panel-back-left"):
            # The 3060 header projects farther outward: end the fixed sheet at
            # its underside instead of lapping through its actual extrusion.
            panel["size"][2] -= 30
            panel["position"][2] -= 15
        sign = 1 if wall_id in ("panel-right", "panel-back-left") else -1
        panel["position"][normal] += 2 * sign
        panel["cut_size_mm"] = [
            panel["size"][axes[0]],
            panel["size"][axes[1]],
            panel["size"][normal],
        ]
        low = [panel["position"][a] - panel["size"][a] / 2 for a in axes]
        high = [panel["position"][a] + panel["size"][a] / 2 for a in axes]
        ids = []
        regions = []
        for index, (u0, u1, v0, v1) in enumerate(
            [
                (low[0] + 5, high[0] - 5, low[1] + 5, low[1] + 25),
                (low[0] + 5, high[0] - 5, high[1] - 25, high[1] - 5),
                (low[0] + 5, low[0] + 25, low[1] + 25, high[1] - 25),
                (high[0] - 25, high[0] - 5, low[1] + 25, high[1] - 25),
            ]
        ):
            size = [0.0, 0.0, 0.0]
            pos = list(panel["position"])
            size[normal] = 2
            size[axes[0]] = u1 - u0
            size[axes[1]] = v1 - v0
            pos[normal] -= sign * (panel["size"][normal] / 2 + 1)
            pos[axes[0]] = (u0 + u1) / 2
            pos[axes[1]] = (v0 + v1) / 2
            id = f"{wall_id}-perimeter-gasket-{index}"
            add(id, size, pos, rubber=True)
            ids.append(id)
            regions.append(
                dict(
                    normal_axis=normal,
                    plane_mm=pos[normal],
                    min_mm=[u0 + 3, v0 + 3],
                    max_mm=[u1 - 3, v1 - 3],
                    part_ids=[id],
                    required_overlap_mm=1,
                )
            )
        entries.append(
            dict(
                id=f"{wall_id}-frame-seal",
                kind="fixed-wall-junction",
                part_ids=ids,
                coverage_regions=regions,
                performance_confirmed=False,
            )
        )
    roof = next(q for q in parts if q["id"] == "panel-roof")
    roof["position"][2] += 2
    roofids = []
    roofregions = []
    for index, (x0, x1, y0, y1) in enumerate(
        [
            (-25, W + 25, -25, -5),
            (-25, W + 25, D + 5, D + 25),
            (-25, -5, -5, D + 5),
            (W + 5, W + 25, -5, D + 5),
        ]
    ):
        id = f"roof-perimeter-gasket-{index}"
        add(id, [x1 - x0, y1 - y0, 2], [(x0 + x1) / 2, (y0 + y1) / 2, H + 31], rubber=True)
        roofids.append(id)
        roofregions.append(
            dict(
                normal_axis=2,
                plane_mm=H + 31,
                min_mm=[x0 + 3, y0 + 3],
                max_mm=[x1 - 3, y1 - 3],
                part_ids=[id],
                required_overlap_mm=1,
            )
        )
    for index, y in enumerate([D / 3, 2 * D / 3]):
        add(f"roof-beam-bearing-{index}", [W, 30, 2], [W / 2, y, H + 31], rubber=True)
    entries.append(
        dict(
            id="roof-frame-seal",
            kind="roof-junction",
            part_ids=roofids,
            coverage_regions=roofregions,
            performance_confirmed=False,
        )
    )
    # Table is intentionally not a supplied part: this continuous gasket requires a flat table.
    baseids = []
    for side, size, pos in [
        ("front", [W + 60, 30, 3], [W / 2, -15, -31.5]),
        ("back", [W + 60, 30, 3], [W / 2, D + 15, -31.5]),
        ("left", [30, D, 3], [-15, D / 2, -31.5]),
        ("right", [30, D, 3], [W + 15, D / 2, -31.5]),
    ]:
        baseids.append(add(f"table-{side}-gasket", size, pos, rubber=True)["id"])
    entries.append(
        dict(
            id="table-interface",
            kind="table-gasket",
            part_ids=baseids,
            coverage_regions=[
                dict(
                    normal_axis=2,
                    plane_mm=-31.5,
                    min_mm=[-27, -27],
                    max_mm=[W + 27, -3],
                    part_ids=baseids,
                    required_overlap_mm=0,
                ),
                dict(
                    normal_axis=2,
                    plane_mm=-31.5,
                    min_mm=[-27, D + 3],
                    max_mm=[W + 27, D + 27],
                    part_ids=baseids,
                    required_overlap_mm=0,
                ),
                dict(
                    normal_axis=2,
                    plane_mm=-31.5,
                    min_mm=[-27, 3],
                    max_mm=[-3, D - 3],
                    part_ids=baseids,
                    required_overlap_mm=0,
                ),
                dict(
                    normal_axis=2,
                    plane_mm=-31.5,
                    min_mm=[W + 3, 3],
                    max_mm=[W + 27, D - 3],
                    part_ids=baseids,
                    required_overlap_mm=0,
                ),
            ],
            table_plane_mm=-33,
            table_confirmed=False,
        )
    )
    # Annular roof collar bridges the cutout to an independently supported dust hose.
    hole = p["hose_diameter_mm"] + 10
    outer = hole + 40
    inner = p["hose_diameter_mm"]
    roofz = roof["position"][2] + roof["size"][2] / 2
    add(
        "roof-hose-collar",
        [outer, outer, 8],
        [W / 2, D / 2, roofz + 6],
        geometry=dict(kind="annulus", inner_diameter_mm=inner, outer_diameter_mm=outer),
    )
    add(
        "roof-hose-collar-gasket",
        [outer, outer, 2],
        [W / 2, D / 2, roofz + 1],
        rubber=True,
        geometry=dict(kind="annulus", inner_diameter_mm=inner, outer_diameter_mm=outer),
    )
    entries.append(
        dict(
            id="roof-hose-interface",
            kind="annular-collar",
            part_ids=["roof-hose-collar", "roof-hose-collar-gasket"],
            axis=2,
            center_mm=[W / 2, D / 2],
            plane_mm=roofz + 6,
            inner_diameter_mm=inner,
            opening_diameter_mm=hole,
            required_outer_diameter_mm=hole + 20,
            wall_min_mm=10,
            hose_clamp_confirmed=False,
        )
    )
    # Passive makeup vent: right wall opening, outside hood with only bottom throat.
    wall = next(q for q in parts if q["id"] == "panel-right")
    ventw = 240.0
    venth = 80.0
    yc = D / 2
    zc = H * 0.7
    wx = W + 32 + t
    wall["cutouts"] = [
        dict(
            kind="rectangle",
            x_mm=yc - ventw / 2 + 30,
            y_mm=zc - venth / 2 + 30,
            width_mm=ventw,
            height_mm=venth,
            normal_axis=0,
            center_local_mm=[0, 0, zc - H / 2],
        )
    ]
    ids = []
    for suffix, size, pos in [
        ("bottom-return", [60, ventw + 80 - 2 * t, t], [wx + 30, yc, zc - 100 + t / 2]),
        ("internal-turn", [t, ventw + 80 - 2 * t, 150 - t], [wx + 60 + t / 2, yc, zc - 25 + t / 2]),
        ("face", [t, ventw + 80, venth + 140], [wx + 120 + t / 2, yc, zc + 10]),
        ("top", [120, ventw + 80, t], [wx + 60, yc, zc + 120 - t / 2]),
        (
            "left",
            [120, t, venth + 140 - t],
            [wx + 60, yc - ventw / 2 - 40 + t / 2, zc + 10 - t / 2],
        ),
        (
            "right",
            [120, t, venth + 140 - t],
            [wx + 60, yc + ventw / 2 + 40 - t / 2, zc + 10 - t / 2],
        ),
    ]:
        item = add(f"air-inlet-baffle-{suffix}", size, pos)
        item.update(
            category="panel",
            material="wood",
            cut_size_mm=[v for i, v in enumerate(size) if i != min(range(3), key=lambda i: size[i])]
            + [t],
            drawing_axes=[i for i in range(3) if i != min(range(3), key=lambda i: size[i])],
            thickness_axis=min(range(3), key=lambda i: size[i]),
        )
        ids.append(item["id"])
    entries.append(
        dict(
            id="makeup-air-inlet",
            kind="baffled-air-inlet",
            part_ids=ids,
            wall_part_id="panel-right",
            normal_axis=0,
            opening_center_mm=[wx, yc, zc],
            opening_size_mm=[ventw, venth],
            throat_area_mm2=(60 - t) * (ventw + 80 - 2 * t),
            minimum_path_area_mm2=min(60 - t, 70 - t) * (ventw + 80 - 2 * t),
            baffle_plane_mm=wx + 60 + t / 2,
            baffle_top_mm=zc + 50,
            exit_min_mm=[wx + 60 + t, yc - ventw / 2 - 40 + t, zc - 100],
            exit_max_mm=[wx + 120, yc + ventw / 2 + 40 - t, zc - 100],
            opening_area_mm2=ventw * venth,
            hose_area_mm2=math.pi * (p["hose_diameter_mm"] / 2) ** 2,
            minimum_area_ratio_to_hose=2.0,
            airflow_direction="inward passive makeup; vacuum exhaust outside enclosure",
            flow_rate_m3_h=None,
            performance_confirmed=False,
            coverage_regions=[
                dict(
                    normal_axis=0,
                    plane_mm=wx + 120 + t / 2,
                    min_mm=[yc - ventw / 2, zc - venth / 2],
                    max_mm=[yc + ventw / 2, zc + venth / 2],
                    part_ids=ids,
                    required_overlap_mm=20,
                )
            ],
        )
    )
    model["containment"] = entries
    model["door_sequence"] = dict(
        closing=["front-left", "front-right"],
        opening=["front-right", "front-left"],
        reason="Right-leaf exterior astragal overlaps left front leaf",
    )
    model["requirements"].append(
        dict(
            id="containment-continuity",
            description="Closed nominal barriers cover door, infill, table and hose interfaces; only intentional baffled makeup air path remains.",
            category="containment",
            references=[e["id"] for e in entries],
        )
    )
    model["assumptions"] += [
        dict(
            id="seal-material-and-compression",
            description="Supplier rubber profile, adhesive/clamping, corner joints, compression, glass packing and wear require confirmation; installed geometry alone does not establish airtightness.",
            confirmed=False,
            references=[e["id"] for e in entries],
        ),
        dict(
            id="containment-commissioning",
            description="Confirm flat continuous supporting tabletop, external vacuum exhaust, inward airflow, flexible seam motion, leaks and filter maintenance physically before CNC operation.",
            confirmed=False,
            references=["table-interface", "makeup-air-inlet", "roof-hose-interface"],
        ),
    ]
    model["ordering"]["unresolved"] += [
        "Seal profiles, compression and attachment",
        "Continuous glazing beads and setting/packing compatibility",
        "Front astragal closing sequence and latch details",
        "Bifold membrane fold and clamp layout",
        "Baffle fasteners, table sealing and hose clamp",
    ]

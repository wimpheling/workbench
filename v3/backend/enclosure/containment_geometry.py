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
    front_band = max(10, c + 3)
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
        H = doors["front-left"]["opening_height_mm"] if did == "front" else p["height_mm"]
        if did == "front":
            pivot = [0, 0, 0]
            base = 0
            span = W
            top = H
            stopnormal = 13
            sealnormal = 9
            depth = 6
        else:
            d = doors[did]
            pivot = _add(d["pivot"], _rotate([-2.5, 8, 0], d["base_deg"]))
            base = d["base_deg"]
            span = d["opening_width_mm"]
            top = H - 63
            # The rotating free-stile corner reaches behind the closed plane.
            # Rigid backing stays clear; only flexible bristles occupy the wipe zone.
            stopnormal = 40
            sealnormal = 35
            depth = 10
        ids = []
        specs = [
            ("left", [-5, (H) / 2], [30, H + 40]),
            ("right", [span + 5, H / 2], [30, H + 40]),
            ("bottom", [span / 2, -5], [span - 20, 30]),
            ("top", [span / 2, (top - 10 + H + 20) / 2], [span - 20, H + 30 - top]),
        ]
        for side, (xx, zz), (ww, hh) in specs:
            if did != "front" and side == "bottom":
                # User removed the complete bottom strip stack; keep coverage obligation below.
                continue
            if did != "front" and side in ("left", "right"):
                zz, hh = top / 2, top
            if did != "front" and side == "top":
                # A prepared cover stays behind the roller/carrier path.
                zz, hh = (top - 10 + H) / 2, H - top + 10
            for kind, nn, dd, rubber in [
                ("stop", stopnormal, 2, False),
                ("seal", sealnormal, depth, True),
            ]:
                id = f"{did}-perimeter-{side}-{kind}"
                item = add(
                    id, [ww, dd, hh], _add(pivot, _rotate([xx, nn, zz], base)), base, rubber=rubber
                )
                if did == "front":
                    if not rubber:
                        if side in ("left", "right"):
                            # Continuous inner tongue supports the corner seal;
                            # outer root is relieved around the side-rail angles.
                            item["size"] = [30, 2, H - 2 * front_band]
                            item["position"][2] = H / 2
                            item["cutouts"] = [
                                dict(
                                    kind="rectangle",
                                    normal_axis=1,
                                    width_mm=20,
                                    height_mm=32 - front_band,
                                    center_local_mm=[-5 if side == "left" else 5, 0, z - H / 2],
                                )
                                for z in ((front_band + 32) / 2, H - (front_band + 32) / 2)
                            ]
                            item["machining"] = (
                                f"2 mm aluminium closing strip, 30 mm wide; two 20 x {32 - front_band:g} mm open-end root reliefs leave a 10 mm inner tongue. "
                                "Root supported by existing 12 mm backing between Z=32 and H-32. "
                                f"Bond seal continuously to strip; {32 - front_band:g} mm tongue stiffness, adhesive and fixing pitch pending."
                            )
                        else:
                            item["size"][0] = W
                            item["position"][0] = W / 2
                            item["size"][2] = front_band + 20
                            item["position"][2] = (
                                (front_band - 20) / 2
                                if side == "bottom"
                                else H + (20 - front_band) / 2
                            )
                    else:
                        item["geometry_fidelity"] = "unconfirmed-flexible-envelope"
                        if side in ("left", "right"):
                            item["size"] = [13, depth, H - 2 * front_band]
                            item["position"] = [
                                3.5 if side == "left" else W - 3.5,
                                sealnormal,
                                H / 2,
                            ]
                        else:
                            item["size"] = [W + 6, depth, front_band + 3]
                            item["position"] = [
                                W / 2,
                                sealnormal,
                                (front_band - 3) / 2
                                if side == "bottom"
                                else H - (front_band - 3) / 2,
                            ]
                        item["machining"] = (
                            "6 mm installed gasket study. Head/sill extend 3 mm past aperture; "
                            f"jambs butt at Z={front_band:g} and H-{front_band:g}. Bond/vulcanise corner joints into continuous surround; "
                            "bond roots to relieved closing strips. Free section, adhesive, compression and local corner-plate deflection pending."
                        )
                    item["cut_length_mm"] = max(item["size"])
                if did != "front" and rubber:
                    if side in ("left", "right"):
                        item["size"][2] = H + 6
                        item["position"] = _add(pivot, _rotate([xx, nn, H / 2], base))
                    elif side == "bottom":
                        item["size"][0] = span + 6
                    elif side == "top":
                        # Exterior hood stops 3 mm above the leaf; only the
                        # brush wipes its top edge. No rigid cover in the sweep.
                        item["size"] = [span + 6, 20, 24]
                        item["position"] = _add(pivot, _rotate([span / 2, -2, top + 3], base))
                        item["geometry"] = dict(kind="angled-head-brush-study")
                    item.update(
                        material="PBT brush bristles",
                        geometry_fidelity="unconfirmed-flexible-brush-envelope",
                        seal_spec=dict(
                            kind="10 mm brush candidate",
                            installed_height_mm=10,
                            free_height_mm=10,
                            compression_range="Flexing wipe; not compression gasket",
                            attachment="Channel mechanically fixed to rigid backing; drag and corner closure pending",
                        ),
                    )
                    if side == "top":
                        item["seal_spec"].update(
                            kind="Angled head brush study: 20 mm horizontal reach, 12 mm drop, 12 mm root band",
                            installed_height_mm=math.hypot(20, 12),
                            free_height_mm=None,
                            attachment="Root band held on inward face of bonded exterior-hood holder, above leaf. Actual angled brush/root profile, adhesive, drag and corner returns require supplier approval",
                        )
                ids.append(id)
                if did != "front" and side == "bottom" and not rubber:
                    # Keep rigid backing below the 3 mm leaf bottom. The brush
                    # alone wipes the moving lower corner/gusset through travel.
                    item["size"][2] = 22
                    item["position"] = _add(pivot, _rotate([xx, nn, -9], base))
                if did != "front" and side == "left" and not rubber:
                    # Keep the rigid strip above the retained bottom corner bracket.
                    item["size"][2] = top - 31
                    item["position"] = _add(pivot, _rotate([xx, nn, (top + 31) / 2], base))
                if did != "front" and side == "top" and not rubber:
                    # 3030 exterior face is local Y=0; spacers retain hood clearance.
                    # Direct-mounted exterior hood avoids roof beams entirely.
                    item["size"] = [span + 40, 2, 90]
                    item["position"] = _add(pivot, _rotate([span / 2, -16, H - 15], base))
                    item["holes"] = [
                        dict(axis="y", center=[x - span / 2, 30], diameter_mm=6.5)
                        for x in (50, span / 2, span - 50)
                    ]
                    item["machining"] = (
                        "Exterior 2 mm aluminium head hood, 90 mm high on 15 mm steel spacers; lower edge 3 mm above leaf. Three M6 slot fixings at header mid-height. No beam reliefs. Select fasteners and bonded brush holder; corner sealing and adhesive require approval."
                    )
                    item["fastener_schedule"] = dict(
                        quantity=3,
                        screw="M6; 2 mm hood plus washer, length/locking pending",
                        nut="M6 slot-8",
                    )
                    model["bifold_completion"]["fastener_schedule"].append(
                        dict(part_id=id, assembly=did, **item["fastener_schedule"])
                    )
                    for i, station in enumerate((50, span / 2, span - 50)):
                        add(
                            f"{did}-head-hood-spacer-{i}",
                            [12, 15, 12],
                            _add(pivot, _rotate([station, -7.5, H + 15], base)),
                            base,
                            material="steel",
                            geometry=dict(kind="cylinder", axis=1, diameter_mm=12),
                            holes=[dict(axis="y", center=[0, 0], diameter_mm=6.5)],
                            machining="15 mm steel sleeve, 12 mm OD, 6.5 mm bore; M6 through hood into 3030 side slot. Confirm fixing length and clamp load.",
                        )
                    return_id = f"{did}-head-brush-return"
                    add(
                        return_id,
                        [span + 6, 3, 14],
                        _add(pivot, _rotate([span / 2, -13.5, top + 10], base)),
                        base,
                        machining="Nominal bonded brush-holder envelope, no through-holes in sealing region; supplier root section and adhesive system pending",
                    )
                    ids.append(return_id)
        if did != "front":
            # The shared jamb stop mounts onto the overlapping fixed wood panel.
            # Other sides use cut backing strips to reach the same stop plane.
            for side, (xx, zz), (ww, hh) in specs:
                if side in ("left", "top", "bottom"):
                    continue
                if side == "right":
                    zz, hh = (top - 10) / 2, top - 10
                elif side == "bottom":
                    zz, hh = -9, 22
                id = f"{did}-perimeter-{side}-backing"
                add(id, [ww, 8, hh], _add(pivot, _rotate([xx, 45, zz], base)), base)
                ids.append(id)
        if did == "front":
            for side, size, pos in (
                ("left", [30, 12, H - 64], [-15, 6, H / 2]),
                ("right", [30, 12, H - 64], [W + 15, 6, H / 2]),
                ("bottom", [W, 12, 30], [W / 2, 6, -15]),
                ("top", [W, 12, 30], [W / 2, 6, H + 15]),
            ):
                backing = add(
                    f"front-perimeter-{side}-backing",
                    size,
                    pos,
                    machining="12 mm rigid backing on frame rear face supports closing strip. M6 slot fixings, pitch and anti-rotation detail pending; not a rated slam stop.",
                )
                ids.append(backing["id"])
        if did == "front":
            fixed_seats = [
                f"front-perimeter-{side}-backing" for side in ("left", "right", "bottom", "top")
            ]
            fixed_seats += [
                f"bracket-{side}-front-{level}-y"
                for side in ("left", "right")
                for level in ("bottom", "top")
            ]
            fixed_seats += ["rail-left-top"]
            for item in parts:
                if item["id"].startswith("front-perimeter-") and item.get("deformable"):
                    item["installed_relief_ids"] = fixed_seats
                    # Keep the connected gasket body, never a fictitious slug
                    # inside a closed extrusion pocket after the seat relief.
                    side = item["id"].split("-")[-2]
                    item["installed_body_anchor_mm"] = (
                        [5 if side == "left" else W - 5, 9, H / 2]
                        if side in ("left", "right")
                        else [W / 2, 9, 5 if side == "bottom" else H - 5]
                    )
                    item["machining"] += (
                        " Installed root/corner relief follows actual fixed backing, side-angle and header solids; "
                        "supplier-cut notches and bonded joints must reproduce this seating. Keep the connected body only, without filling internal extrusion pockets. No rubber-through-metal fit is assumed."
                    )
            ids += [pid for pid in fixed_seats if pid not in ids]
        for side, rect in [
            ("left", [0, 5 if did == "front" else c, 0, H]),
            ("right", [span - (5 if did == "front" else c), span, 0, H]),
            ("bottom", [0, span, 0, c]),
            ("top", [0, span, H - c if did == "front" else top, H]),
        ]:
            if did != "front" and side == "bottom":
                entries.append(
                    dict(
                        id=f"{did}-perimeter-bottom",
                        kind="intentional-bottom-gap",
                        part_ids=[],
                        nominal_height_mm=3,
                        opening_width_mm=span,
                        performance_confirmed=False,
                        description="User accepts an unsealed bottom for a simple enclosure; no continuous bottom barrier required.",
                    )
                )
                continue
            if did != "front" and side == "top":
                # The outer hood and inward/downward brush form a connected,
                # non-planar barrier. Test both physical sections, retaining the
                # same full head-height obligation and overlap/cut allowances.
                head = region(
                    f"{did}-perimeter-top",
                    pivot,
                    base,
                    -16,
                    [0, span, top + 6, H],
                    ids,
                    "door-perimeter",
                )
                wipe = region(
                    f"{did}-head-wipe",
                    pivot,
                    base,
                    0,
                    [0, span, top, top + 3],
                    ids,
                    "door-perimeter",
                )
                head["coverage_regions"] += wipe["coverage_regions"]
                head["nominal_contact_chain"] = [
                    [f"{did}-perimeter-top-stop", f"{did}-head-brush-return"],
                    [f"{did}-head-brush-return", f"{did}-perimeter-top-seal"],
                    [f"{did}-perimeter-top-seal", f"{did}-a-rail-high"],
                    [f"{did}-perimeter-top-seal", f"{did}-b-rail-high"],
                ]
                entries.append(head)
                continue
            entries.append(
                region(
                    f"{did}-perimeter-{side}",
                    pivot,
                    base,
                    -16 if did != "front" and side == "top" else sealnormal,
                    rect,
                    ids,
                    "door-perimeter",
                )
            )
    for entry in entries:
        if not entry["id"].startswith("front-perimeter-"):
            continue
        side = entry["id"].removeprefix("front-perimeter-")
        entry["nominal_contact_chain"] = [
            [f"front-perimeter-{side}-seal", f"front-perimeter-{side}-stop"],
            [f"front-perimeter-{side}-stop", f"front-perimeter-{side}-backing"],
            [
                f"front-perimeter-{side}-backing",
                f"post-{side}-front" if side in ("left", "right") else f"rail-front-{side}",
            ],
        ]
        if side in ("left", "right"):
            entry["nominal_contact_chain"] += [
                [f"front-perimeter-{side}-seal", f"front-perimeter-{level}-seal"]
                for level in ("bottom", "top")
            ]
    model["assumptions"].append(
        dict(
            id="bifold-exterior-head-brush",
            confirmed=False,
            description="Exterior hood and bonded holder have nominal clearance. Angled bristle envelope assumes 20 mm inward projection, 12 mm downward offset and 12 mm root band; no matching vendor profile or adhesive has been approved. Bristles intersect the moving carrier and require unvalidated deflection. Nominal section coverage/contact does not establish bristle density, drag, root retention, corner closure or particulate sealing.",
            references=[f"{did}-perimeter-top-seal" for did in ("left-rear", "back-right")],
        )
    )
    # The right front leaf carries an exterior meeting astragal and closes last.
    d = doors["front-right"]
    L = d["link_length_mm"]
    d["closing_order"] = ["front-left", "front-right"]
    d["opening_order"] = ["front-right", "front-left"]
    H = doors["front-left"]["opening_height_mm"]
    ids = []
    for suffix, nn, dd, rubber in [("astragal", -10, 2, False), ("meeting-gasket", -12.5, 3, True)]:
        # Offset onto the owning stile: the old centred strip hit the left
        # handle during the first degree of opening.
        local = [L - 10, nn, H / 2]
        item = add(
            f"front-{suffix}",
            [40, dd, H - 2 * c],
            _add(d["pivot"], _rotate(local, d["base_deg"])),
            d["base_deg"],
            d["id"],
            rubber,
            motion_leaf="a",
            motion_local=local,
        )
        ids.append(item["id"])
        d["part_ids"].append(item["id"])
    # Fixed head/sill saddles bridge the exterior astragal to the rear seal.
    # They lie wholly in the existing top/bottom door gaps and leave with no
    # centre post. Their ends contact the strip and continuous perimeter gasket.
    for level, z in (("bottom", c / 2), ("top", H - c / 2)):
        saddle = add(
            f"front-meeting-{level}-saddle",
            [30, 42, c],
            [W / 2, -9, z],
            rubber=True,
            machining="Cut/bond flexible end saddle, 30 mm across seam x 42 mm front-to-rear. Installed height equals door clearance. Bond to frame head/sill and perimeter seal; astragal end wipes saddle. Free height, preload and wear pending.",
        )
        ids.append(saddle["id"])
        apron = add(
            f"front-meeting-{level}-apron",
            [30, 1, c + 6],
            [W / 2, -30.5, z],
            rubber=True,
            machining="1 mm flexible front apron bonded to saddle as an L-shaped end boot. Extends 3 mm beyond each end of door gap; bond to front face of frame. Rounded extrusion edge is bypassed, not filled by rigid stock. Material/adhesive and wipe wear pending.",
        )
        ids.append(apron["id"])
    meeting = region(
        "front-meeting",
        d["pivot"],
        d["base_deg"],
        -10,
        [L - 2.5, L + 2.5, c, H - c],
        ids,
        "astragal",
    )
    meeting["nominal_contact_chain"] = []
    for level, low, high in (("bottom", 0, c), ("top", H - c, H)):
        # Preserve the entire 0..H obligation through three connected sections.
        # The end boot wraps onto the frame front face to bypass its rounded edge.
        end = region(
            f"front-meeting-{level}",
            [0, 0, 0],
            0,
            -30.5,
            [W / 2 - 2.5, W / 2 + 2.5, low, high],
            ids,
            "astragal-end",
        )
        meeting["coverage_regions"] += end["coverage_regions"]
        saddle = f"front-meeting-{level}-saddle"
        apron = f"front-meeting-{level}-apron"
        meeting["nominal_contact_chain"] += [
            ["front-astragal", saddle],
            [saddle, apron],
            [apron, f"rail-front-{level}"],
            [saddle, f"front-perimeter-{level}-seal"],
        ]
    entries.append(meeting)
    H = p["height_mm"]
    # Retail cut-to-length wipe on B's meeting stile, clear of both handles.
    # Width/stock length are catalogue data; thickness and bond layout are studies.
    for did in ["left-rear", "back-right"]:
        d = doors[did]
        L = d["primary_link_mm"][0]
        local = [9, -39.5, (3 + H - 63) / 2]
        origin = _add(d["pivot"], _rotate(d["primary_link_mm"], d["base_deg"]))
        item = add(
            f"{did}-meeting-cover",
            [38, 3, H - 63 + 3],
            _add(origin, _rotate(local, d["base_deg"])),
            d["base_deg"],
            did,
            True,
            motion_leaf="b",
            motion_local=local,
            name=f"{did} self-adhesive meeting wipe (Tesa 05422 candidate)",
            material="PP film / PU foam (manufacturer datasheet)",
            supplier="Retail: Leroy Merlin Portugal / Tesa",
            product_code="TESA-05422",
            source="https://www.tesa.com/pt-pt/files/download/10756818,2,tesamoll-universal-doortofloor-foam-copiw-pt-pt.pdf",
            purchase_url="https://www.leroymerlin.pt/produtos/veda-porta-adesivo-1m-branco-tesa-universal-310485.html",
            procurement=dict(
                status="retail-candidate-fit-unconfirmed",
                stock_length_mm=1000,
                stock_width_mm=38,
                packs_required=math.ceil((H - 60) / 1000),
                price_eur_per_pack=3.49,
                price_checked="2026-09-14",
                availability="Listed for sale; local stock/delivery must be checked",
            ),
            machining="Cut to length with scissors; no custom clamp bars, drilling or seal fixings. Bond only to secondary meeting stile, leaving the wiping edge non-adhesive. Actual adhesive band, slot bridging and section must be checked before fitting.",
            seal_spec=dict(
                kind="off-the-shelf self-adhesive meeting wipe candidate",
                free_height_mm=None,
                installed_height_mm=3,
                compression_range="Nominal closed contact only; free-lip preload and wear pending",
                material="PP film / PU foam; not EPDM or a glass-retaining gasket",
                attachment="Self-adhesive root on secondary leaf only. Free edge wipes primary leaf at closure and disengages on opening; no tensile bridge between leaves. Handles mount directly to frame, independently of seal.",
                section_status="38 mm width sourced; 3 mm thickness and 25.5 mm root footprint are provisional, not vendor CAD. Confirm adhesive band fits the slotted face and leaves a non-sticky free lip; no bonding to primary leaf.",
            ),
        )
        latch_z = H / 2 - 150
        gap_low, gap_high = latch_z - 68, latch_z + 53
        item["cutouts"] = [
            dict(
                kind="rectangle",
                normal_axis=1,
                width_mm=40,
                height_mm=gap_high - gap_low,
                center_local_mm=[0, 0, (gap_low + gap_high) / 2 - local[2]],
            )
        ]
        item["cut_lengths_mm"] = [gap_low, H - 60 - gap_high]
        item["cut_length_mm"] = sum(item["cut_lengths_mm"])
        item["procurement"]["packs_required"] = math.ceil(item["cut_length_mm"] / 1000)
        item["machining"] += (
            " Cut into two pieces and leave a 121 mm break around the manual swing latch; do not trap wipe under its pivot or keeper. One inventory kit contains both wipe pieces."
        )
        d["part_ids"].append(item["id"])
        model["ordering"]["unresolved"].append(
            f"{did}: Tesa 05422 meeting wipe is a retail candidate, not approved for this bifold use; verify section, adhesive band/slot support, non-sticky free edge, preload, end joints and peel/wear life."
        )
        if max(item["cut_lengths_mm"]) > 1000:
            model["ordering"]["unresolved"].append(
                f"{did}: a meeting-wipe piece exceeds 1 m retail length; longer stock or a splice remains to be selected"
            )
        covered = region(
            f"{did}-meeting",
            d["pivot"],
            d["base_deg"],
            6,
            [L - 2.5, L + 2.5, 3, gap_low - 3],
            [item["id"]],
            "flexible-fold-cover",
        )
        upper = region(
            f"{did}-meeting-upper",
            d["pivot"],
            d["base_deg"],
            6,
            [L - 2.5, L + 2.5, gap_high + 3, H - 63],
            [item["id"]],
            "flexible-fold-cover",
        )
        covered["coverage_regions"] += upper["coverage_regions"]
        entries.append(covered)
        entries.append(
            dict(
                id=f"{did}-latch-access-gap",
                kind="intentional-latch-gap",
                part_ids=[item["id"]],
                nominal_height_mm=121,
                opening_width_mm=5,
                performance_confirmed=False,
                description="Intentional local break in adhesive wipe around manually operated latch; no seal preload.",
            )
        )
    # Replace isolated clips by continuous opposing retaining beads with edge gaskets.
    removed = {q["id"] for q in parts if "-clip-" in q["id"]}
    parts[:] = [q for q in parts if q["id"] not in removed]
    for d in doors.values():
        d["part_ids"][:] = [id for id in d["part_ids"] if id not in removed]
    for pane in [q for q in parts if q["id"].endswith("-infill")]:
        if pane.get("glazing"):
            # Slot-captured study has its own inserts; no surface beads/packing.
            # Physical corner/compound sealing remains an explicit unknown.
            continue
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
            description="Simple enclosure with intentional bifold bottom gaps, local latch-access breaks in meeting wipes and baffled makeup air. Check fitted barriers at other interfaces; no hermetic seal is required.",
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
        "Bifold retail meeting wipe section, adhesive layout and folding wear",
        "Baffle fasteners, table sealing and hose clamp",
    ]

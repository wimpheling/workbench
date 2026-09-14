"""Millimetre engineering model. Hardware envelopes are not supplier mounting proofs."""

from __future__ import annotations

import copy
import hashlib
import json
import math
from pathlib import Path

from .profiles import ASSET_SHA256

SCHEMA_VERSION = "3.1.0"


def default_parameters():
    return dict(
        width_mm=1674.0,
        depth_mm=1649.0,
        height_mm=740.0,
        panel_thickness_mm=6.0,
        glass_thickness_mm=6.0,
        clearance_mm=4.0,
        cut_tolerance_mm=0.5,
        workpiece_width_mm=1219.2,
        workpiece_depth_mm=1219.2,
        workpiece_thickness_mm=100.0,
        machine_width_mm=1600.0,
        machine_depth_mm=1600.0,
        machine_height_mm=600.0,
        hose_diameter_mm=100.0,
        door_material="glass",
        bifold_material="polycarbonate",
        back_opening_width_mm=750.0,
    )


def _parameters(inputs):
    p = default_parameters()
    if inputs is not None:
        if not isinstance(inputs, dict):
            raise ValueError("parameters must be an object")
        unknown = set(inputs) - set(p)
        if unknown:
            raise ValueError("Unknown parameters: " + ", ".join(sorted(unknown)))
        p.update(inputs)
    bounds = {
        "width_mm": (1300, 2500),
        "back_opening_width_mm": (650, 800),
        "depth_mm": (1300, 2500),
        "height_mm": (650, 1500),
        "panel_thickness_mm": (3, 18),
        "glass_thickness_mm": (4, 12),
        "clearance_mm": (3, 12),
        "cut_tolerance_mm": (0, 2),
        "workpiece_width_mm": (1, 2500),
        "workpiece_depth_mm": (1, 2500),
        "workpiece_thickness_mm": (1, 300),
        "machine_width_mm": (1, 2500),
        "machine_depth_mm": (1, 2500),
        "machine_height_mm": (1, 1500),
        "hose_diameter_mm": (30, 200),
    }
    for key, (lo, hi) in bounds.items():
        value = p[key]
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or not lo <= value <= hi
        ):
            raise ValueError(f"{key} must be finite and between {lo} and {hi} mm")
        p[key] = float(value)
    for key in ("door_material", "bifold_material"):
        if p[key] not in (
            ("wood", "glass", "polycarbonate") if key == "bifold_material" else ("wood", "glass")
        ):
            raise ValueError(f"Unsupported {key} material")
    return p


def _rotate(v, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]


def _add(a, b):
    return [a[i] + b[i] for i in range(3)]


def build_model(parameters=None):
    p = _parameters(parameters)
    W, D, H = (p[k] for k in ("width_mm", "depth_mm", "height_mm"))
    c = p["clearance_mm"]
    rear_jamb = W - p["back_opening_width_mm"] - 15
    left_jamb = D / 2 - 15
    t = p["panel_thickness_mm"]
    parts = []
    joints = []
    doors = []

    def part(id, size, pos, category="extrusion", assembly="frame", rotation=0, **extra):
        if id in ("rail-left-top", "rail-back-top"):
            size = list(size)
            size[0 if id == "rail-left-top" else 1] = 60
            extra["product_code"] = "AST03006006"
        item = dict(
            id=id,
            name=id.replace("-", " "),
            category=category,
            material="aluminium" if category in ("extrusion", "hardware") else "wood",
            supplier="Reiman Portugal" if category == "extrusion" else "To be selected",
            product_code="AST03003004" if category == "extrusion" else None,
            size=list(size),
            position=list(pos),
            rotation_deg=rotation,
            assembly=assembly,
            geometry_fidelity="conservative-envelope"
            if category in ("extrusion", "hardware")
            else "nominal-solid",
            quantity=1,
            physical=True,
        )
        item.update(extra)
        if category == "extrusion":
            item.update(
                cut_length_mm=max(size),
                length_axis=max(range(3), key=lambda i: size[i]),
                geometry_fidelity="supplier-step-section",
                end_treatment="Square cut; deburr; tolerance to be confirmed",
                machining="Mounting machining unresolved",
            )
            if id == "rail-back-top":
                # Supplier-machined open corner relief, not overlapping headers.
                item["cutouts"] = [
                    dict(
                        kind="rectangle",
                        normal_axis=2,
                        width_mm=15.5,
                        height_mm=15.5,
                        center_local_mm=[-size[0] / 2 + 7.75, -22.25, 0],
                    )
                ]
                item["machining"] = (
                    "Supplier mill open 15.5 x 15.5 mm corner relief through 30 mm height at left/front edge; 0.5 mm clearance to left header. Confirm remaining section and joint strength."
                )
        if category in ("panel", "glass"):
            thickness_axis = min(range(3), key=lambda i: size[i])
            axes = [i for i in range(3) if i != thickness_axis]
            item.update(
                cut_size_mm=[size[axes[0]], size[axes[1]], size[thickness_axis]],
                drawing_axes=axes,
                thickness_axis=thickness_axis,
                edge_finish="Supplier confirmation required",
                machining="See holes; mounting retention unresolved",
            )
        parts.append(item)
        return item

    # Clear internal dimensions exclude the 30 mm structural frame.
    for xname, x in [("left", -15), ("right", W + 15)]:
        for yname, y in [("front", -15), ("back", D + 15)]:
            part(f"post-{xname}-{yname}", [30, 30, H + 60], [x, y, H / 2])
    for level, z in [("bottom", -15), ("top", H + 15)]:
        for side, y in [("front", -15), ("back", D + 15)]:
            part(f"rail-{side}-{level}", [W, 30, 30], [W / 2, y, z])
        for side, x in [("left", -15), ("right", W + 15)]:
            part(f"rail-{side}-{level}", [30, D, 30], [x, D / 2, z])
    for index, y in enumerate([D / 3, 2 * D / 3]):
        part(f"beam-roof-{index + 1}", [W - 15, 30, 30], [(W + 15) / 2, y, H + 15], assembly="roof")
    part("post-left-middle", [30, 30, H], [-15, left_jamb, H / 2])
    part("post-back-middle", [30, 30, H], [rear_jamb, D + 15, H / 2])
    part("panel-right", [t, D, H], [W + 30 + t / 2, D / 2, H / 2], "panel", "walls")
    part(
        "panel-left-front",
        [t, left_jamb - 15, H],
        [-30 - t / 2, (left_jamb - 15) / 2, H / 2],
        "panel",
        "walls",
    )
    part(
        "panel-back-left",
        [rear_jamb - 15, t, H],
        [(rear_jamb - 15) / 2, D + 30 + t / 2, H / 2],
        "panel",
        "walls",
    )
    part(
        "panel-roof",
        [W + 60, D + 60, t],
        [W / 2, D / 2, H + 30 + t / 2],
        "panel",
        "roof",
        holes=[
            dict(
                center=[0, 0],
                diameter_mm=p["hose_diameter_mm"] + 10,
                x_mm=(W + 60) / 2,
                y_mm=(D + 60) / 2,
                axis="z",
            )
        ],
    )
    # Frame joints meet at face centres; all values are local to each physical member.
    lookup = {v["id"]: v for v in parts}

    def joint(a, b, world):
        pa, pb = lookup[a], lookup[b]
        local_a = [world[i] - pa["position"][i] for i in range(3)]
        local_b = [world[i] - pb["position"][i] for i in range(3)]

        def normal(part, local):
            axis = max(range(3), key=lambda i: abs(local[i]) / (part["size"][i] / 2))
            result = [0.0, 0.0, 0.0]
            result[axis] = 1.0 if local[axis] > 0 else -1.0
            return result

        joints.append(
            dict(
                id=f"{a}--{b}",
                part_a=a,
                part_b=b,
                local_a=local_a,
                local_b=local_b,
                normal_a=normal(pa, local_a),
                normal_b=normal(pb, local_b),
                feature_type="mating-plane",
                angular_tolerance_deg=0.01,
                tolerance_mm=0.01,
                contact=dict(type="mating", max_overlap_mm3=0.01, minimum_contact_area_mm2=1.0),
                mounting_verified=False,
            )
        )

    # Continuous posts accept standard side-mounted brackets, avoiding custom corner cubes.
    for side, x in [("left", -15), ("right", W + 15)]:
        for end, y in [("front", -15), ("back", D + 15)]:
            for level, z in [("bottom", -15), ("top", H + 15)]:
                joint(
                    f"post-{side}-{end}",
                    f"rail-{end}-{level}",
                    [0 if side == "left" else W, y, z],
                )
                joint(
                    f"post-{side}-{end}",
                    f"rail-{side}-{level}",
                    [x, 0 if end == "front" else D, z],
                )
                zz = 15 if level == "bottom" else H - 15
                for face, pos, rot in [
                    ("x", [15 if side == "left" else W - 15, y, zz], 0),
                    ("y", [x, 15 if end == "front" else D - 15, zz], 90),
                ]:
                    if (
                        level == "bottom"
                        and end == "back"
                        and ((side == "left" and face == "y") or (side == "right" and face == "x"))
                    ):
                        # Candidate hidden L connector in the inward-facing slots;
                        # the purchased part remains present, not deleted to pass.
                        hidden = [-5, D + 15 - 31.3 / 2, -15 + 21.7792841 / 2]
                        if side == "right":
                            hidden = [W - 0.65, D + 5, hidden[2]]
                        part(
                            f"bracket-{side}-{end}-{level}-{face}",
                            [13, 31.3, 21.7792841],
                            hidden,
                            "hardware",
                            "frame",
                            -90 if side == "right" else 0,
                            product_code="CIB08T",
                            supplier="Reiman Portugal",
                            geometry_fidelity="supplier-step-unconfirmed-slot-envelope",
                            cad_asset="CIB08T.step",
                            mounting_orientation_confirmed=False,
                            source="https://reiman.pt/en/wlw-cib08t-cib08t-slot-8-type-t-inner-bracket/",
                            machining="Candidate slot-mounted joint replaces protruding CBR3030; confirm slot engagement, screw access and load capacity before release",
                        )
                        continue
                    part(
                        f"bracket-{side}-{end}-{level}-{face}",
                        [29.122, 26, 29.122],
                        pos,
                        "hardware",
                        "frame",
                        rot,
                        product_code="CBR3030",
                        supplier="Reiman Portugal",
                        geometry_fidelity="unconfirmed-bracket-orientation",
                        cad_asset="CBR3030.step",
                        mounting_orientation_confirmed=False,
                    )
    for mid, rail, x, y in [
        ("post-left-middle", "left", -15, left_jamb),
        ("post-back-middle", "back", rear_jamb, D + 15),
    ]:
        for level, z in [("bottom", 0), ("top", H)]:
            joint(mid, f"rail-{rail}-{level}", [x, y, z])
    for index, y in enumerate([D / 3, 2 * D / 3]):
        for side, x in [("left", 15), ("right", W)]:
            joint(f"beam-roof-{index + 1}", f"rail-{side}-top", [x, y, H + 15])

    def leaf(
        door, leaf_id, length, pivot, base_deg, normal_offset, zlo, zhi, edge_gap=None, start=0
    ):
        # Local X along hinge-axis link. Local Y is left normal; sign handled in base rotation.
        bh = zhi - zlo
        gap = c if edge_gap is None else edge_gap
        width = length - 2 * gap
        created = []
        outward = 1 if door == "front-right" else -1
        for suffix, size, local in [
            ("stile-a", [30, 30, bh], [gap + 15, normal_offset, (zlo + zhi) / 2]),
            (
                "stile-b",
                [30, 30, bh],
                [length - gap - 15, normal_offset, (zlo + zhi) / 2],
            ),
            ("rail-low", [width - 60, 30, 30], [length / 2, normal_offset, zlo + 15]),
            ("rail-high", [width - 60, 30, 30], [length / 2, normal_offset, zhi - 15]),
        ]:
            item = part(
                f"{door}-{leaf_id}-{suffix}",
                size,
                _add(pivot, _rotate(local, base_deg)),
                assembly=door,
                rotation=base_deg,
                motion_leaf=leaf_id,
                motion_local=local,
            )
            created.append(item)
        material = p["door_material"] if door.startswith("front-") else p["bifold_material"]
        th = (
            4
            if material == "polycarbonate"
            else p["glass_thickness_mm"]
            if material == "glass"
            else t
        )
        local = [length / 2, normal_offset, (zlo + zhi) / 2]
        item = part(
            f"{door}-{leaf_id}-infill",
            [width - 60 - 2 * c, th, bh - 60 - 2 * c],
            _add(pivot, _rotate(local, base_deg)),
            "glass" if material == "glass" else "panel",
            door,
            base_deg,
            material=material,
            motion_leaf=leaf_id,
            motion_local=local,
            retention="Supplier-selected surface clips; no glass holes assumed",
        )
        created.append(item)
        # retention clips sit on frame, not inside the clear infill envelope
        for index, xx in enumerate([c + 15, length - c - 15]):
            for zz in [zlo + 45, zhi - 45]:
                local = [xx, normal_offset + 19 * outward, zz]
                created.append(
                    part(
                        f"{door}-{leaf_id}-clip-{index}-{int(zz)}",
                        [12, 8, 15],
                        _add(pivot, _rotate(local, base_deg)),
                        "hardware",
                        door,
                        base_deg,
                        motion_leaf=leaf_id,
                        motion_local=local,
                    )
                )
        # handles and closing stop/latch represented by explicit conservative envelopes
        local = [length - c - 15, normal_offset + 34 * outward, (zlo + zhi) / 2]
        created.append(
            part(
                f"{door}-{leaf_id}-handle",
                [14, 20, 80],
                _add(pivot, _rotate(local, base_deg)),
                "hardware",
                door,
                base_deg,
                motion_leaf=leaf_id,
                motion_local=local,
            )
        )
        for item in created:
            item["motion_local"][0] += start
            item["position"] = _add(pivot, _rotate(item["motion_local"], base_deg))
        return [v["id"] for v in created]

    # Front left local Y points outward; right mirrored through basis and angle.
    for id, pivot, base, sign in [
        ("front-left", [0, -45 - c, 0], 0, -1),
        ("front-right", [W, -45 - c, 0], 180, 1),
    ]:
        length = W / 2
        ids = leaf(id, "a", length, pivot, base, 0, c, H - c)
        doors.append(
            dict(
                id=id,
                type="swing",
                part_ids=ids,
                pivot=pivot,
                base_deg=base,
                opening_sign=sign,
                max_angle_deg=110,
                link_length_mm=length,
                axis_offset_mm=0,
            )
        )
    from .bifold import add_bifolds

    add_bifolds(part, leaf, doors, p)
    # Hardware bodies are explicitly listed but mating and fixings require catalog selection.
    for door in doors:
        if door["type"] == "bifold":
            continue
        for kind, xx in [
            ("frame-hinge", 0),
            (
                "latch",
                door["link_length_mm"] * (2 if door["type"] == "bifold" else 1) - 20,
            ),
        ]:
            for index, zz in enumerate([80, H - 100]):
                item = part(
                    f"{door['id']}-{kind}-{index}",
                    [10, 10, 35],
                    _add(door["pivot"], _rotate([xx, 0, zz], door["base_deg"])),
                    "hardware",
                    door["id"],
                    door["base_deg"],
                    product_code="GLR3030" if kind == "frame-hinge" else None,
                    geometry_fidelity="unconfirmed-hardware-envelope",
                )
                if kind == "latch":
                    item.update(
                        motion_leaf="b" if door["type"] == "bifold" else "a",
                        motion_local=[door["link_length_mm"] - 20, 0, zz],
                    )
                door["part_ids"].append(item["id"])
    part(
        "machine-envelope",
        [p["machine_width_mm"], p["machine_depth_mm"], p["machine_height_mm"]],
        [W / 2, D / 2, p["machine_height_mm"] / 2],
        "machine-envelope",
        "references",
        physical=False,
        geometry_fidelity="unconfirmed-clearance-reference",
    )
    part(
        "hose-envelope",
        [
            p["hose_diameter_mm"],
            p["hose_diameter_mm"],
            H - p["machine_height_mm"] if H > p["machine_height_mm"] else 1,
        ],
        [W / 2, D / 2, (H + p["machine_height_mm"]) / 2],
        "hose-envelope",
        "references",
        physical=False,
        geometry_fidelity="unconfirmed-clearance-reference",
    )
    assumptions = [
        dict(id=id, description=desc, confirmed=False, references=refs)
        for id, desc, refs in [
            (
                "machine-envelope",
                "Machine dimensions are configurable placeholders, not verified Shapeoko 5 Pro 4x4 swept dimensions.",
                ["machine-envelope"],
            ),
            (
                "hose-routing",
                "Confirm spindle, dust shoe, hose bend radius, support and full travel routing.",
                ["hose-envelope"],
            ),
            (
                "hardware-interfaces",
                "Supplier hinge, track, carriage, latch, CBR3030 brackets, panel clips and fastener interfaces require selection and mounting drawings.",
                [],
            ),
            (
                "door-sag",
                "Panel weight, hinge capacity, sag and workshop squareness allowance require confirmation.",
                [],
            ),
            (
                "roof-support",
                "Confirm roof panel load and extrusion deflection; roof is not a shelf and hose requires independent support.",
                ["panel-roof", "beam-roof-1", "beam-roof-2"],
            ),
            (
                "panel-specification",
                "Confirm material, thickness tolerances, glass edge finish and retention compatibility.",
                [],
            ),
        ]
    ]
    requirements = [
        dict(id=id, description=desc, category=cat, references=refs)
        for id, desc, cat, refs in [
            (
                "inventory",
                "All canonical physical parts must be present.",
                "integrity",
                [],
            ),
            ("joints", "Every declared mating feature must coincide.", "assembly", []),
            (
                "solid-clearance",
                "All nonpermitted physical intersections must be rejected.",
                "geometry",
                [],
            ),
            (
                "door-motion",
                "Full door travel and simultaneous permitted operation require clearance evidence.",
                "motion",
                [d["id"] for d in doors],
            ),
            (
                "workpiece-access",
                "Full working-area board must enter through front doors.",
                "access",
                ["front-left", "front-right"],
            ),
            (
                "machine-fit",
                "Confirmed machine moving envelope must fit.",
                "machine",
                ["machine-envelope"],
            ),
            (
                "supplier-readiness",
                "All supplier dimensions and mounting requirements must be resolved before ordering.",
                "ordering",
                [],
            ),
        ]
    ]
    model = dict(
        units="mm",
        parameters=p,
        parts=parts,
        joints=joints,
        doors=doors,
        requirements=requirements,
        assumptions=assumptions,
        ordering=dict(
            status="request-for-quotation-only",
            supplier="Reiman Portugal",
            unresolved=[
                "Supplier mounting drawings and fasteners",
                "Machine swept envelope",
                "Glass/panel retention and allowable weight",
                "Profile actual cross-sections and end machining",
                "CBR3030 bracket orientation and midpost fastening schedule",
            ],
        ),
        schema_version=SCHEMA_VERSION,
        profile_asset_sha256=ASSET_SHA256,
    )
    from .bifold_completion import complete_bifolds
    from .containment_geometry import add_containment
    from .glazing import add_glazing

    add_glazing(model)
    complete_bifolds(model)
    add_containment(model)
    model["assumptions"].append(
        dict(
            id="metal-rail-retention",
            confirmed=False,
            description="Continuous 18 x 4 steel keepers, welded 4 mm end bars and metal sleeve/bridge-washer clamp path are geometric proposals, not rated retention. Confirm welds, fastener grade/engagement/locking, slot nut and washer strength, tolerances, impact loads and tilt/side escape tests. Rail end bars are backup overtravel stops; operating catches remain pending.",
            references=["left-rear-rail-end-stop-park", "back-right-rail-end-stop-park"],
        )
    )
    model["ordering"]["unresolved"].append(
        "Custom welded steel rail retainers, bridge washers and compression sleeves: supplier fabrication and clamp/impact/retention validation pending"
    )
    model["assumptions"].append(
        dict(
            id="printed-guide-prototype",
            description="PETG A1 mini guide prototype with custom metal carrier and keepers: fasteners, operating-stop capacity, catch installation, CFG mounting, polycarbonate retention, seal clearance, creep and wear remain unvalidated. Doors remain hinge-supported; geometric retention does not establish a rated assembly.",
            confirmed=False,
            references=["left-rear-track", "back-right-track"],
        )
    )
    model["ordering"]["unresolved"].append(
        "Custom metal carrier, provisional axle/spacers/fasteners, 3060 header mounting, stop capacity, catch installation, seals and physical load/wear tests"
    )
    model["engineering_source_sha256"] = hashlib.sha256(
        b"".join(
            (Path(__file__).parent / name).read_bytes()
            for name in (
                "core.py",
                "profiles.py",
                "constraints.py",
                "containment_geometry.py",
                "bifold.py",
                "glazing.py",
                "bifold_completion.py",
                "verification.py",
            )
        )
    ).hexdigest()
    model["revision"] = hashlib.sha256(
        json.dumps(model, sort_keys=True, allow_nan=False).encode()
    ).hexdigest()[:16]
    return model


def pose_model(model, pose=None):
    result = copy.deepcopy(model)
    pose = {} if pose is None else pose
    if not isinstance(pose, dict):
        raise ValueError("pose must be an object")
    known = {d["id"] for d in model["doors"]}
    if set(pose) - known:
        raise ValueError("Unknown door pose")
    for key, value in pose.items():
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or not 0 <= value <= 1
        ):
            raise ValueError(f"Pose {key} must be in [0,1]")
    if pose.get("front-left", 0) > 0 and pose.get("front-right", 0) < 1:
        raise ValueError("Open right front leaf fully before left; close left before right")
    lookup = {p["id"]: p for p in result["parts"]}
    for d in result["doors"]:
        theta = pose.get(d["id"], 0) * d["max_angle_deg"] * d["opening_sign"]
        base = d["base_deg"]
        L = d["link_length_mm"]
        pivot = d["pivot"]
        elbow = _add(pivot, _rotate([L, 0, 0], base + theta))
        slider = _add(pivot, _rotate([2 * L * math.cos(math.radians(theta)), 0, 0], base))
        second_angle = -theta
        if d.get("mechanism") == "printed-guide-revision-c":
            from .bifold import local_pose

            elbow_local, slider_local, second_angle = local_pose(d, theta)
            elbow = _add(pivot, _rotate(elbow_local, base))
            slider = _add(pivot, _rotate(slider_local, base))
        for id in d["part_ids"]:
            item = lookup[id]
            leaf = item.get("motion_leaf")
            if not leaf:
                continue
            origin = pivot
            angle = base + theta
            if leaf == "b":
                origin = elbow
                angle = base + second_angle
            if leaf == "slider":
                origin = slider
                angle = base
            item["position"] = _add(origin, _rotate(item["motion_local"], angle))
            item["rotation_deg"] = angle
        d["pose_fraction"] = pose.get(d["id"], 0)
        d["kinematics"] = dict(elbow=elbow, slider=slider, theta_deg=theta)
    result["pose"] = dict(pose)
    return result


def build_shapes(model, pose=None):
    import cadquery as cq

    evaluated = pose_model(model, pose) if pose is not None else model
    result = {}
    for p in evaluated["parts"]:
        sx, sy, sz = p["size"]
        if p["category"] == "extrusion":
            from .profiles import extrusion

            shape = extrusion(p["cut_length_mm"], p["length_axis"], p["product_code"])
        elif p.get("cad_asset") in ("GN_753.1-22-B5-ZL-1.stp", "GN_753.2-4-5-3-AE-NI.stp"):
            from .profiles import roller_component

            shape = roller_component(p["cad_asset"], p.get("cad_reversed_axis", False))
        elif p.get("cad_asset") == "CFG3030.stp":
            from .profiles import hinge_component

            shape = hinge_component(p["cad_component"], p["hinge_exterior"])[0]
        elif p.get("cad_asset") == "CIB08T.step":
            from .profiles import inner_bracket

            shape = inner_bracket()
        elif p.get("cad_asset"):
            from .profiles import bracket

            shape = bracket()
        else:
            shape = cq.Workplane("XY").box(sx, sy, sz).val()
        if p.get("geometry", {}).get("kind") == "fsp08-study":
            from .glazing import gasket_shape

            shape = gasket_shape(p["size"], p["geometry"]["side"])
        if p.get("geometry", {}).get("kind") == "park-stop-bracket":
            from .bifold_completion import park_bracket

            shape = park_bracket()[0]
        if p.get("geometry", {}).get("kind") == "ghd9008b-study":
            from .bifold_completion import handle_shape

            shape = handle_shape()
        if p.get("geometry", {}).get("kind") == "angled-head-brush-study":
            # Installed bristle envelope, not solid rubber or vendor CAD.
            shape = (
                cq.Workplane("YZ")
                .polyline([(-10, 0), (-10, 12), (10, 0), (10, -12)])
                .close()
                .extrude(sx)
                .val()
                .translate((-sx / 2, 0, 0))
            )
        if p.get("geometry", {}).get("kind") == "printed-guide-body":
            channel = cq.Workplane("XY").box(sx + 2, 23, 21).val().translate((0, 0, -2))
            shape = shape.cut(channel)
            # Open the unprintable 0.4 mm webs at the mounting sleeves instead
            # of leaving fragile skins between each bore and the roller channel.
            # Roller bridging across these local recesses needs coupon testing.
            for hole in p.get("holes", []):
                xx, yy = hole["center"]
                web = (
                    cq.Workplane("XY")
                    .box(6.4, 1.4, 21)
                    .val()
                    .translate((xx, math.copysign(11.9, yy), -2))
                )
                shape = shape.cut(web)
            for end in (-1, 1):
                for row in (-20, 20):
                    pocket = (
                        cq.Workplane("XY")
                        .box(15.2, 3.4, 2)
                        .val()
                        .translate((end * (sx / 2 - 7.6), row, 11.5))
                    )
                    shape = shape.cut(pocket)
        if p.get("geometry", {}).get("kind") == "cylinder":
            shape = cq.Solid.makeCylinder(
                p["geometry"]["diameter_mm"] / 2, sz, cq.Vector(0, 0, -sz / 2)
            )
        if p.get("geometry", {}).get("kind") == "annulus":
            g = p["geometry"]
            shape = cq.Solid.makeCylinder(
                g["outer_diameter_mm"] / 2, sz, cq.Vector(0, 0, -sz / 2)
            ).cut(
                cq.Solid.makeCylinder(
                    g["inner_diameter_mm"] / 2, sz + 2, cq.Vector(0, 0, -sz / 2 - 1)
                )
            )
        for cutout in p.get("cutouts", []):
            if cutout["kind"] == "rectangle":
                axis = cutout["normal_axis"]
                axes = [i for i in range(3) if i != axis]
                dims = [0.0, 0.0, 0.0]
                dims[axis] = p["size"][axis] + 2
                dims[axes[0]] = cutout["width_mm"]
                dims[axes[1]] = cutout["height_mm"]
                cutter = (
                    cq.Workplane("XY").box(*dims).val().translate(tuple(cutout["center_local_mm"]))
                )
                shape = shape.cut(cutter)
        for hole in p.get("holes", []):
            x, y = hole["center"]
            if hole.get("counterbore_top_diameter_mm"):
                depth = hole["counterbore_top_depth_mm"]
                shape = shape.cut(
                    cq.Solid.makeCylinder(
                        hole["counterbore_top_diameter_mm"] / 2,
                        depth + 1,
                        cq.Vector(x, y, sz / 2 - depth),
                    )
                )
            if hole.get("axis") == "y":
                cutter = cq.Solid.makeCylinder(
                    hole["diameter_mm"] / 2,
                    sy + 2,
                    cq.Vector(x, -sy / 2 - 1, y),
                    cq.Vector(0, 1, 0),
                )
            else:
                cutter = cq.Solid.makeCylinder(
                    hole["diameter_mm"] / 2, sz + 2, cq.Vector(x, y, -sz / 2 - 1)
                )
            shape = shape.cut(cutter)
        shape = shape.rotate((0, 0, 0), (0, 0, 1), p["rotation_deg"]).translate(
            tuple(p["position"])
        )
        result[p["id"]] = shape
    return result

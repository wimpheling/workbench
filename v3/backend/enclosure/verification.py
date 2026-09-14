"""Independent measurements of evaluated assemblies, with fail-closed evidence.

OpenCascade is a floating-point engineering kernel, not a formal proof system.
Missing supplier and physical evidence is deliberately retained as unknown.
"""

from __future__ import annotations

import hashlib
import itertools
import math
from collections import Counter
from pathlib import Path

KERNEL_VOLUME_TOLERANCE_MM3 = 1e-5
KERNEL_LENGTH_TOLERANCE_MM = 1e-6


def _finite(values):
    return isinstance(values, (list, tuple)) and all(
        isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) for x in values
    )


def _world(part, point):
    theta = math.radians(part.get("rotation_deg", 0))
    x, y, z = point
    cx, cy, cz = part["position"]
    return (
        cx + x * math.cos(theta) - y * math.sin(theta),
        cy + x * math.sin(theta) + y * math.cos(theta),
        cz + z,
    )


def _bbox(shape):
    b = shape.BoundingBox()
    return ((b.xmin, b.ymin, b.zmin), (b.xmax, b.ymax, b.zmax))


def _box_distance(a, b):
    return math.sqrt(sum(max(0, a[0][i] - b[1][i], b[0][i] - a[1][i]) ** 2 for i in range(3)))


def _conservative(part):
    fidelity = part.get("geometry_fidelity", "")
    return "envelope" in fidelity and "orientation" not in fidelity


def check_barrier_region(shapes, region, required_overlap_mm=0.0, cut_tolerance_mm=0.0):
    """Measure a continuous barrier through actual solids, including any holes.

    The target is a 0.02 mm thick plate inside the nominal sealing stock. Its
    in-plane footprint is the protected gap plus overlap and worst-case cut
    allowances. Subtracting actual barrier solids measures every uncovered
    region, rather than inferring coverage from external bounding boxes.
    """
    import cadquery as cq

    axis = region["normal_axis"]
    if axis not in (0, 1, 2):
        raise ValueError("Barrier axis must be 0, 1 or 2")
    low, high = region["min_mm"], region["max_mm"]
    if not _finite(low) or not _finite(high) or len(low) != 2 or len(high) != 2:
        raise ValueError("Barrier requires two finite in-plane coordinates")
    if (
        not _finite([region["plane_mm"], required_overlap_mm, cut_tolerance_mm])
        or min(required_overlap_mm, cut_tolerance_mm) < 0
    ):
        raise ValueError("Barrier overlap, plane and tolerance must be finite and nonnegative")
    axes = [i for i in range(3) if i != axis]
    allowance = required_overlap_mm + 2 * cut_tolerance_mm
    thickness = 0.02
    size, center = [thickness] * 3, [0.0] * 3
    center[axis] = region["plane_mm"]
    for index, target_axis in enumerate(axes):
        size[target_axis] = high[index] - low[index] + 2 * allowance
        if size[target_axis] <= 0:
            raise ValueError("Barrier footprint must have positive area")
        center[target_axis] = (low[index] + high[index]) / 2
    target = cq.Workplane("XY").box(*size).translate(tuple(center)).val()
    remaining = target
    target_bounds = _bbox(target)
    for id in region["part_ids"]:
        if id not in shapes:
            return {
                "status": "fail",
                "message": "Required barrier solid is missing",
                "references": [id],
            }
        if _box_distance(target_bounds, _bbox(shapes[id])) > KERNEL_LENGTH_TOLERANCE_MM:
            continue
        remaining = remaining.cut(shapes[id])
        if remaining.Volume() / thickness <= 1e-4:
            break
    missing_area = remaining.Volume() / thickness
    return {
        "status": "pass" if missing_area <= 1e-4 else "fail",
        "message": "Actual continuous barrier footprint after overlap and opposing cut allowances",
        "references": region["part_ids"],
        "measured": missing_area,
        "required": 0.0,
        "unit": "mm² uncovered",
        "method": "OpenCascade difference of thin target plate and actual barrier solids",
        "overlap_mm": required_overlap_mm,
        "opposing_cut_allowance_mm": 2 * cut_tolerance_mm,
    }


def check_barrier_connection(shapes, pair):
    """Nominal connected barrier chain; not adhesive or bristle performance."""
    if any(pid not in shapes for pid in pair):
        return dict(
            status="fail", message="Required barrier connection is missing", references=pair
        )
    distance = shapes[pair[0]].distance(shapes[pair[1]])
    return dict(
        status="pass" if distance <= KERNEL_LENGTH_TOLERANCE_MM else "fail",
        message="Nominal hood/holder/brush/leaf contact; attachment and flexible performance unvalidated",
        references=pair,
        measured=distance,
        required=KERNEL_LENGTH_TOLERANCE_MM,
        unit="mm",
        method="OpenCascade minimum distance of adjacent barrier solids",
    )


def check_solid_pair(a, b, clearance_mm=0.0, permitted_overlap_mm3=0.0):
    """Zero required clearance still prohibits positive-volume penetration."""
    if not math.isfinite(clearance_mm) or clearance_mm < 0:
        return {"status": "fail", "message": "Invalid required clearance"}
    try:
        ba, bb = _bbox(a), _bbox(b)
        if _box_distance(ba, bb) > clearance_mm + KERNEL_LENGTH_TOLERANCE_MM:
            return {
                "status": "pass",
                "message": "Separated bounding boxes",
                "method": "conservative AABB separation",
            }
        if clearance_mm == 0 and any(
            min(ba[1][i], bb[1][i]) <= max(ba[0][i], bb[0][i]) for i in range(3)
        ):
            return {
                "status": "pass",
                "message": "Bounding boxes prohibit positive-volume intersection",
                "method": "conservative AABB separation or boundary contact",
            }
        overlap = a.intersect(b).Volume()
        if overlap > permitted_overlap_mm3 + KERNEL_VOLUME_TOLERANCE_MM3:
            return {
                "status": "fail",
                "message": "Prohibited solid penetration",
                "measured": overlap,
                "required": permitted_overlap_mm3,
                "unit": "mm³",
                "method": "OpenCascade solid intersection",
            }
        distance = a.distance(b) if clearance_mm else 0.0
        return {
            "status": "pass" if distance + KERNEL_LENGTH_TOLERANCE_MM >= clearance_mm else "fail",
            "message": "Measured solid clearance",
            "measured": distance,
            "required": clearance_mm,
            "unit": "mm",
            "method": "OpenCascade minimum distance and intersection",
        }
    except Exception as exc:  # noqa: BLE001 - kernel failures must retain unknown evidence
        return {
            "status": "unknown",
            "message": f"Geometry kernel could not establish clearance: {exc}",
        }


def actual_infill_gap_regions(model):
    """Derive gaps from actual panel/frame dimensions, independent of seam targets."""
    by_id = {p["id"]: p for p in model["parts"]}
    regions = []
    for panel in model["parts"]:
        if not panel["id"].endswith("-infill"):
            continue
        prefix = panel["id"][: -len("-infill")]
        frame = [
            by_id[prefix + suffix] for suffix in ("-stile-a", "-stile-b", "-rail-low", "-rail-high")
        ]
        theta = math.radians(panel["rotation_deg"])
        c, s = math.cos(theta), math.sin(theta)

        def local_bounds(part, c=c, s=s):
            x, y, z = part["position"]
            center = [x * c + y * s, -x * s + y * c, z]
            return (
                [center[i] - part["size"][i] / 2 for i in range(3)],
                [center[i] + part["size"][i] / 2 for i in range(3)],
            )

        pmin, pmax = local_bounds(panel)
        left, right, bottom, top = [local_bounds(p) for p in frame]
        rectangles = [
            ([left[1][0], pmin[2]], [pmin[0], pmax[2]]),
            ([pmax[0], pmin[2]], [right[0][0], pmax[2]]),
            ([pmin[0], bottom[1][2]], [pmax[0], pmin[2]]),
            ([pmin[0], pmax[2]], [pmax[0], top[0][2]]),
        ]
        normal_axis = 0 if abs(s) > 0.5 else 1
        inplane_axis = 1 - normal_axis
        y = (pmin[1] + pmax[1]) / 2
        for index, (low, high) in enumerate(rectangles):
            if any(high[i] <= low[i] for i in range(2)):
                continue
            corners = [
                [x * c - y * s, x * s + y * c, z]
                for x, z in itertools.product((low[0], high[0]), (low[1], high[1]))
            ]
            regions.append(
                (
                    f"{prefix}.{index}",
                    dict(
                        normal_axis=normal_axis,
                        plane_mm=corners[0][normal_axis],
                        min_mm=[min(v[inplane_axis] for v in corners), low[1]],
                        max_mm=[max(v[inplane_axis] for v in corners), high[1]],
                        part_ids=[
                            p["id"]
                            for p in model["parts"]
                            if p.get("assembly") == panel.get("assembly")
                            and p.get("physical", True)
                        ],
                    ),
                )
            )
    return regions


def _trig_range(a, b, lo, hi):
    """Exact extrema of a*cos(theta)+b*sin(theta), rounded outwards."""
    lo, hi = sorted((lo, hi))
    candidates = [lo, hi]
    critical = math.atan2(b, a)
    for k in range(math.floor((lo - critical) / math.pi), math.ceil((hi - critical) / math.pi) + 1):
        value = critical + k * math.pi
        if lo <= value <= hi:
            candidates.append(value)
    values = [a * math.cos(t) + b * math.sin(t) for t in candidates]
    return min(values) - KERNEL_LENGTH_TOLERANCE_MM, max(values) + KERNEL_LENGTH_TOLERANCE_MM


def swept_box(part, door, low=0.0, high=1.0):
    """Conservative continuous box for the explicit planar swing/equal-link bifold.

    Each local box corner is a linear combination of sin/cos(theta), including
    the bifold elbow translation. Analytic extrema include every intermediate
    pose. This encloses boxes/solids; intersection of bounds is not collision.
    """
    if not door or not part.get("motion_leaf"):
        corners = [
            _world(part, c) for c in itertools.product(*[(-v / 2, v / 2) for v in part["size"]])
        ]
        return tuple(tuple(fn(c[i] for c in corners) for i in range(3)) for fn in (min, max))
    angle = math.radians(door["max_angle_deg"] * door["opening_sign"])
    base = math.radians(door["base_deg"])
    cb, sb = math.cos(base), math.sin(base)
    if door.get("mechanism") == "printed-guide-revision-c":
        # Independent interval bounds, not sampled extrema and not the old
        # equal-link solver. Asin is monotone on the selected closure branch.
        px, py, _ = door["primary_link_mm"]
        qx, qy, _ = door["secondary_link_mm"]
        lo, hi = sorted((low * angle, high * angle))
        ey = _trig_range(py, px, lo, hi)
        radius = math.hypot(qx, qy)
        phi = [
            math.asin(max(-1, min(1, (door["guide_normal_mm"] - y) / radius))) - math.atan2(qy, qx)
            for y in reversed(ey)
        ]
        pworld = [(cb * px - sb * py, -cb * py - sb * px), (sb * px + cb * py, -sb * py + cb * px)]
        minimum, maximum = [math.inf] * 3, [-math.inf] * 3
        for delta in itertools.product(*[(-v / 2, v / 2) for v in part["size"]]):
            x, y, z = [part["motion_local"][i] + delta[i] for i in range(3)]
            leaf = part["motion_leaf"]
            if leaf == "slider":
                # Slider centre is B+R(phi)q; its body remains at base angle.
                coeff = [
                    (cb * qx - sb * qy, -cb * qy - sb * qx),
                    (sb * qx + cb * qy, -sb * qy + cb * qx),
                ]
                extra = [cb * x - sb * y, sb * x + cb * y]
            else:
                coeff = [(cb * x - sb * y, -cb * y - sb * x), (sb * x + cb * y, -sb * y + cb * x)]
                extra = [0, 0]
            for axis in range(2):
                a, b = _trig_range(*coeff[axis], *((lo, hi) if leaf == "a" else phi))
                if leaf != "a":
                    ea, eb = _trig_range(*pworld[axis], lo, hi)
                    a, b = a + ea, b + eb
                minimum[axis] = min(minimum[axis], door["pivot"][axis] + extra[axis] + a)
                maximum[axis] = max(maximum[axis], door["pivot"][axis] + extra[axis] + b)
            minimum[2] = min(minimum[2], door["pivot"][2] + z)
            maximum[2] = max(maximum[2], door["pivot"][2] + z)
        return tuple(minimum), tuple(maximum)
    length = door["link_length_mm"]
    minima, maxima = [math.inf] * 3, [-math.inf] * 3
    for delta in itertools.product(*[(-v / 2, v / 2) for v in part["size"]]):
        x, y, z = [part["motion_local"][i] + delta[i] for i in range(3)]
        leaf = part["motion_leaf"]
        if leaf == "a":
            coeffs = [
                (cb * x - sb * y, -cb * y - sb * x),
                (sb * x + cb * y, -sb * y + cb * x),
            ]
            offsets = door["pivot"][:2]
        elif leaf == "b":
            coeffs = [
                (cb * (length + x) - sb * y, cb * y - sb * (length - x)),
                (sb * (length + x) + cb * y, sb * y + cb * (length - x)),
            ]
            offsets = door["pivot"][:2]
        elif leaf == "slider":
            coeffs = [(2 * length * cb, 0), (2 * length * sb, 0)]
            offsets = [
                door["pivot"][0] + cb * x - sb * y,
                door["pivot"][1] + sb * x + cb * y,
            ]
        else:
            raise ValueError(f"Unsupported moving link {leaf}")
        for axis in range(2):
            lower, upper = _trig_range(*coeffs[axis], low * angle, high * angle)
            minima[axis] = min(minima[axis], lower + offsets[axis])
            maxima[axis] = max(maxima[axis], upper + offsets[axis])
        minima[2] = min(minima[2], door["pivot"][2] + z)
        maxima[2] = max(maxima[2], door["pivot"][2] + z)
    return tuple(minima), tuple(maxima)


def _motion_check(model, shapes, closed_results):
    from .core import pose_model

    sequence = model.get("door_sequence")
    if sequence:
        if sequence.get("closing") != ["front-left", "front-right"] or sequence.get("opening") != [
            "front-right",
            "front-left",
        ]:
            raise ValueError("Unsupported front door sequence; motion domain cannot be inferred")
        try:
            pose_model(model, {"front-left": 0.5, "front-right": 0.5})
        except ValueError:
            pass
        else:
            raise ValueError("Declared front sequence is not enforced by pose evaluation")

    doors = {d["id"]: d for d in model.get("doors", [])}
    members = {id: d for d in doors.values() for id in d["part_ids"]}
    moving = {
        id
        for id, d in members.items()
        if any(p["id"] == id and p.get("motion_leaf") for p in model["parts"])
    }
    parts = [p for p in model["parts"] if p["id"] in shapes]
    bounded, failed, unresolved, invariant, total = 0, [], [], 0, 0
    cache = {}
    posed_cache = {}
    transformed_cache = {}

    def box(p, interval):
        key = (p["id"], *interval)
        if key not in cache:
            cache[key] = swept_box(p, members.get(p["id"]), *interval)
        return cache[key]

    for a, b in itertools.combinations(parts, 2):
        ai, bi = a["id"], b["id"]
        if ai not in moving and bi not in moving:
            continue
        total += 1
        da, db = members.get(ai), members.get(bi)
        pair = frozenset((ai, bi))
        if closed_results.get(pair) == "fail":
            failed.append(
                {
                    "references": [ai, bi],
                    "pose": {d["id"]: 0.0 for d in (da, db) if d},
                    "message": "Closed-pose solid collision is a motion endpoint failure",
                }
            )
            continue
        if da and db and da["id"] == db["id"] and a.get("motion_leaf") == b.get("motion_leaf"):
            result = closed_results.get(pair, "unknown")
            if result == "pass":
                invariant += 1
                continue
        active = sorted({d["id"] for p, d in ((a, da), (b, db)) if d and p.get("motion_leaf")})
        budget = 256 if not any(_conservative(p) for p in (a, b)) else 48
        stack = [{id: (0.0, 1.0) for id in active}]
        if sequence and "front-left" in active:
            # Include the complete two-stage allowed domain, never waive
            # front-to-front collisions or other independently moving doors.
            stage = dict(stack[0], **{"front-right": (1.0, 1.0)})
            if "front-right" in active:
                first = dict(stack[0], **{"front-left": (0.0, 0.0)})
                stack = [first, stage]
            else:
                stack = [stage]
        visits = 0
        outcome = "pass"
        while stack:
            cell = stack.pop()
            visits += 1
            ia = cell.get(da["id"], (0.0, 0.0)) if da else (0.0, 0.0)
            ib = cell.get(db["id"], (0.0, 0.0)) if db else (0.0, 0.0)
            ba, bb = box(a, ia), box(b, ib)
            # Touching bounds cannot prove nonpenetration in floating point.
            if any(
                ba[1][i] < bb[0][i] - KERNEL_LENGTH_TOLERANCE_MM
                or bb[1][i] < ba[0][i] - KERNEL_LENGTH_TOLERANCE_MM
                for i in range(3)
            ):
                continue

            # AABBs of rotated neighbouring leaves overlap even when their
            # solids do not. Try separating projections along midpoint leaf
            # axes; these are still bounds over the entire interval.
            def orientation(p, d, interval):
                if not d or not p.get("motion_leaf") or p.get("motion_leaf") == "slider":
                    return p["rotation_deg"]
                return d["base_deg"] + sum(interval) / 2 * d["max_angle_deg"] * d[
                    "opening_sign"
                ] * (-1 if p["motion_leaf"] == "b" else 1)

            def projected(p, d, interval, deg):
                angle = math.radians(-deg)
                c, s = math.cos(angle), math.sin(angle)

                def rotate(vector):
                    return [
                        vector[0] * c - vector[1] * s,
                        vector[0] * s + vector[1] * c,
                        vector[2],
                    ]

                q = dict(
                    p,
                    position=rotate(p["position"]),
                    rotation_deg=p["rotation_deg"] - deg,
                )
                dd = dict(d, pivot=rotate(d["pivot"]), base_deg=d["base_deg"] - deg) if d else None
                bb = swept_box(q, dd, *interval)
                return bb[0][0], bb[1][0]

            separated = False
            for deg in (
                orientation(a, da, ia),
                orientation(a, da, ia) + 90,
                orientation(b, db, ib),
                orientation(b, db, ib) + 90,
            ):
                pa, pb = projected(a, da, ia, deg), projected(b, db, ib, deg)
                if (
                    pa[1] < pb[0] - KERNEL_LENGTH_TOLERANCE_MM
                    or pb[1] < pa[0] - KERNEL_LENGTH_TOLERANCE_MM
                ):
                    separated = True
                    break
            if separated:
                continue
            if visits == 1:
                pose = {id: sum(interval) / 2 for id, interval in cell.items()}
                pose_key = tuple(sorted(pose.items()))
                if pose_key not in posed_cache:
                    posed_cache[pose_key] = {p["id"]: p for p in pose_model(model, pose)["parts"]}
                posed = posed_cache[pose_key]

                def transformed(p, posed=posed):
                    q = posed[p["id"]]
                    key = (p["id"], tuple(q["position"]), q["rotation_deg"])
                    if key not in transformed_cache:
                        transformed_cache[key] = (
                            shapes[p["id"]]
                            .translate(tuple(-x for x in p["position"]))
                            .rotate(
                                (0, 0, 0),
                                (0, 0, 1),
                                q["rotation_deg"] - p["rotation_deg"],
                            )
                            .translate(tuple(q["position"]))
                        )
                    return transformed_cache[key]

                witness = check_solid_pair(transformed(a), transformed(b))
                if witness["status"] == "fail":
                    conservative = any(_conservative(p) for p in (a, b))
                    outcome = "unknown" if conservative else "fail"
                    (unresolved if conservative else failed).append(
                        dict(
                            references=[ai, bi],
                            pose=pose,
                            message="Envelope interference requires supplier geometry"
                            if conservative
                            else "Solid collision witness",
                            **{k: v for k, v in witness.items() if k in ("measured", "unit")},
                        )
                    )
                    break
            if visits >= budget:
                outcome = "unknown"
                unresolved.append(
                    {
                        "references": [ai, bi],
                        "interval": cell,
                        "message": "Conservative interval bounds remain intersecting at subdivision budget",
                    }
                )
                break
            split = max(active, key=lambda id: cell[id][1] - cell[id][0])
            lo, hi = cell[split]
            mid = (lo + hi) / 2
            for bounds in ((lo, mid), (mid, hi)):
                child = dict(cell)
                child[split] = bounds
                stack.append(child)
        if outcome == "pass":
            bounded += 1
    return {
        "id": "motion.continuous",
        "status": "fail" if failed else "unknown" if unresolved else "pass",
        "category": "motion",
        "message": "Permitted door travel assessed with analytic bounds; unresolved bound intersections are not clearance proofs",
        "references": list(doors),
        "method": "analytic trigonometric corner extrema with adaptive interval subdivision; rigid-link invariance",
        "measured": {
            "pairs": total,
            "bounded_clear": bounded,
            "rigid_invariant": invariant,
            "failed": len(failed),
            "unresolved": len(unresolved),
        },
        "collision_witnesses": failed,
        "unresolved_examples": unresolved,
        "subdivision_budget_per_pair": {"actual_solids": 256, "proxy_envelopes": 48},
        "front_operating_domain": "left=0, right∈[0,1] OR right=1, left∈[0,1]"
        if sequence
        else "independent",
    }


def verify(model: dict, shapes: dict | None = None) -> dict:
    from .core import build_model, build_shapes

    checks = []

    def add(id, status, category, message, references=(), **evidence):
        checks.append(
            dict(
                id=id,
                status=status,
                category=category,
                message=message,
                references=list(references),
                **evidence,
            )
        )

    parts = model.get("parts", [])
    ids = [p.get("id") for p in parts]
    by_id = {p.get("id"): p for p in parts}
    duplicates = [id for id, count in Counter(ids).items() if count > 1]
    add(
        "integrity.identities",
        "fail" if duplicates or None in ids else "pass",
        "integrity",
        "Part identities must be unique and present",
        duplicates,
    )
    add(
        "integrity.units",
        "pass" if model.get("units") == "mm" else "fail",
        "integrity",
        "All dimensions are millimetres",
    )
    canonical = None
    try:
        canonical = build_model(model.get("parameters"))
        expected = {p["id"] for p in canonical["parts"]}
        missing = sorted(expected - set(ids))
        add(
            "integrity.inventory",
            "fail" if missing else "pass",
            "integrity",
            "Required physical inventory is present",
            missing,
            measured=len(set(ids) & expected),
            required=len(expected),
        )
        expected_requirements = {r["id"] for r in canonical.get("requirements", [])}
        missing_requirements = expected_requirements - {
            r["id"] for r in model.get("requirements", [])
        }
        add(
            "integrity.requirements",
            "fail" if missing_requirements else "pass",
            "integrity",
            "Required verification obligations are retained",
            sorted(missing_requirements),
        )
        expected_joints = {j["id"] for j in canonical.get("joints", [])}
        missing_joints = expected_joints - {j["id"] for j in model.get("joints", [])}
        add(
            "integrity.joints",
            "fail" if missing_joints else "pass",
            "integrity",
            "Required joint declarations are retained",
            sorted(missing_joints),
        )
        missing_doors = {d["id"] for d in canonical.get("doors", [])} - {
            d["id"] for d in model.get("doors", [])
        }
        add(
            "integrity.doors",
            "fail" if missing_doors else "pass",
            "integrity",
            "All required door mechanisms are present",
            sorted(missing_doors),
        )
    except Exception as exc:  # noqa: BLE001 - kernel failures must retain unknown evidence
        add(
            "integrity.parameters",
            "fail",
            "integrity",
            f"Cannot establish expected assembly: {exc}",
        )

    invalid_parts = set()
    expected_parts = {p["id"]: p for p in (canonical or {}).get("parts", [])}
    for p in parts:
        id = p.get("id", "missing")
        good = (
            _finite(p.get("size"))
            and len(p["size"]) == 3
            and min(p["size"]) > 0
            and _finite(p.get("position"))
            and len(p["position"]) == 3
            and _finite([p.get("rotation_deg", 0)])
        )
        if "basis" in p:
            # The current geometry contract supports yaw only. Silently
            # accepting a basis that rendering ignores would be false evidence.
            good = False
        if not good:
            invalid_parts.add(id)
        add(
            f"integrity.transform.{id}",
            "pass" if good else "fail",
            "integrity",
            "Finite positive dimensions and rigid transform",
            [id],
        )
        expected = expected_parts.get(id, {})
        metadata_good = (
            all(
                p.get(key) == expected.get(key)
                for key in ("motion_leaf", "motion_local", "physical", "category")
            )
            if expected
            else True
        )
        if not metadata_good:
            add(
                f"integrity.motion_metadata.{id}",
                "fail",
                "integrity",
                "Part participation differs from required assembly; clearance coverage cannot be trusted",
                [id],
            )

    joints = model.get("joints", [])
    # Use the canonical contact permissions: editing a joint must not authorize a collision.
    contact_policies = {}
    for joint in (canonical or {}).get("joints", []):
        a, b = joint.get("part_a"), joint.get("part_b")
        contact = joint.get("contact", {})
        if a and b and contact.get("type") == "mating":
            contact_policies[frozenset((a, b))] = max(0.0, float(contact.get("max_overlap_mm3", 0)))
    for index, joint in enumerate(joints):
        id = joint.get("id", str(index))
        a, b = joint.get("part_a"), joint.get("part_b")
        if a not in by_id or b not in by_id or a in invalid_parts or b in invalid_parts:
            add(
                f"joint.{id}",
                "fail",
                "assembly",
                "Joint references a missing or invalid part",
                [a, b],
            )
            continue
        tolerance = joint.get("tolerance_mm", 0.01)
        if (
            not all(_finite(joint.get(k)) and len(joint[k]) == 3 for k in ("local_a", "local_b"))
            or not _finite([tolerance])
            or tolerance < 0
        ):
            add(
                f"joint.{id}",
                "fail",
                "assembly",
                "Joint requires three finite coordinates per datum and a finite nonnegative tolerance",
                [a, b],
            )
            continue
        distance = math.dist(_world(by_id[a], joint["local_a"]), _world(by_id[b], joint["local_b"]))
        tolerance = joint.get("tolerance_mm", 0.01)
        add(
            f"joint.{id}",
            "pass" if distance <= tolerance else "fail",
            "assembly",
            "Actual transformed mating datum separation",
            [a, b],
            measured=distance,
            required=tolerance,
            unit="mm",
            method="independent rigid transform measurement",
        )
        if "normal_a" in joint or "normal_b" in joint:
            angular_tolerance = joint.get("angular_tolerance_deg", 0.01)
            normals_good = (
                all(
                    _finite(joint.get(k))
                    and len(joint[k]) == 3
                    and math.dist(joint[k], [0, 0, 0]) > 0
                    for k in ("normal_a", "normal_b")
                )
                and _finite([angular_tolerance])
                and angular_tolerance >= 0
            )
            if normals_good:

                def normal(p, n):
                    q = dict(p, position=[0, 0, 0])
                    v = _world(q, n)
                    length = math.sqrt(sum(x * x for x in v))
                    return [x / length for x in v]

                na, nb = (
                    normal(by_id[a], joint["normal_a"]),
                    normal(by_id[b], joint["normal_b"]),
                )
                error = math.degrees(
                    math.acos(max(-1.0, min(1.0, -sum(x * y for x, y in zip(na, nb)))))
                )
                add(
                    f"joint.orientation.{id}",
                    "pass" if error <= angular_tolerance else "fail",
                    "assembly",
                    "Mating plane normals oppose after actual transforms",
                    [a, b],
                    measured=error,
                    required=angular_tolerance,
                    unit="deg",
                )
            else:
                add(
                    f"joint.orientation.{id}",
                    "fail",
                    "assembly",
                    "Invalid mating plane normal or angular tolerance",
                    [a, b],
                )

    if shapes is None and not invalid_parts:
        try:
            shapes = build_shapes(model)
        except Exception as exc:  # noqa: BLE001 - kernel failures must retain unknown evidence
            add("geometry.build", "unknown", "geometry", f"Geometry unavailable: {exc}")
    shapes = shapes or {}
    if model.get("bifold_completion"):
        from .closed_catches import engagement_checks

        checks.extend(engagement_checks(model, shapes))
    physical = [
        p
        for p in parts
        if p.get("physical", True)
        and p.get("category") not in ("machine-envelope", "hose-envelope")
    ]
    envelope_coverage = True
    for p in parts:
        id = p["id"]
        shape = shapes.get(id)
        good = shape is not None
        try:
            good = good and shape.isValid() and shape.Volume() > 0
        except Exception:  # noqa: BLE001 - failed geometry is never certified
            good = False
        add(
            f"geometry.coverage.{id}",
            "pass" if good else "unknown",
            "geometry",
            "Valid solid available for verification" if good else "Missing or invalid solid",
            [id],
        )
        if good and id not in invalid_parts:
            try:
                local = shape.translate(tuple(-v for v in p["position"])).rotate(
                    (0, 0, 0), (0, 0, 1), -p.get("rotation_deg", 0)
                )
                bounds = _bbox(local)
                enclosed = all(
                    bounds[0][i] >= -p["size"][i] / 2 - 1e-5
                    and bounds[1][i] <= p["size"][i] / 2 + 1e-5
                    for i in range(3)
                )
            except Exception:  # noqa: BLE001 - failed geometry is never certified
                enclosed = False
            add(
                f"geometry.motion_envelope.{id}",
                "pass" if enclosed else "unknown",
                "geometry",
                "Declared local box encloses the actual solid used for motion",
                [id],
            )
            envelope_coverage = envelope_coverage and enclosed
        else:
            envelope_coverage = False

    for joint in joints:
        minimum = joint.get("contact", {}).get("minimum_contact_area_mm2")
        if minimum is None:
            continue
        a, b = joint.get("part_a"), joint.get("part_b")
        try:
            if not _finite([minimum]) or minimum < 0:
                raise ValueError("Invalid required contact area")
            if a in invalid_parts or b in invalid_parts or a not in shapes or b not in shapes:
                raise ValueError("Missing valid mating solid")
            if not all(
                _finite(joint.get(k)) and len(joint[k]) == 3
                for k in ("local_a", "local_b", "normal_a", "normal_b")
            ):
                raise ValueError("Missing mating plane definition")
            origin = _world(by_id[a], joint["local_a"])
            axis = _world(dict(by_id[a], position=[0, 0, 0]), joint["normal_a"])
            length = math.sqrt(sum(v * v for v in axis))
            if length == 0:
                raise ValueError("Zero normal")
            axis = [v / length for v in axis]

            def mating_faces(shape, axis=axis, origin=origin):
                selected = []
                for face in shape.Faces():
                    if face.geomType() != "PLANE":
                        continue
                    centre = face.Center().toTuple()
                    normal = face.normalAt().toTuple()
                    if (
                        abs(sum((centre[i] - origin[i]) * axis[i] for i in range(3))) < 1e-5
                        and abs(sum(normal[i] * axis[i] for i in range(3))) > 1 - 1e-6
                    ):
                        selected.append(face)
                return selected

            area = sum(
                fa.intersect(fb).Area()
                for fa in mating_faces(shapes[a])
                for fb in mating_faces(shapes[b])
            )
            add(
                f"joint.contact.{joint['id']}",
                "pass" if area + 1e-5 >= minimum else "fail",
                "assembly",
                "Actual coplanar mating face overlap",
                [a, b],
                measured=area,
                required=minimum,
                unit="mm²",
                method="OpenCascade planar-face common area",
            )
        except Exception as exc:  # noqa: BLE001 - missing kernel evidence is unknown
            add(
                f"joint.contact.{joint.get('id', 'missing')}",
                "unknown",
                "assembly",
                f"Contact area could not be established: {exc}",
                [a, b],
            )

    pairs_checked = 0
    closed_results = {}
    for a, b in itertools.combinations(physical, 2):
        if a["id"] not in shapes or b["id"] not in shapes:
            continue
        pair = frozenset((a["id"], b["id"]))
        result = check_solid_pair(
            shapes[a["id"]],
            shapes[b["id"]],
            permitted_overlap_mm3=contact_policies.get(pair, 0.0),
        )
        if result["status"] == "fail" and any(_conservative(p) for p in (a, b)):
            result["status"] = "unknown"
            result["message"] = (
                "Conservative envelopes intersect; actual supplier geometry required to resolve interference"
            )
        closed_results[pair] = result["status"]
        pairs_checked += 1
        if result["status"] != "pass":
            add(
                f"collision.{a['id']}.{b['id']}",
                category="clearance",
                references=[a["id"], b["id"]],
                **result,
            )
    add(
        "geometry.pair_coverage",
        "pass" if pairs_checked == len(physical) * (len(physical) - 1) // 2 else "unknown",
        "clearance",
        "All physical part pairs checked at closed pose",
        measured=pairs_checked,
        required=len(physical) * (len(physical) - 1) // 2,
        method="AABB separation or OpenCascade intersection; explicit pair-specific mating allowances",
    )

    parameters = model.get("parameters", {})
    for axis, parameter in ((0, "width_mm"), (1, "depth_mm"), (2, "height_mm")):
        for p in parts:
            if p.get("category") == "machine-envelope" and p["id"] not in invalid_parts:
                lo = p["position"][axis] - p["size"][axis] / 2
                hi = p["position"][axis] + p["size"][axis] / 2
                limit = parameters.get(parameter, 0)
                add(
                    f"machine.containment.{p['id']}.{axis}",
                    "pass" if lo >= 0 and hi <= limit else "fail",
                    "machine",
                    "Declared machine envelope lies within clear enclosure",
                    [p["id"]],
                    measured=[lo, hi],
                    required=[0, limit],
                    unit="mm",
                )

    # Independent nominal glazing allowance check from panel/frame dimensions.
    # Assumed 5 mm usable depth is not a vendor-certified installed dimension.
    glazing_parts = {p["id"]: p for p in model["parts"]}
    for pane in model["parts"]:
        if not pane.get("glazing"):
            continue
        prefix = pane["id"].removesuffix("-infill")
        for axis, low, high in ((0, "stile-a", "stile-b"), (2, "rail-low", "rail-high")):
            a = glazing_parts.get(f"{prefix}-{low}")
            b = glazing_parts.get(f"{prefix}-{high}")
            if not a or not b:
                add(
                    f"glazing.allowance.{prefix}.{axis}",
                    "unknown",
                    "tolerance",
                    "Missing glazing frame member",
                    [pane["id"]],
                )
                continue
            opening = b["motion_local"][axis] - a["motion_local"][axis] - 30
            length = pane["size"][axis]
            growth = 0.000070 * length * 40
            allowance = opening + 10 - length
            required = growth + 2 * parameters["cut_tolerance_mm"] + 1
            bite = (length - opening) / 2
            add(
                f"glazing.lip_engagement.{prefix}.{axis}",
                "pass" if bite >= 2.8 else "fail",
                "tolerance",
                "Nominal pane edge reaches assumed installed lip end; impact retention remains unapproved",
                [pane["id"]],
                measured=bite,
                required=2.8,
                unit="mm",
            )
            add(
                f"glazing.allowance.{prefix}.{axis}",
                "pass" if allowance >= required and bite > 0 else "fail",
                "tolerance",
                "Nominal slot capture and expansion allowance under assumed 5 mm depth/40 K excursion; not retention approval",
                [pane["id"], a["id"], b["id"]],
                measured=allowance,
                required=required,
                unit="mm",
            )

    # Confirmation alone does not manufacture evidence: these are physical declarations,
    # with the source assumption copied into the result for traceability.
    assumptions = {a["id"]: a for a in model.get("assumptions", [])}
    for a in (canonical or model).get("assumptions", []):
        actual = assumptions.get(a["id"])
        add(
            f"assumption.{a['id']}",
            "pass" if actual and actual.get("confirmed") else "unknown",
            "assumptions",
            a["description"],
            a.get("references", []),
            method="declared external evidence; not established by geometry",
        )

    margin = parameters.get("clearance_mm", 0) - 2 * parameters.get("cut_tolerance_mm", 0)
    add(
        "tolerance.cut_margin",
        "pass" if margin > 0 else "fail",
        "tolerance",
        "Nominal gap retains positive margin after two opposing cut errors; mounting, squareness and sag still require separate allowance",
        measured=margin,
        required=0,
        unit="mm",
        method="worst-case arithmetic bound",
    )
    add(
        "closure.hardware",
        "unknown",
        "closure",
        "Closed geometry alone does not establish latch engagement, stops, seal compression or sag allowance; selected mounting drawings required",
    )
    for door in model.get("doors", []):
        refs = door.get("part_ids", [])
        missing = [id for id in refs if id not in by_id]
        expected_door = next(
            (d for d in (canonical or {}).get("doors", []) if d["id"] == door["id"]),
            None,
        )
        valid = (
            not missing
            and expected_door is not None
            and all(
                door.get(k) == expected_door.get(k)
                for k in (
                    "part_ids",
                    "type",
                    "pivot",
                    "base_deg",
                    "opening_sign",
                    "max_angle_deg",
                    "link_length_mm",
                    "guide_travel_mm",
                    "mechanism",
                    "primary_link_mm",
                    "secondary_link_mm",
                    "guide_normal_mm",
                )
            )
        )
        add(
            f"integrity.mechanism.{door['id']}",
            "pass" if valid else "fail",
            "integrity",
            "Door membership and mechanism match the evaluated design",
            refs,
        )
        if door.get("type") == "bifold":
            if door.get("mechanism") == "printed-guide-revision-c":
                add(
                    f"kinematics.native.{door['id']}",
                    "unknown",
                    "kinematics",
                    "Offset unequal-link prototype uses analytic closure and independent interval motion bounds; native constraint cross-check and physical hinge mounting remain pending",
                    refs,
                )
                add(
                    f"kinematics.space.{door['id']}",
                    "pass" if door["remaining_outward_space_mm"] >= 0 else "fail",
                    "kinematics",
                    "Sampled bare-frame sweep plus 15 mm provisional fittings allowance; not a full hardware collision proof",
                    refs,
                    measured=door["reserved_sweep_mm"],
                    required=door["available_outward_space_mm"],
                    unit="mm",
                )
                continue
            try:
                from .constraints import solve_bifold_axes

                evidence = solve_bifold_axes(door["link_length_mm"], 45.0)
                residual = max(
                    evidence[k]
                    for k in (
                        "hinge_residual_mm",
                        "guide_residual_mm",
                        "link_length_residual_mm",
                    )
                )
                add(
                    f"kinematics.native.{door['id']}",
                    "pass" if residual < 1e-5 else "fail",
                    "kinematics",
                    "Independent CAD constraint solution of ideal axes at 45°; solid travel verified separately",
                    refs,
                    measured=evidence,
                    required=1e-5,
                    unit="mm",
                )
            except Exception as exc:  # noqa: BLE001 - kernel failures must retain unknown evidence
                add(
                    f"kinematics.native.{door['id']}",
                    "unknown",
                    "kinematics",
                    f"Native constraint evidence unavailable: {exc}",
                    refs,
                )
    try:
        from .core import pose_model

        zero_pose = {p["id"]: p for p in pose_model(model, {})["parts"]}
        for p in parts:
            if p.get("motion_leaf") and p["id"] not in invalid_parts:
                q = zero_pose[p["id"]]
                consistent = (
                    math.dist(p["position"], q["position"]) < 1e-6
                    and abs(p.get("rotation_deg", 0) - q.get("rotation_deg", 0)) < 1e-6
                )
                if not consistent:
                    add(
                        f"integrity.closed_pose.{p['id']}",
                        "fail",
                        "integrity",
                        "Actual closed transform disagrees with the mechanism start configuration",
                        [p["id"]],
                    )
    except Exception as exc:  # noqa: BLE001 - kernel failures must retain unknown evidence
        add(
            "integrity.closed_pose",
            "fail",
            "integrity",
            f"Cannot establish mechanism start configuration: {exc}",
        )

    add(
        "proof.numeric_scope",
        "pass",
        "scope",
        "Geometric results use floating-point OpenCascade; no structural, acoustic, fire, or hose-flexibility certification",
        method="engineering verification",
        length_tolerance_mm=KERNEL_LENGTH_TOLERANCE_MM,
        volume_tolerance_mm3=KERNEL_VOLUME_TOLERANCE_MM3,
    )
    # Required evidence is explicit, never inferred from an absence of failures.
    if (
        invalid_parts
        or not shapes
        or not envelope_coverage
        or any(c["category"] == "integrity" and c["status"] != "pass" for c in checks)
    ):
        add(
            "motion.continuous",
            "unknown",
            "motion",
            "Cannot establish motion with missing or invalid geometry",
        )
    else:
        try:
            checks.append(_motion_check(model, shapes, closed_results))
        except Exception as exc:  # noqa: BLE001 - kernel failures must retain unknown evidence
            add(
                "motion.continuous",
                "unknown",
                "motion",
                f"Continuous motion evidence unavailable: {exc}",
            )
    # Loading is a horizontal straight insertion at a chosen height. The full
    # board depth remains part of the swept prism, not merely its front edge.
    try:
        import cadquery as cq

        from .core import pose_model

        pose = {"front-left": 1.0, "front-right": 1.0}
        opened = build_shapes(model, pose)
        w, d, h = (
            parameters[k]
            for k in (
                "workpiece_width_mm",
                "workpiece_depth_mm",
                "workpiece_thickness_mm",
            )
        )
        W, D, H = (parameters[k] for k in ("width_mm", "depth_mm", "height_mm"))
        zlo = max(30.0, parameters.get("machine_height_mm", 0))
        if w > W or d > D or zlo + h > H:
            add(
                "access.workpiece",
                "fail",
                "access",
                "Board or declared loading height exceeds clear interior",
                measured=[w, d, zlo + h],
                required=[W, D, H],
                unit="mm",
            )
        else:
            # Insert onto the centred machine/work area, not until the leading
            # edge touches the rear wall. Both the swept approach and complete
            # final board remain checked against every physical solid.
            final_center_y = D / 2
            leading_edge_y = final_center_y + d / 2
            prism = (
                cq.Workplane("XY")
                .box(w, d + leading_edge_y, h)
                .translate((W / 2, (leading_edge_y - d) / 2, zlo + h / 2))
                .val()
            )
            conflicts = []
            actual_collisions = []
            for p in physical:
                if p["id"] in opened:
                    result = check_solid_pair(prism, opened[p["id"]])
                    if result["status"] != "pass":
                        conflicts.append(p["id"])
                        if result["status"] == "fail" and not _conservative(p):
                            actual_collisions.append(p["id"])
            access_status = (
                "fail"
                if actual_collisions
                else "unknown"
                if conflicts or len(opened) < len(parts)
                else "pass"
            )
            add(
                "access.workpiece",
                access_status,
                "access",
                "Straight horizontal board insertion to the centred work area with both front doors fully open; workshop approach space must be available",
                conflicts,
                measured={
                    "board_mm": [w, d, h],
                    "bottom_height_mm": zlo,
                    "final_center_y_mm": final_center_y,
                    "leading_edge_y_mm": leading_edge_y,
                },
                method="continuous swept rectangular prism against all physical solids",
            )
    except Exception as exc:  # noqa: BLE001 - kernel failures must retain unknown evidence
        add(
            "access.workpiece",
            "unknown",
            "access",
            f"Loading evidence unavailable: {exc}",
        )
    expected_containment = (canonical or {}).get("containment", [])
    actual_containment = {entry["id"]: entry for entry in model.get("containment", [])}
    for entry in expected_containment:
        id = entry["id"]
        actual = actual_containment.get(id)
        if actual != entry:
            add(
                f"containment.obligation.{id}",
                "fail",
                "containment",
                "Barrier obligation is missing or differs from the canonical seam definition",
                entry.get("part_ids", []),
            )
        for index, region in enumerate(entry.get("coverage_regions", [])):
            try:
                outcome = check_barrier_region(
                    shapes,
                    region,
                    region.get("required_overlap_mm", entry.get("required_overlap_mm", 0.0)),
                    parameters.get("cut_tolerance_mm", 0.0),
                )
                add(f"containment.coverage.{id}.{index}", category="containment", **outcome)
            except Exception as exc:  # noqa: BLE001 - failed geometric evidence cannot certify coverage
                add(
                    f"containment.coverage.{id}.{index}",
                    "unknown",
                    "containment",
                    f"Barrier coverage could not be established: {exc}",
                    region.get("part_ids", []),
                )
        for index, pair in enumerate(entry.get("nominal_contact_chain", [])):
            try:
                add(
                    f"containment.connection.{id}.{index}",
                    category="containment",
                    **check_barrier_connection(shapes, pair),
                )
            except Exception as exc:  # noqa: BLE001 - missing kernel evidence is never a pass
                add(
                    f"containment.connection.{id}.{index}",
                    "unknown",
                    "containment",
                    f"Barrier connection could not be established: {exc}",
                    pair,
                )
        if entry.get("kind") == "annular-collar":
            try:
                import cadquery as cq

                radius = (
                    entry["required_outer_diameter_mm"] / 2 + 2 * parameters["cut_tolerance_mm"]
                )
                inner = entry["inner_diameter_mm"] / 2
                x, y = entry["center_mm"]
                z = entry["plane_mm"]
                plate = cq.Solid.makeCylinder(radius, 0.02, cq.Vector(x, y, z - 0.01)).cut(
                    cq.Solid.makeCylinder(inner, 0.04, cq.Vector(x, y, z - 0.02))
                )
                remaining = plate
                for pid in entry["part_ids"]:
                    remaining = remaining.cut(shapes[pid])
                    if remaining.Volume() / 0.02 <= 1e-4:
                        break
                missing = remaining.Volume() / 0.02
                add(
                    f"containment.collar.{id}",
                    "pass" if missing <= 1e-4 else "fail",
                    "containment",
                    "Actual annular collar covers the roof-hole perimeter with required radial overlap",
                    entry["part_ids"],
                    measured=missing,
                    required=0,
                    unit="mm² uncovered",
                    method="OpenCascade annular target subtraction",
                )
                roof = by_id["panel-roof"]
                bore = cq.Solid.makeCylinder(
                    entry["opening_diameter_mm"] / 2 - 1e-5,
                    roof["size"][2] + 0.02,
                    cq.Vector(x, y, roof["position"][2] - roof["size"][2] / 2 - 0.01),
                )
                overlap = bore.intersect(shapes["panel-roof"]).Volume()
                add(
                    f"airflow.roof_bore.{id}",
                    "pass" if overlap < 1e-5 else "fail",
                    "airflow",
                    "Declared roof hose opening is present in actual panel geometry",
                    ["panel-roof"],
                    measured=overlap,
                    required=0,
                    unit="mm³ obstruction",
                )
            except Exception as exc:  # noqa: BLE001 - kernel and missing parts cannot establish collar coverage
                add(
                    f"containment.collar.{id}",
                    "unknown",
                    "containment",
                    f"Collar coverage unavailable: {exc}",
                    entry.get("part_ids", []),
                )
        elif entry.get("kind") in ("intentional-bottom-gap", "intentional-latch-gap"):
            add(
                f"containment.intentional-gap.{id}",
                "unknown",
                "containment",
                "Intentional unsealed opening accepted for a simple enclosure; chip escape in use is unvalidated, not a missing-seal failure",
                measured={
                    "nominal_height_mm": entry["nominal_height_mm"],
                    "opening_width_mm": entry["opening_width_mm"],
                },
                method="Declared design intent; no hermetic-seal requirement",
            )
        elif not entry.get("coverage_regions"):
            add(
                f"containment.coverage.{id}",
                "unknown",
                "containment",
                "No measurable barrier region has been declared",
                entry.get("part_ids", []),
            )
        if entry.get("kind") == "baffled-air-inlet":
            try:
                import cadquery as cq

                wall = by_id[entry["wall_part_id"]]
                axis = entry["normal_axis"]
                axes = [i for i in range(3) if i != axis]
                center = list(entry["opening_center_mm"])
                center[axis] = wall["position"][axis]
                size = [0.0, 0.0, 0.0]
                size[axis] = wall["size"][axis] + 0.02
                for i, k in enumerate(axes):
                    size[k] = entry["opening_size_mm"][i] - 0.00002
                passage = cq.Workplane("XY").box(*size).translate(tuple(center)).val()
                obstruction = passage.intersect(shapes[wall["id"]]).Volume()
                add(
                    f"airflow.inlet_opening.{id}",
                    "pass" if obstruction < 1e-5 else "fail",
                    "airflow",
                    "Actual wall cutout admits the declared makeup-air aperture",
                    [wall["id"]],
                    measured=obstruction,
                    required=0,
                    unit="mm³ obstruction",
                )
                face = shapes["air-inlet-baffle-face"].BoundingBox()
                left = shapes["air-inlet-baffle-left"].BoundingBox()
                right = shapes["air-inlet-baffle-right"].BoundingBox()
                wallbox = shapes[wall["id"]].BoundingBox()
                width = right.ymin - left.ymax
                turn = shapes["air-inlet-baffle-internal-turn"].BoundingBox()
                top = shapes["air-inlet-baffle-top"].BoundingBox()
                depth = face.xmin - turn.xmax
                area = max(0.0, width) * max(0.0, depth)
                desired = entry["throat_area_mm2"]
                throat = (
                    cq.Workplane("XY")
                    .box(max(depth, 0.001), max(width, 0.001), 0.02)
                    .translate(
                        (
                            (face.xmin + turn.xmax) / 2,
                            (right.ymin + left.ymax) / 2,
                            face.zmin - 0.01,
                        )
                    )
                    .val()
                )
                obstruction = sum(
                    throat.intersect(shapes[pid]).Volume() for pid in entry["part_ids"]
                )
                add(
                    f"airflow.throat.{id}",
                    "pass" if area + 1e-4 >= desired and obstruction < 1e-5 else "fail",
                    "airflow",
                    "Actual bottom baffle throat preserves the declared free area",
                    entry["part_ids"],
                    measured=area,
                    required=desired,
                    unit="mm²",
                    obstruction_mm3=obstruction,
                )
                areas = {
                    "wall_opening": math.prod(entry["opening_size_mm"]),
                    "bottom_exit": area,
                    "inner_channel": max(0.0, turn.xmin - wallbox.xmax) * max(0.0, width),
                    "top_turn": max(0.0, top.zmin - turn.zmax) * max(0.0, width),
                }
                minimum = min(areas.values())
                required = (
                    entry.get("minimum_area_ratio_to_hose", 2.0)
                    * math.pi
                    * (parameters["hose_diameter_mm"] / 2) ** 2
                )
                add(
                    f"airflow.minimum_path.{id}",
                    "pass" if minimum + 1e-4 >= required else "fail",
                    "airflow",
                    "Every declared passage retains the geometric free-area allowance relative to the hose; this is not a flow-rate prediction",
                    entry["part_ids"],
                    measured=minimum,
                    required=required,
                    unit="mm²",
                    passage_areas_mm2=areas,
                )
                blocked = []
                confirmed_blockage = False
                for name, xlo, xhi, zlo, zhi in (
                    (
                        "inner",
                        wallbox.xmax,
                        turn.xmin,
                        center[2] - entry["opening_size_mm"][1] / 2,
                        top.zmin,
                    ),
                    ("turn", turn.xmin, turn.xmax, turn.zmax, top.zmin),
                    ("outer", turn.xmax, face.xmin, face.zmin, top.zmin),
                ):
                    if xhi <= xlo or zhi <= zlo:
                        blocked.append(name)
                        confirmed_blockage = True
                        continue
                    channel = (
                        cq.Workplane("XY")
                        .box(xhi - xlo, width, zhi - zlo)
                        .translate(((xhi + xlo) / 2, (right.ymin + left.ymax) / 2, (zhi + zlo) / 2))
                        .val()
                    )
                    for part in physical:
                        outcome = (
                            check_solid_pair(channel, shapes[part["id"]])
                            if part["id"] in shapes
                            else {"status": "unknown"}
                        )
                        if outcome["status"] != "pass":
                            blocked.append(f"{name}:{part['id']}")
                            confirmed_blockage = confirmed_blockage or (
                                outcome["status"] == "fail" and not _conservative(part)
                            )
                add(
                    f"airflow.channels.{id}",
                    "fail" if confirmed_blockage else "unknown" if blocked else "pass",
                    "airflow",
                    "Entire declared inner, upper-turn and outer air-channel volumes remain unobstructed by modeled physical parts",
                    blocked,
                    method="actual free-channel prism intersection against all physical solids",
                )
                # Every line from the wall aperture to the bottom exit crosses
                # the internal-turn plane. Rational interpolation is monotone
                # in each endpoint coordinate, so endpoint extrema enclose all
                # such intersections, not just a sampled collection of rays.
                plane = turn.xmin
                wx, yc, zc = entry["opening_center_mm"]
                ow, oh = entry["opening_size_mm"]
                intersections = []
                for oy, oz, ex, ey in itertools.product(
                    (yc - ow / 2, yc + ow / 2),
                    (zc - oh / 2, zc + oh / 2),
                    (turn.xmax, face.xmin),
                    (left.ymax, right.ymin),
                ):
                    fraction = (plane - wx) / (ex - wx)
                    if not 0 <= fraction <= 1:
                        raise ValueError("Baffle plane does not separate aperture and exit")
                    intersections.append(
                        (oy + fraction * (ey - oy), oz + fraction * (face.zmin - oz))
                    )
                ymin, ymax = min(q[0] for q in intersections), max(q[0] for q in intersections)
                zmin, zmax = min(q[1] for q in intersections), max(q[1] for q in intersections)
                wire = cq.Wire.makePolygon(
                    [
                        cq.Vector(plane, ymin, zmin),
                        cq.Vector(plane, ymax, zmin),
                        cq.Vector(plane, ymax, zmax),
                        cq.Vector(plane, ymin, zmax),
                    ],
                    close=True,
                )
                target = cq.Face.makeFromWires(wire)
                for pid in ("air-inlet-baffle-internal-turn", "air-inlet-baffle-bottom-return"):
                    target = target.cut(shapes[pid])
                    if target.Area() < 1e-4:
                        break
                missing = target.Area()
                add(
                    f"airflow.direct_path.{id}",
                    "pass" if missing < 1e-4 else "fail",
                    "airflow",
                    "Actual baffle and return block the full analytically bounded family of straight opening-to-exit segments",
                    entry["part_ids"],
                    measured=missing,
                    required=0,
                    unit="mm² uncovered at interception plane",
                    method="analytic endpoint extrema followed by actual planar-face difference",
                )
                add(
                    f"airflow.performance.{id}",
                    "unknown",
                    "airflow",
                    "Free area and baffled geometry do not establish flow rate, negative pressure or dust capture; extractor, filters, hose losses and commissioning measurements required",
                    entry["part_ids"],
                )
            except Exception as exc:  # noqa: BLE001 - geometry failures retain missing airflow evidence
                add(
                    f"airflow.geometry.{id}",
                    "unknown",
                    "airflow",
                    f"Air inlet geometry unavailable: {exc}",
                    entry.get("part_ids", []),
                )
    if expected_containment:
        try:
            for gap_id, region in actual_infill_gap_regions(model):
                outcome = check_barrier_region(shapes, region)
                add(f"containment.actual_infill.{gap_id}", category="containment", **outcome)
        except Exception as exc:  # noqa: BLE001 - unresolved gap geometry cannot certify enclosure closure
            add(
                "containment.actual_infill",
                "unknown",
                "containment",
                f"Actual infill gap coverage unavailable: {exc}",
            )
        add(
            "containment.boundary_completeness",
            "unknown",
            "containment",
            "Named seam coverage and panel-edge coverage do not establish a complete sealed enclosure boundary; hinge-offset corridors, header, base, roof and intentional penetrations require complete interface evidence",
            method="explicit limit of local barrier certificates",
        )
        add(
            "containment.physical_performance",
            "unknown",
            "containment",
            "Nominal barrier footprint does not establish real rubber compression, flexible seam travel, particulate leakage or extraction performance; supplier and assembled tests required",
            method="explicit physical evidence boundary",
        )

    category_bindings = {
        "inventory": ["integrity"],
        "joints": ["assembly"],
        "solid-clearance": ["geometry", "clearance"],
        "door-motion": ["motion", "kinematics", "closure", "tolerance"],
        "workpiece-access": ["access"],
        "machine-fit": ["machine"],
        "supplier-readiness": ["assumptions"],
        "containment": ["containment"],
        "dust-containment": ["containment"],
        "containment-continuity": ["containment", "airflow"],
        "airflow": ["airflow"],
    }
    for requirement in model.get("requirements", []):
        evidence = [
            c
            for c in checks
            if c["category"] in category_bindings.get(requirement["id"], [])
            and not c["id"].startswith("requirement.")
        ]
        statuses = {c["status"] for c in evidence}
        outcome = (
            "fail"
            if "fail" in statuses
            else "unknown"
            if "unknown" in statuses or not statuses
            else "pass"
        )
        if requirement["id"] == "machine-fit" and not assumptions.get("machine-envelope", {}).get(
            "confirmed"
        ):
            outcome = "fail" if outcome == "fail" else "unknown"
        add(
            f"requirement.{requirement['id']}",
            outcome,
            requirement.get("category", "requirement"),
            requirement["description"],
            requirement.get("references", []),
            evidence_ids=[c["id"] for c in evidence],
        )
    counts = Counter(c["status"] for c in checks)
    summary = {key: counts[key] for key in ("pass", "fail", "unknown")}
    status = "invalid" if counts["fail"] else "incomplete" if counts["unknown"] else "valid"
    return {
        "status": status,
        "revision": model.get("revision"),
        "verifier_revision": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "checks": checks,
        "summary": summary,
        "coverage": {
            "physical_parts": len(physical),
            "solid_parts": len(shapes),
            "closed_pairs_checked": pairs_checked,
            "closed_pairs_required": len(physical) * (len(physical) - 1) // 2,
            "continuous_motion": next(
                (c["status"] for c in checks if c["id"] == "motion.continuous"),
                "unknown",
            ),
        },
        "order_ready": status == "valid" and not model.get("ordering", {}).get("unresolved"),
    }

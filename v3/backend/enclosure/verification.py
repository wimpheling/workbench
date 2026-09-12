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
        "message": "All independent door combinations bounded analytically; unresolved bound intersections are not clearance proofs",
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
            prism = (
                cq.Workplane("XY")
                .box(w, d + D, h)
                .translate((W / 2, (D - d) / 2, zlo + h / 2))
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
                "Straight horizontal board insertion with both front doors fully open; workshop approach space must be available",
                conflicts,
                measured={"board_mm": [w, d, h], "bottom_height_mm": zlo},
                method="continuous swept rectangular prism against all physical solids",
            )
    except Exception as exc:  # noqa: BLE001 - kernel failures must retain unknown evidence
        add(
            "access.workpiece",
            "unknown",
            "access",
            f"Loading evidence unavailable: {exc}",
        )
    category_bindings = {
        "inventory": ["integrity"],
        "joints": ["assembly"],
        "solid-clearance": ["geometry", "clearance"],
        "door-motion": ["motion", "kinematics", "closure", "tolerance"],
        "workpiece-access": ["access"],
        "machine-fit": ["machine"],
        "supplier-readiness": ["assumptions"],
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

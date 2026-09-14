"""Standalone candidate screen; does not change the active model or its report.
Run from v3: uv run python ../engineering/bifold-assembly/standard-metalwork/screen.py
"""

import copy
import json
import math
import sys
from pathlib import Path

import cadquery as cq
from enclosure.core import build_model, build_shapes, pose_model
from enclosure.verification import check_solid_pair

HERE = Path(__file__).resolve().parent


def shift(p, dx=0, dy=0, dz=0):
    a = math.radians(p["rotation_deg"])
    p["position"][0] += dx * math.cos(a) - dy * math.sin(a)
    p["position"][1] += dx * math.sin(a) + dy * math.cos(a)
    p["position"][2] += dz
    if "motion_local" in p:
        p["motion_local"] = [
            p["motion_local"][0] + dx,
            p["motion_local"][1] + dy,
            p["motion_local"][2] + dz,
        ]


m = build_model()
if m["revision"] != "629b576e77187fd6":
    raise SystemExit("Historical screen requires revision 629b576e77187fd6; use active test_stock_metalwork.py for the integrated design.")
base = copy.deepcopy(m)
modified = []
for p in m["parts"]:
    pid = p["id"]
    if pid.endswith("-carrier-upright"):
        p["size"] = [18, 6, 80]
        shift(p, dy=-1, dz=3.5)
        p["holes"] = [
            {"axis": "y", "center": [0, z], "diameter_mm": 6.5} for z in (1.1, -28.9)
        ]
        modified.append(pid)
    elif pid.endswith("-carrier-shelf"):
        p["size"] = [18, 40, 6]
        shift(p, dy=6)
        p["holes"] = [{"center": [0, 3], "diameter_mm": 4.5}]
        modified.append(pid)
    elif "-keeper-strip-continuous-" in pid:
        side = -1 if pid.endswith("--1") else 1
        p["size"][1] = 20
        p["size"][0] -= 8
        shift(p, dy=side)
        for h in p["holes"]:
            h["center"][1] = 0
        modified.append(pid)
    elif "-closed-stop-" in pid:
        p["size"] = [58, 3, 58]
        shift(p, dy=-0.5)
        modified.append(pid)
    elif "-rail-end-stop-" in pid:
        modified.append(pid)
plate = cq.importers.importStep(str(HERE / "Motedis_LP30105SB.stp")).val()
plate = plate.translate((0, 0, -1.5)).rotate((0, 0, 0), (1, 0, 0), 90)
results = []
capture_only = "--capture-only" in sys.argv
for f in [1] if capture_only else [0, 0.001, 0.01, 0.05, 0.25, 0.5, 0.75, 1]:
    posed = pose_model(m, {"left-rear": f, "back-right": f})
    by = {p["id"]: p for p in posed["parts"]}
    shapes = build_shapes(posed)
    for pid in modified:
        if "-closed-stop-" in pid:
            p = by[pid]
            shapes[pid] = plate.rotate(
                (0, 0, 0), (0, 0, 1), p["rotation_deg"]
            ).translate(tuple(p["position"]))
    end_fixings = {}
    for pid in modified:
        if "-rail-end-stop-" not in pid:
            continue
        p = by[pid]
        # End-local x=0 is original outside end; inward positive. Stock
        # 30x20x4 angle spans the two bars. Saw a central 10 mm axle notch
        # in its horizontal leg. Bar ends shorten 4 mm to meet the upright.
        vertical = cq.Workplane("XY").box(4, 50, 30).translate((2, 0, -5.5)).val()
        foot = cq.Workplane("XY").box(20, 50, 4).translate((10, 0, -18.5)).val()
        end = vertical.fuse(foot)
        notch = cq.Workplane("XY").box(16, 10, 5).translate((12, 0, -18.5)).val()
        end = end.cut(notch)
        for y in (-15, 15):
            end = end.cut(
                cq.Solid.makeCylinder(
                    2.25, 6, cq.Vector(12, y, -21.5), cq.Vector(0, 0, 1)
                )
            )
        # The original bar centre is 2 mm inward of its outside end.
        end = end.translate((-2, 0, 0))
        if pid.endswith("-closed"):
            end = end.rotate((0, 0, 0), (0, 0, 1), 180)
        shapes[pid] = end.rotate((0, 0, 0), (0, 0, 1), p["rotation_deg"]).translate(
            tuple(p["position"])
        )
        assert shapes[pid].isValid()
        for y in (-15, 15):
            shaft = cq.Solid.makeCylinder(
                2, 40, cq.Vector(10, y, -20.5), cq.Vector(0, 0, 1)
            )
            head = cq.Solid.makeCylinder(
                4, 3, cq.Vector(10, y, -23.5), cq.Vector(0, 0, 1)
            )
            screw = shaft.fuse(head)
            if pid.endswith("-closed"):
                screw = screw.rotate((0, 0, 0), (0, 0, 1), 180)
            end_fixings[pid + "-M4-candidate-" + str(y)] = screw.rotate(
                (0, 0, 0), (0, 0, 1), p["rotation_deg"]
            ).translate(tuple(p["position"]))
    # The two blocks represent one continuous angle; union to avoid counting
    # their shared corner material as interference between different parts.
    probes = {
        pid: shapes[pid]
        for pid in modified
        if not pid.endswith(("-carrier-upright", "-carrier-shelf"))
    }
    for did in ["left-rear", "back-right"]:
        probes[did + "-stock-angle"] = shapes[did + "-carrier-upright"].fuse(
            shapes[did + "-carrier-shelf"]
        )
    probes.update(end_fixings)
    rigid = []
    flex = []
    for pid, s in probes.items():
        for q in posed["parts"]:
            qid = q["id"]
            if qid == pid or q["category"].endswith("envelope"):
                continue
            if pid.endswith("-stock-angle") and qid in [
                pid.replace("-stock-angle", "-carrier-upright"),
                pid.replace("-stock-angle", "-carrier-shelf"),
            ]:
                continue
            result = check_solid_pair(s, shapes[qid])
            if result["status"] == "fail":
                (flex if q.get("deformable") else rigid).append([pid, qid, result])
    row = {"fraction": f, "rigid_interferences": rigid, "flexible_interferences": flex}
    results.append(row)
    print(json.dumps(row), flush=True)
capture = []
for did in ["left-rear", "back-right"]:
    washer = shapes[did + "-keeper-washer"].translate((0, 0, -4))
    for side in (-1, 1):
        volume = washer.intersect(
            shapes[did + "-keeper-strip-continuous-" + str(side)]
        ).Volume()
        assert volume > 1e-4, (did, side, "lost straight-drop capture")
        capture.append(
            {
                "door": did,
                "witness": "parked washer displaced down 4 mm",
                "side": side,
                "overlap_mm3": volume,
            }
        )
    roller = shapes[did + "-carriage"]
    centre = roller.Center()
    for end in ["park", "closed"]:
        pid = did + "-rail-end-stop-" + end
        target = by[pid]["position"]
        displaced = roller.translate((target[0] - centre.x, target[1] - centre.y, 0))
        volume = displaced.intersect(shapes[pid]).Volume()
        assert volume > 1e-4, (did, end, "lost overtravel barrier")
        capture.append(
            {
                "door": did,
                "witness": "roller centre displaced to end barrier centre",
                "end": end,
                "overlap_mm3": volume,
            }
        )
print(json.dumps({"capture_witnesses": capture}), flush=True)
output = "capture-results.json" if capture_only else "screen-results.json"
(HERE / output).write_text(
    json.dumps(
        {
            "base_revision": base["revision"],
            "status": "candidate screen only; no fixing/tool/tolerance/load approval",
            "results": results,
            "capture_witnesses": capture,
        },
        indent=2,
    )
    + "\n"
)

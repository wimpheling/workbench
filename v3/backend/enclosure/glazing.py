"""Slot-captured 4 mm Lexan study; FSP08 compound and section remain unapproved."""

import math

SOURCE = "https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/fsp.pdf"


def panel_axis(opening, tolerance):
    # H=7, flange/base t=1: assumed usable depth below extrusion face = 5.
    # Conservative absolute PC growth (no credit for aluminium expansion).
    # 40 K excursion, two cut tolerances, 1 mm total positioning allowance.
    growth = 0.000070 * (opening + 10) * 40
    reserve = max(2.0, math.ceil((growth + 2 * tolerance + 1) / 2 * 10) / 10)
    bite = 5 - reserve
    return dict(
        opening_mm=opening,
        cut_mm=opening + 2 * bite,
        engagement_mm=bite,
        edge_reserve_mm=reserve,
        thermal_growth_bound_mm=growth,
        minimum_engagement_bound_mm=bite - growth / 2 - tolerance - 0.5,
    )


def add_glazing(model):
    from .core import _add, _rotate

    doors = {d["id"]: d for d in model["doors"]}
    parts = model["parts"]
    panes = [
        p
        for p in parts
        if p["id"].endswith("-infill")
        and p["assembly"] in ("left-rear", "back-right")
        and p["material"] == "polycarbonate"
    ]
    for pane in panes:
        c = model["parameters"]["clearance_mm"]
        ow, oh = pane["size"][0] + 2 * c, pane["size"][2] + 2 * c
        axes = [panel_axis(o, model["parameters"]["cut_tolerance_mm"]) for o in (ow, oh)]
        pane["size"] = [axes[0]["cut_mm"], 4, axes[1]["cut_mm"]]
        pane["cut_size_mm"] = [axes[0]["cut_mm"], axes[1]["cut_mm"], 4]
        pane["glazing"] = dict(
            product_candidate="FSP08",
            axes=axes,
            temperature_excursion_K=40,
            expansion_coefficient_per_K=0.000070,
            usable_slot_depth_mm=5,
            approved=False,
        )
        pane["retention"] = (
            "4 mm Lexan captured in inward 3030 slots; FSP08 drawing-based study only. "
            "PVC compound compatibility, edge engagement, corner seals and frame connectors "
            "must be approved before cutting. Assemble frame around panel; no panel drilling."
        )
        pane["machining"] = pane["retention"]
        d = doors[pane["assembly"]]
        center = pane["motion_local"]
        for side, direction, opening, length in (
            ("left", -1, ow, oh),
            ("right", 1, ow, oh),
            ("bottom", -1, oh, ow),
            ("top", 1, oh, ow),
        ):
            vertical = side in ("left", "right")
            axis = 0 if vertical else 2
            offset = [0, 0, 0]
            offset[axis] = direction * (opening / 2 + 2.5)
            local = _add(center, offset)
            pid = f"{pane['id']}-{side}-slot-gasket"
            # 45-degree mitres: long points reach 6 mm beyond each daylight end.
            # Nominal abutment is not approval of the physical corner seal.
            length += 12
            parts.append(
                dict(
                    id=pid,
                    name=f"FSP08 candidate · {side} glazing insert",
                    category="hardware",
                    material="black PVC (Lexan compatibility unconfirmed)",
                    supplier="Reiman Portugal",
                    product_code="FSP08",
                    quantity=1,
                    physical=True,
                    deformable=True,
                    size=[7, 10.6, length] if vertical else [length, 10.6, 7],
                    position=_add(pane["position"], _rotate(offset, d["base_deg"])),
                    rotation_deg=d["base_deg"],
                    assembly=pane["assembly"],
                    motion_leaf=pane["motion_leaf"],
                    motion_local=local,
                    geometry_fidelity="drawing-based-unconfirmed-flexible-section",
                    geometry=dict(kind="fsp08-study", side=side),
                    source=SOURCE,
                    cut_length_mm=length,
                    stock_length_mm=2000,
                    machining="Provisional long-point length, 45-degree mitres both ends; corner sealing, actual section and PVC compatibility unresolved",
                )
            )
            d["part_ids"].append(pid)
    if panes:
        model["assumptions"].append(
            dict(
                id="bifold-slot-glazing",
                confirmed=False,
                references=[p["id"] for p in panes],
                description="FSP08 is PVC: Lexan compatibility NOT established. Vendor STEP unavailable; "
                "drawing-based installed section only. Confirm compound, minimum edge bite, actual slot fit, "
                "40 K temperature range, expansion/sliding, corner seals and unobstructed frame connectors before cutting.",
            )
        )
        model["ordering"]["unresolved"].append(
            "Do not order/cut bifold Lexan from provisional FSP08 sizes: PVC compatibility, "
            "supplier section, engagement and corner/connector details require approval"
        )


def gasket_shape(size, side):
    """Catalogue envelope with ASSUMED installed wall/lip geometry, not vendor CAD."""
    import cadquery as cq

    length = size[2] if side in ("left", "right") else size[0]
    # x is depth into extrusion, mouth at x=0; y is panel thickness direction.
    outline = [
        (-1, -5.3),
        (0, -5.3),
        (0, -3.95),
        (6, -3.3),
        (6, 3.3),
        (0, 3.95),
        (0, 5.3),
        (-1, 5.3),
        (-1, 2.95),
        (5, 2.3),
        (5, -2.3),
        (-1, -2.95),
    ]
    shape = cq.Workplane("XY").polyline(outline).close().extrude(length).val()
    for sign in (-1, 1):
        lip = [(1, sign * 2.85), (2.4, sign * 2), (2.8, sign * 2), (2, sign * 2.75)]
        shape = shape.fuse(cq.Workplane("XY").polyline(lip).close().extrude(length).val())
    shape = shape.translate((-2.5, 0, -length / 2))
    # Adjacent sections meet on x=z corner bisectors instead of overlapping
    # their flanges. At the mouth their length equals the frame daylight.
    half_opening = (length - 12) / 2
    mitre = (
        cq.Workplane("XZ")
        .polyline(
            [
                (-3.5, -half_opening + 1),
                (3.5, -half_opening - 6),
                (3.5, half_opening + 6),
                (-3.5, half_opening - 1),
            ]
        )
        .close()
        .extrude(20, both=True)
        .val()
    )
    shape = shape.intersect(mitre)
    if side == "left":
        shape = shape.rotate((0, 0, 0), (0, 0, 1), 180)
    elif side in ("top", "bottom"):
        shape = shape.rotate((0, 0, 0), (0, 1, 0), -90 if side == "top" else 90)
    return shape

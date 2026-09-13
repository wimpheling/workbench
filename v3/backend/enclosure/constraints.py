"""Independent native CAD constraint solve of the guided two-leaf mechanism.

The moving second leaf is constrained by a coincident hinge point, vertical
axis, and endpoint in the guide plane. Its rotation is not prescribed.
The starting branch is the exterior fold branch. Results must be measured,
not inferred from the optimizer's success flag. This establishes axis geometry,
not vendor hardware compatibility or solid clearance.
"""

import math
from functools import lru_cache


@lru_cache(maxsize=128)
def solve_bifold_axes(length_mm: float, angle_deg: float):
    import cadquery as cq

    if not 0 < angle_deg < 90:
        raise ValueError(
            "Native solve requires nonsingular angle strictly between 0 and 90 degrees"
        )
    L = float(length_mm)
    a = math.radians(angle_deg)
    link = cq.Workplane("XY").box(L, 1, 1).translate((L / 2, 0, 0)).val()
    guide = cq.Workplane("XY").box(2 * L, 1, 1).translate((L, -0.5, 0)).val()
    assy = cq.Assembly(name="guided-bifold")
    assy.add(guide, name="guide")
    assy.add(
        link,
        name="first",
        loc=cq.Location(cq.Vector(0, 0, 0), cq.Vector(0, 0, 1), angle_deg),
    )
    assy.add(
        link,
        name="second",
        loc=cq.Location(
            cq.Vector(L * math.cos(a), L * math.sin(a), 0),
            cq.Vector(0, 0, 1),
            -angle_deg + 2,
        ),
    )
    assy.constrain("guide", "Fixed")
    assy.constrain("first", "Fixed")
    assy.constrain(
        "first",
        cq.Vertex.makeVertex(L, 0, 0),
        "second",
        cq.Vertex.makeVertex(0, 0, 0),
        "Point",
    )
    assy.constrain("second@faces@>Z", "FixedAxis", (0, 0, 1))
    assy.constrain(
        "second",
        cq.Vertex.makeVertex(L, 0, 0),
        "guide",
        cq.Face.makePlane(2 * L, 2, (0, 0, 0), (0, 1, 0)),
        "PointInPlane",
    )
    assy.solve()
    location = assy.objects["second"].loc
    start = cq.Vertex.makeVertex(0, 0, 0).located(location).Center()
    end = cq.Vertex.makeVertex(L, 0, 0).located(location).Center()
    return dict(
        second_start=list(start.toTuple()),
        second_end=list(end.toTuple()),
        hinge_residual_mm=math.dist(start.toTuple(), [L * math.cos(a), L * math.sin(a), 0]),
        guide_residual_mm=abs(end.y),
        link_length_residual_mm=abs((end - start).Length - L),
        method="CadQuery assembly Point + FixedAxis + PointInPlane constraints",
    )

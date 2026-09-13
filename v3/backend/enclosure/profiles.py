"""Supplier STEP cross section, swept to ordered length without scaling its section."""

import hashlib
from functools import lru_cache
from pathlib import Path

ASSET = Path(__file__).parent / "assets" / "AST03003004.step"
ASSET_SHA256 = hashlib.sha256(
    ASSET.read_bytes() + (ASSET.parent / "CBR3030.step").read_bytes()
).hexdigest()


@lru_cache(maxsize=1)
def section():
    import cadquery as cq

    source = cq.importers.importStep(str(ASSET)).val()
    bb = source.BoundingBox()
    ends = [
        f
        for f in source.Faces()
        if f.BoundingBox().ylen < 1e-5 and abs(f.Center().y - bb.ymin) < 1e-5
    ]
    if len(ends) != 1:
        raise ValueError("Supplier STEP must have one unambiguous planar end face")
    return ends[0].translate((-(bb.xmin + bb.xmax) / 2, -bb.ymin, -(bb.zmin + bb.zmax) / 2))


@lru_cache(maxsize=512)
def extrusion(length, axis):
    import cadquery as cq

    face = section()
    result = cq.Solid.extrudeLinear(
        face.outerWire(), face.innerWires(), cq.Vector(0, length, 0)
    ).translate((0, -length / 2, 0))
    if axis == 0:
        result = result.rotate((0, 0, 0), (0, 0, 1), -90)
    elif axis == 2:
        result = result.rotate((0, 0, 0), (1, 0, 0), 90)
    return result


@lru_cache(maxsize=1)
def bracket():
    import cadquery as cq

    shape = cq.importers.importStep(str(ASSET.parent / "CBR3030.step")).val()
    bb = shape.BoundingBox()
    shape = shape.translate(
        (-(bb.xmin + bb.xmax) / 2, -(bb.ymin + bb.ymax) / 2, -(bb.zmin + bb.zmax) / 2)
    )
    return shape.rotate((0, 0, 0), (0, 0, 1), 90)

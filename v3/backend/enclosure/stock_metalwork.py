"""Cut/drilled stock steel studies. Catalogue sections, never vendor STEP."""

from functools import lru_cache

ANGLE_SOURCE = "https://www.masterferro.pt/uploads/catalogo/ficheiros/1626027514_2769_TT2.5_cant.ab.desiguais.pdf"
SECTION_SOURCE = "https://www.steelconstruction.info/images/b/b7/SCI_P363.pdf#page=114"
SCREW_SOURCE = "https://www.tme.eu/en/details/k4x40-iso10642-a2/bolts/kraftberg/"


def box(size, position):
    import cadquery as cq

    return cq.Workplane("XY").box(*size).val().translate(position)


@lru_cache(maxsize=8)
def carrier(root_radius=7):
    """80x40x6 angle, 18 mm saw cut. Centre at envelope centre; holes in model."""
    import cadquery as cq

    s = box((18, 6, 80), (0, -17, 0)).fuse(box((18, 40, 6), (0, 0, 37)))
    r = root_radius
    root = box((18, r, r), (0, -14 + r / 2, 34 - r / 2))
    root = root.cut(
        cq.Solid.makeCylinder(r, 20, cq.Vector(-10, -14 + r, 34 - r), cq.Vector(1, 0, 0))
    )
    # Square toes conservatively retain material rather than claim vendor radii.
    return s.fuse(root).clean()


@lru_cache(maxsize=8)
def end_angle(root_radius=4):
    """30x20x4 angle, 50 mm saw cut, notched foot and bottom countersinks."""
    import cadquery as cq

    s = box((4, 50, 30), (2, 0, 15)).fuse(box((20, 50, 4), (10, 0, 2)))
    r = root_radius
    root = box((r, 50, r), (4 + r / 2, 0, 4 + r / 2)).cut(
        cq.Solid.makeCylinder(r, 52, cq.Vector(4 + r, -26, 4 + r), cq.Vector(0, 1, 0))
    )
    s = s.fuse(root)
    # Saw two parallel cuts and finish their root; preserve the upright barrier.
    s = s.cut(box((17, 10, 9), (12.5, 0, 3.5)))
    for y in (-15, 15):
        s = s.cut(cq.Solid.makeCylinder(2.25, 6, cq.Vector(12, y, -1)))
        s = s.cut(cq.Solid.makeCone(4, 2.25, 1.75, cq.Vector(12, y, 0)))
    return s.clean().translate((-10, 0, -15))


def keeper(size):
    """Both stock-bar ends have 5 mm run / 4 mm rise saw/file bevels."""
    import cadquery as cq

    sx, sy, sz = size
    s = box(size, (0, 0, 0))
    for sign in (-1, 1):
        end = sign * sx / 2
        wedge = (
            cq.Workplane("XZ")
            .polyline([(end, -2), (end, 2), (end - sign * 5, -2)])
            .close()
            .extrude(sy, both=True)
            .val()
        )
        s = s.cut(wedge)
    return s


@lru_cache(maxsize=1)
def end_screw():
    """M4x40 DIN7991 candidate, length includes flush head; nominal unthreaded."""
    import cadquery as cq

    return cq.Solid.makeCone(4, 2, 2, cq.Vector(0, 0, -20)).fuse(
        cq.Solid.makeCylinder(2, 38, cq.Vector(0, 0, -18))
    )


@lru_cache(maxsize=1)
def carrier_screw():
    """M6x14 cap screw and 1.6 mm washer, shaft towards +Y. Centre from envelope."""
    import cadquery as cq

    axis = cq.Vector(0, 1, 0)
    # Frame face at Y=0. Carrier occupies -6..0; washer -7.6..-6.
    shaft = cq.Solid.makeCylinder(3, 14, cq.Vector(0, -7.6, 0), axis)
    head = cq.Solid.makeCylinder(5, 6, cq.Vector(0, -13.6, 0), axis)
    washer = cq.Solid.makeCylinder(6, 1.6, cq.Vector(0, -7.6, 0), axis).cut(
        cq.Solid.makeCylinder(3.2, 1.6, cq.Vector(0, -7.6, 0), axis)
    )
    return shaft.fuse(head).fuse(washer).translate((0, 3.6, 0))

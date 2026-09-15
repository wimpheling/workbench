# GN4470 parked catches — offset-holder prototype

**Historical study — removed from the active design on 2026-09-14.**
The user chose simplicity: no parked magnets, offset holders or dedicated
fixings in the current assembly/BOM; no holder STLs in new quotation exports.
The downloaded vendor STEP and study code remain for reference. The four
88° operating stops and closed-door catch requirements remain. Stops do not
prevent closing drift; consider a simple strap later only if needed.
The following describes the superseded prototype, not the current design.

Both bifolds now contain the genuine GN 4470-50-C2-L3-SR magnet and L3 strike
STEP on two printable holders per opening. Four GBL3030.KIT **closed** catches
remain unfitted requirements; the former two parked GBL requirements are
superseded. The native parts are not resized or replaced by boxes.

## Mounting and motion

The fixed magnet sits outside the rear corner, away from the strike's closing
sweep. In fixed-door coordinates its source origin is (-47.5,-30,Z). The
magnet is turned 180° around source Z to face the counterbores away from its
holder, then 90° around Y to put its long dimension vertically. The flat
mounting face is against the holder; recessed screw heads are accessible.

The L3 strike is primary-leaf-mounted. Its parked source origin is
(-45.5,-30,Z), with source Y rotated 90°. Its closed primary-local pose is
derived by a further +88° Z rotation, cancelled by opening the primary -88°.
This leaves 2 mm between magnetic and strike faces at park. Default Z=250 mm;
the station varies as enclosure height/4 + 65 to remain between the lower
stop and middle hinge. Larger/smaller configurations still require evaluation.

The rejected direct-mount layout collided during closing. In the offset
layout the strike approaches from clear space. Five-pose tests include the
real vendor solids, both PETG holders, nominal M5 fixing assemblies, both
leaves, glazing, hinges, stops and enclosure structure. Nominal catch-body
clearances decrease from about 53.94 mm closed to 2 mm parked. Sampled checks
are not a tolerance/continuous-motion certificate; retain report unknowns.

## Bought fixings and printed parts

Each fixed holder has an 8 mm root and 8 mm magnet-support plate joined by
webs/ribs. Each moving holder has an 8 mm root and 6 mm strike-support plate
with ribs. Default envelopes:

| Printed body | Quantity | Envelope (mm) |
| --- | --- | --- |
| BF-CATCH-MAGNET-HOLDER | 2 | 61.5 × 33 × 64 |
| BF-CATCH-STRIKE-HOLDER | 2 | 30.76 × 33.14 × 64 |

Both fit the A1 mini. Prototype starting settings are PETG, 0.2 mm layers,
six walls and 50% infill. Print with assembly Z vertical, root's lowest edge
on the bed. Supports are needed under projecting features; inspect slicer,
hole roofs and support removal. These are not validated strength settings.

Per holder, two M6 slot fixings with metal washers attach its root. Their
8 mm root, Ø6.5 holes and Ø14 approach reliefs are modeled; the M6 root
screws/slot nuts/washers remain specified in the fixing schedule, not vendor
CAD. M6×16 is only a candidate pending actual nut setback/engagement.

Two M5 through-bolts per holder attach the catch to the print, with bought
metal washers and locknuts—no printed threads. Eight M5 fixing assemblies
are modeled as nominal unthreaded solids, not vendor STEP or screw/nut
manufacturing definitions. Magnet M5×25 and strike M5×16 are length candidates.
The nominal head is Ø8.5×5, washer Ø10/5.3×1 and nut 8 mm across flats ×5.
Confirm actual head seating, grade, washer/nut dimensions, protrusion and
locking before ordering. Washers do not eliminate PETG clamp creep.

The quotation ZIP contains both `printed-prototypes/BF-CATCH-*-HOLDER.stl`
files with revision-tagged JSON manifests. Each file is one PETG body on Z=0;
print two of each. Vendor metal parts and fasteners are excluded from STLs.
The physical BOM counts two complete GN4470 kits; separate strike geometry
has procurement quantity zero to avoid ordering the same kit twice.

## Not validated by this model

The 2 mm air gap is deliberate but its holding force is **unknown**. Do not
apply the catalogue contact-force value across it. Verify retention and
release force at the actual gap, tolerances/sag, accidental release, approach
clearance, PETG bonding/root strength, fastener bearing, clamp creep and cycle
life. Keep both 88° operating stops: these magnets are retention-only, never
travel stops, weight supports or impact-rated restraints.

Physical fabrication and commissioning remain excluded, not completed.
See [vendor provenance](../backend/enclosure/assets/GN4470.md) and
[verification tracking](../TRACKING.md).

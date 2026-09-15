# Printed 88° parked stops — prototype, not impact-rated

Four identical one-piece PETG bodies replace the custom metal parked-stop
brackets (two per opening). These fixed-jamb parts gently limit the primary
leaf to the existing nominal 88° position through replaceable rubber pads.
They are not hinge components, roller-retaining hardware, slam restraints or
latches. Parked catches are deliberately omitted for simplicity; the stops
do not prevent closing drift. Consider a simple strap later only if needed.

## Geometry and assembly

The native authority is `bifold_completion.park_bracket()`: approximately
39.42 × 34.55 × 60 mm overall; an 8 mm mounting plate and arm, 8 mm contact
wall and two 6 mm transverse ribs. The mounting face and uncompressed pad
contact datum are unchanged. Two Ø6.5 mm through-holes remain 30 mm apart.
Open Ø14 mm access reliefs clear the nominal washers and driver approach.
This is original printable geometry, not vendor STEP.

Each body uses two bought metal M6 screws, two 12 × 6.4 × 1.6 mm flat washers
and two slot-8 nuts. The eight washers are modeled as nominal standard-part
solids, not vendor CAD. M6 × 16 is a length candidate: the stack is 8 mm PETG
plus 1.6 mm washer, leaving 6.4 mm before allowing for nut setback. Confirm
actual engagement and bottoming; no tightening torque is specified. Washers
spread load but do **not** eliminate PETG clamp creep. No printed threads.

Cut four 18 × 20 mm pads from bought 2 mm self-adhesive EPDM sponge, e.g.
[RS PRO 205-418](https://pt.rs-online.com/web/p/laminas-de-caucho/0205418).
The [manufacturer sheet](https://docs.rs-online.com/88bf/A700000012600528.pdf)
specifies 1 m × 1 m × 2 mm adhesive-backed stock and warns of poor oil
resistance. RS Portugal listed it in stock on 2026-09-14; check delivery before
buying. Four pads share one sheet or suitable offcut, not four sheets. This
source avoids a custom machined bumper, but pad compression, adhesive-stack
thickness, adhesion to PETG and wear are not validated. Do not use a different
thickness without checking the resulting stopping angle.

## Printing and files

The quotation ZIP contains `printed-prototypes/BF-PARK-88.stl` and a matching
revision-tagged JSON manifest with quantity, dimensions and print notes.
The STL contains only one PETG body; print four copies. Metal washers and pads
are deliberately excluded. It is generated from the same native solid as the
UI, translated onto Z=0 in millimetres—not a separate simplified mesh.

Provisional orientation: assembly Z vertical, lower end of the 60 mm mounting
plate on the bed. This keeps the arm/rib paths in XY layers, but arm undersides
require supports. Inspect support placement/removal and horizontal hole roofs
in the slicer; do not fill holes with trapped support. A starting trial uses
0.2 mm layers, six walls and 50% infill in PETG, with a brim if needed. These
are proposed settings, not a validated strength prescription or supplied G-code.
The [A1 mini specification](https://cdn1.bambulab.com/documentation/quick-start-f507128172bdf/Quick%20start%20guide%20-%20A1%20mini-EN.pdf)
lists a 180 × 180 × 180 mm build volume and PETG support.

## Evidence and limitations

Tests check one connected valid solid, build-volume fit, through-holes,
washer seating without penetration, five opening poses, nominal pad contact
at full opening, and geometric interception of an intentionally overshot
leaf. That last check proves only where rigid solids intersect, not that the
print survives the load. STL/manifest tests preserve four-body quantity and
revision provenance. Browser tests check PETG inventory and animation.

Print trial, hole fit, dimensional tolerance, layer bonding, root stress,
washer bearing, clamp creep, impact and repeated cycling remain unresolved.
No force, speed, temperature derating or life rating is assigned. Do not rely
on both stops sharing load equally. Fabrication and commissioning are outside
this software pass; the model remains not released for order.

Live revision `532cbc094157e432`: 452 parts, 1,583 pass / 0 fail / 126 unknown.
Browser acceptance passed; the downloaded 1,360-facet STL has two triangles
per edge and bounds (0,0,0) to (39.4212,34.5537,60) mm. Its four-body manifest
matches the model/report revision. Full regression status is in `../TRACKING.md`.

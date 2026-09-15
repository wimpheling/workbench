# Rear electrical mounting prototype

Original Shapeoko **5 Pro**, not 5.1. Dimensions are in millimetres.
The controller sits outside the fixed rear panel, near its right edge and the
rear centre. Its steel backing strip spans the top/bottom rear frame rails;
eight steel sleeves across the two strips carry clamp loads into those rails.
The separate rear-left strip supports an original printed STOP pendant cradle.
Neither assembly moves with a door. The user operates from the left.

## Evidence and limits

The controller body is an owner-measured **171 W × 337 H × 89 D** envelope.
The manufacturer has not supplied a mounting drawing or mass. The user will
measure and validate later. A 70 mm connector-access reference beyond the case
is a planning allowance, not a cable bend radius or cooling specification.

- [First-hand controller measurements](https://community.carbide3d.com/t/5-pro-electronics-box-dimensions/59644)
- [William Adams's mounting template](https://community.carbide3d.com/t/mounting-the-electronics-for-an-so5-pro/62184)
- [Carbide's pendant holder reference](https://carbide3d.com/3d-print/power-pendant-home-base/)

The printed cradle here is an original adjustable strap cradle; it does not copy
or redistribute Carbide's restricted print file. There is no vendor pendant
solid. Measure the pendant before printing: usable tray width 128, depth 40,
back height 154. A 20 mm retaining strap passes through the two back slots and
around the body, clear of STOP, feed-hold and connectors. The strap is a bought
requirement, not included in the STL. Check pressing force cannot dislodge the
pendant or slide the strap. Confirm reach at the actual operating location.

## Installation

1. Verify case, pendant, connector and cable measurements. Dry-fit both bifolds
   throughout travel; inspect their handles and the operator's hand clearance.
2. Cut the two 3 mm steel backing strips to the model's sizes. Confirm their
   stiffness for actual equipment weight. Drill frame holes from the schedule.
   Top/header and bottom rail rear faces differ: use the specified individual
   sleeve lengths, then confirm the physical slot locations and M6 engagement.
3. Bottom sleeves pass through 14 mm panel holes. Seal these penetrations around
   the sleeves and restore the affected panel gasket locally. Do not clamp wood
   or PETG as the structural spacer. Frame screws/nuts are scheduled, not modeled.
4. Weld the controller shelf to its root strip and bolt the root to its backing
   plate. Transfer the actual case mounting pattern to the backing strip. No
   guessed controller hole pattern is released. Select case fixings and 10 mm
   spacers after measurement, retain the case against tipping, and leave cooling
   surfaces and plugs accessible. Weld and shelf capacity require validation.
5. Print the cradle and two cable-cover halves in PETG, flat backs on the bed,
   0.2 mm layers, five walls, 50% infill. Enable support beneath the cradle
   front lip, remove it and inspect the shelf/lip junction. Each fits the A1
   mini 180 mm bed.
   Fit cradle on four 6 mm steel spacers for strap clearance, using four M5
   bolts, broad washers and locking nuts; do not crush
   the plastic. Validate print adhesion, fit, retention and creep before use.
6. The fixed rear panel has a **60 mm connector passage** and four M5 cover holes.
   Pass disconnected plugs through it; reinstall the two 100 mm cover halves
   around the cables. They leave a **30 mm bundle aperture** and a 0.5 mm split.
   Fit a split soft bushing sized to the actual bundles plus a 2 mm closed-cell
   gasket beneath the covers; seal the split. These soft components are pending
   selection and are not represented as verified seals by solid geometry.
7. Install cushioned clamps on fixed structure on both sides of the opening.
   Route to the nearby controller with a service loop; route the pendant lead
   leftwards along the fixed rear panel. Clamp sizes/locations, bends, slack and
   lengths need the real harness. Do not attach cables to a moving door.

No electrical rewiring or change to the machine stop system is included.
The Nilfisk and right-side airflow arrangement are outside this implementation.
Geometric clearance does not prove strength, stop performance or dust containment.
The rear frame-gasket coverage check intentionally reports the four sleeve
passages as uncovered until the actual sealing arrangement is modeled and
validated; the rigid sleeve alone is not credited as a continuous seal.

## Deliverables

Quotation ZIP: three original STL files and revision-linked print manifests,
`rear-electrical.json`, this guide, panel drilling schedules/DXF, assembly STEP
and the ordinary hardware inventory. Physical installation evidence remains open.

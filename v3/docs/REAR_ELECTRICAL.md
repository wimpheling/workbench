# Rear electrical mounting prototype

Original Shapeoko **5 Pro**, not 5.1. Dimensions are in millimetres.
The controller and original printed STOP holder mount directly to the fixed rear
panel with through-bolts and broad washers. Local 12 mm plywood backing pads
inside the panel spread the loads: controller 210 × 377, pendant 140 × 160.
These are provisional sizes, pending equipment weight and panel-flex checks.
The holder remains rear-left, accessible from the operating side.
The cable entry is 100 mm above the enclosure base, beside the rear-right door:
from right to left the order is door → hole → controller.

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
2. Cut the local plywood backing pads and clamp them against the inside face of
   the 6 mm rear panel. Verify panel stiffness with actual controller weight and
   the force of pressing STOP before accepting this mounting arrangement.
3. Transfer the controller's actual mounting pattern through panel and backing
   pad. No guessed controller holes are released. Select through-bolts, broad
   washers and locking nuts after measurement; retain provisional 10 mm case
   spacers only if they meet actual ventilation and connector requirements.
4. Drill the four scheduled pendant holes through panel and backing pad.
   The tall steel strips, frame sleeves and welded shelf are no longer required.
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
Seal the mounting penetrations as well as the cable entry. The frame perimeter
gasket is no longer pierced by mounting sleeves. Seal performance remains unverified.

## Deliverables

Quotation ZIP: three original STL files and revision-linked print manifests,
`rear-electrical.json`, this guide, panel drilling schedules/DXF, assembly STEP
and the ordinary hardware inventory. Physical installation evidence remains open.

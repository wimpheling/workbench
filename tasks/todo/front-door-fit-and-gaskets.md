# Fit the front doors inside the frame and specify T-slot gaskets

## Description

Correct the closed front-door position: the doors currently sit outside the
frame, while the intended closed position is inside it. Specify real T-slot
gasket products for the door-to-frame interfaces and the junction between
the two doors.

## Discussion

The double front opening must retain access for stock spanning the Shapeoko
4×4 working area, without a fixed centre post obstructing loading. The
geometry, hinge offsets, closing order, stops, and gasket compression need
to be designed together. Generic rubber volumes are insufficient for a
purchase-ready specification. The requirement is for specific T-slot
gaskets, including a buildable mounting arrangement at the meeting edges.

Coordinate ventilation and dust containment with
[the right-side airflow task](right-side-airflow-and-filtration.md).

## Implementation plan

- [ ] Establish the inset closed-door geometry
  - [ ] Define the frame datum, door depth, hinge axes, and perimeter clearances
  - [ ] Check the usable loading opening and opening sweep
- [ ] Specify real gasket products and closure hardware
  - [ ] Select manufacturer references compatible with the actual extrusion slots at the perimeter
  - [ ] Select the meeting-edge T-slot gasket arrangement and establish closing order
  - [ ] Document compression ranges, corners, joins, stops, latches, and installation details
- [ ] Implement and verify the assembly in v3
  - [ ] Update geometry, animation metadata, tolerance checks, and seal checks
  - [ ] Verify both doors close inside the frame without collision or unintended dust gaps
  - [ ] Update supplier exports and assembly instructions with exact references and quantities
  - [ ] Run relevant tests, checks, and builds and record the results

## Open questions / blockers

- [ ] What inset depth and hinge arrangement provide the required swing and loading clearance?
- [ ] Which exact perimeter and meeting-edge T-slot gasket references fit the selected extrusions?
- [ ] How will the meeting-edge seal mount without a fixed centre post?
- [ ] What closing order, latch force, and adjustment range achieve the specified compression?

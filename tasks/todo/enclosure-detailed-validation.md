# Detailed enclosure validation and commissioning

## Description

Track the cross-enclosure, “vertical” work after the major design choices for
each side are settled: supplier details, tolerance and load evidence, physical
fit, alignment, sag, sealing, wear and commissioning. This task remains open
independently of completed side-design tasks. A completed design is not a
manufacturing release or evidence that these checks passed.

## Discussion

The owner distinguished two axes: horizontal tasks decide the layout and
mechanisms across the enclosure; vertical work validates those designs in
more detail. Front-door design is complete in
[the inset-door task](../done/front-door-fit-and-gaskets.md) and
[the glass/seal-junction task](../done/front-glass-and-seal-junctions.md), with
the updated opening in [frame headers](../in-progress/frame-header-layout.md).
The former [front validation follow-up](../done/front-door-hardware-and-gasket-validation.md)
is closed by transferring its outstanding obligations here, not by claiming
supplier approval or physical tests have occurred.

Use the model revision and actual installed parts when recording results.
Model geometry and sampled motion are useful evidence, but do not establish
seal performance, tolerance fit, loads, fatigue or safe retention. Keep each
unresolved item visible until there is evidence for it. If validation reveals
a change to a major design choice, create or reopen the relevant horizontal
task and link the finding rather than silently changing the accepted design.

Related design scopes: [bifolds](../in-progress/bifold-door-mechanism.md),
[rear electrical mounting](../in-progress/back-electrical-mounting-and-cables.md),
[roof and hose interface](roof-panels-and-gasket.md), and
[right-side airflow](right-side-airflow-and-filtration.md).
Roof layout and airflow architecture remain decisions in their own tasks;
this task covers their detailed evidence after those choices are made.

## Implementation plan

- [ ] Establish the evidence required for each accepted design
  - [ ] Record model revision, actual components, installation conditions and measurements
  - [ ] Define acceptance criteria for alignment, sag, forces, stiffness, retention, leakage and wear before testing
  - [ ] Resolve outstanding continuous-motion bounds and tolerance-sensitive contacts; retain the distinction between sampled clearance and proof over full travel
- [ ] Confirm supplier details before fabrication or glass ordering
  - [ ] Confirm front CFG screws, slot nuts, 6 mm spacers, corner connections, joint stiffness and hinge capacity for actual glass weight
  - [ ] Confirm FSP08 for 4 mm front glass: actual section, compound, setting support, minimum capture and retention
  - [ ] Confirm panel material and processing; retain wood moisture-movement checks if wood is selected
  - [ ] Select perimeter and meeting seal products, free sections, compression, attachment pitch and adjustment
  - [ ] Confirm support-tongue stiffness, bonded perimeter corners, head/sill boots, end support and actual preload
  - [ ] Specify front closure retention and physical stop/hold-open hardware; the modeled 100° travel limit alone supplies neither
  - [ ] Confirm bifold glazing compatibility, guide/carrier/axle/keeper fixings, slot engagement, brush-holder details and prepared-part dimensions against the linked design task
  - [ ] Validate front beam, guide-header and adapter loads, joint rotation, clamping/anti-rotation and deflection; the prior total guide-movement target remains unproven
  - [ ] Measure rear controller and pendant dimensions/mass/fixings, panel/backing-pad stiffness, connector access, cable lengths/bends and operating reach before drilling or printing to final fit
- [ ] Validate fit and operation on the physical assembly
  - [ ] Measure squareness, alignment, tolerance stack, hinge travel and full loading access
  - [ ] Measure loaded door sag, joint movement and operating forces
  - [ ] Cycle both front doors in the specified order; check seal contact, closure retention, stops and hold-open behavior
  - [ ] Cycle the bifolds through full travel and parking; check guide drag, keeper retention, stops, latch operation and available workshop space
  - [ ] Validate printed-part fit, clamp dwell, creep, dust wear and retention on coupons/prototypes before full-door use
  - [ ] Confirm rear STOP-holder reach and retention under pressing force; check fixed cable routing, strain relief and service access without changing wiring or the stop system
- [ ] Validate sealing and airflow on the assembled enclosure
  - [ ] Check actual gasket compression/contact at door perimeters, meeting seams, corners and end boots
  - [ ] Check roof/panel seams, hose interface, cable bushing and mounting penetrations with the selected products
  - [ ] Measure containment, leakage, extraction and cooling using the selected vacuum, hose, shoe, airflow arrangement and filters
  - [ ] Inspect seal attachment, operating-force changes, wear and maintenance access after cycling
- [ ] Record results and release decisions
  - [ ] Attach supplier evidence and test results to the relevant part/model revision
  - [ ] Record failed or inconclusive checks and link required design changes
  - [ ] Release fabrication/ordering only for components with the required evidence; keep remaining assumptions explicit

## Open questions / blockers

- [ ] Actual supplier-approved gasket sections/compounds, glass setting support and minimum capture are not yet established
- [ ] Final front catches, physical stops and hold-open details remain to be specified
- [ ] Assembly tolerances, loads, acceptance limits and test conditions need agreement
- [ ] Physical assembly and commissioning evidence is not yet available; nominal geometry does not resolve these items

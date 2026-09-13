# Validate and redesign the bifold doors

## Description

Replace the current bifold mechanism with a conventional, buildable assembly
for the left wall's rear half and the rear wall's right half. It must fit the
limited workshop space, close reliably, and contain wood particles without
preventing the enclosure's planned ventilation.

## Discussion

The current design has an unrealistic tall header seal, external guide
adapters, and a rear track that appears unsupported. These are unresolved
mechanical problems; passing the current model checks does not validate the
assembly. The user rejected this arrangement.

The proposed direction is a supported track beneath the structural header,
conventional pivots or hinges, an interleaf hinge, and a guided outer leaf.
The load-bearing hardware and the dust seals must have distinct roles.
Clearance for movement is necessary; any header cover or brush/lip must be
designed around the actual hardware rather than filling the running space
with a large compression gasket.

Compare ready-made systems for technical fit first and evaluate prices later.
Research leads include Henderson Bifold B10/2, Hettich WingLine S/L, and
Johnson 1700. These are candidates, not approved selections. Check original
installation drawings, mounting requirements, and availability in Portugal.
Do not assume a kit for wooden leaves fits a hollow aluminium leaf frame.
The earlier Reiman sliding-profile selection also needs checking: a sliding
profile alone does not establish a complete bifold mechanism.

The enclosure remains parametric for a Shapeoko 5 Pro 4×4. Nothing is bought.
The user wants to assemble supplier-prepared frames and panels, not fabricate
custom mechanisms. Printed parts were suggested as a possibility, not agreed
as load-bearing hardware. The animation fix merged in PR #13 is separate from
this mechanical redesign.

## Implementation plan

- [ ] Agree on a conventional mechanism before changing geometry
  - [ ] Compare candidate kits using manufacturer drawings, leaf limits, mounting details, and opening envelopes
  - [ ] Establish the load path, supported track location, pivot axes, retention, and adjustment range
  - [ ] Compare supplier-prepared wood leaves with the existing aluminium-framed leaves
  - [ ] Review the technically suitable shortlist with the user, then compare complete installed prices
- [ ] Specify the complete assembly
  - [ ] Select exact hardware references and document all mounting preparation and fasteners
  - [ ] Specify closed stops, latches, modest seals, and their clearances through the full movement
  - [ ] Confirm workshop access and usable opening with both leaves folded
- [ ] Implement and verify the agreed design in v3
  - [ ] Replace the floating track, external adapters, and unrealistic header seal in the domain model and rendering
  - [ ] Verify clearances, full motion, tolerance allowances, support, and seal engagement against the chosen hardware
  - [ ] Update supplier specifications, cuts, quantities, drawings, and assembly instructions
  - [ ] Run relevant tests, checks, and builds; record remaining physical checks without claiming they are proven

## Open questions / blockers

- [ ] Which ready-made kit fits the required geometry and mounting arrangement?
- [ ] Should the bifold leaves remain aluminium-framed or become supplier-prepared wooden leaves?
- [ ] Which components carry the weight, and how are they secured to the enclosure?
- [ ] What folded projection and access clearance are available at each workshop location?
- [ ] Which seal profiles close the dust paths without obstructing rollers or folding?
- [ ] Is any custom or printed component necessary, and can supplier preparation avoid user fabrication?

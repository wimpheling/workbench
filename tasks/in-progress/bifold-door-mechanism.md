# Complete the existing bifold door specification

## Description

Complete the hardware, mounting, and seal specification for the existing v3
bifold doors in the left wall's rear half and the rear wall's right half.
Use the implemented assembly as the starting point and reuse its continuous
infill retention and sealing approach for the front-door glazing where applicable.

## Discussion

The user confirmed that the previous version of this task was outdated.
Its blanket redesign direction, claim that the current arrangement was
rejected, and mandatory comparison of replacement kits no longer describe
the agreed next step. A replacement mechanism or change to solid wooden
leaves is not a prerequisite. Review specific unresolved interfaces in the
existing assembly before proposing geometry changes.

The active implementation is `v3/backend/enclosure/`; the former root
`src/` application has been removed. In `core.py`, each bifold has two
aluminium-framed leaves, equal-link motion, an 85-degree primary-leaf opening
limit, and a guided outer leaf. Bifold infill defaults to wood and is
configurable. The frame hinges reference GLR3030 and the overhead tracks
reference GSD082.3000KIT. These references do not establish a complete,
verified hardware installation: track and carriage geometry remain explicitly
unconfirmed envelopes.

The current guide is above the header, at `H + 80 mm`, with its carriage at
`H + 63 mm`. A four-member dogleg adapter connects the outer leaf to the
carriage outside the header sealing barrier. Nominal members and mating
features are modeled; supplier preparation, bearings, fixed track supports,
fasteners, stiffness, and load capacity remain unresolved. The model expects
supplier preparation rather than customer fabrication.

`containment_geometry.py` already applies continuous opposing retaining
strips, soft packing against both infill faces, and a continuous edge gasket.
The user identified this glazing retention/sealing approach for reuse in the
[front-door task](../todo/front-door-fit-and-gaskets.md). Preserve that approach;
exact rubber references, setting support, fixing pitch, and preload still
need specification. A stationary infill seal does not by itself specify the
moving door perimeter or folding joint.

Perimeter stops and nominal seals, header barriers, and flexible bifold
meeting covers are also implemented. Their physical compression, attachment,
and folding behaviour remain unresolved. Existing geometry and motion checks
provide evidence about the modeled assembly; they do not establish supplier
hardware fit or rubber deformation. See the
[engineering model](../../v3/docs/ENGINEERING_MODEL.md) and
[implementation contract](../../v3/docs/CONTRACT.md).
Coordinate door sealing with the
[airflow task](../todo/right-side-airflow-and-filtration.md).

The task is now in progress at the user’s request, using the current
implementation as its baseline. No replacement mechanism has been selected. During the preceding root-app cleanup,
`npm test` passed 76 backend and 14 frontend tests; `npm run check` and
`npm run build` passed. This task update changes documentation only.

## Implementation plan

- [x] Reconcile the task with the existing v3 assembly
  - [x] Record the modeled leaves, guided motion, overhead track, and adapter
  - [x] Record existing continuous infill retention, packing, and edge sealing for reuse
  - [x] Remove the outdated requirement to replace the mechanism before proceeding
- [ ] Complete the existing hardware and mounting specification
  - [ ] Confirm hinge, interleaf hinge, track, carriage, and bearing references against their actual installation
  - [ ] Specify the load path, fixed track supports, adapter preparation, fasteners, and adjustment range
  - [ ] Confirm folded projection and usable access against the available workshop space
- [ ] Complete the seal and closure specification
  - [ ] Select compatible infill gasket/packing references, setting support, corner joins, and retaining-strip fixings
  - [ ] Reuse the infill retention/sealing approach in coordination with the front-door task
  - [ ] Specify perimeter/header seals, stops, latches, and installed compression
  - [ ] Establish folding-joint cover attachment, bend allowance, and clearance through movement
- [ ] Implement and verify the remaining assembly details in v3
  - [ ] Update geometry only where the completed hardware and seal specification requires it
  - [ ] Verify mounting, tolerance allowances, motion, support, and seal contact; retain unresolved physical checks explicitly
  - [ ] Update supplier references, cuts, quantities, drawings, and assembly instructions
  - [ ] Run npm test, npm run check, and npm run build after implementation; record results

## Open questions / blockers

- [x] Which implementation is the baseline? The current v3 bifold assembly; the former root src implementation and old redesign direction are superseded.
- [x] Can the glazing sealing approach be reused? Yes: retain the continuous strips, face packing, and edge gasket approach; select exact products and installation dimensions for each application.
- [ ] Which exact hardware and mounting details realize the modeled axes and guide travel?
- [ ] How are track supports and guide adapters supplied, secured, and rated for the actual loads?
- [ ] What workshop clearances are available for the folded doors and overhead adapters?
- [ ] Which gasket/packing references and fixing details fit the infills, and which seals accommodate door movement?
- [ ] What latch adjustment, seal compression, and folding-cover bend allowance are required?

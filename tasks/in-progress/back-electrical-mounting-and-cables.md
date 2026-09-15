# Support the electrical block and STOP button and route cables

## Description

Design the back of the enclosure to support the electrical block and STOP
button, with a defined cable route and appropriate mounting and access.

## Discussion

The mounting arrangement must coexist with the rear right bifold door and
its folded position. Component dimensions, mass, connectors, and cable
requirements are not yet specified. Confirm where the STOP control can be
reached from the user's operating position before fixing its location.
This task covers mounting and routing; changes to electrical wiring or the
machine's stop system require an explicitly defined scope.

Coordinate with [the bifold task](../in-progress/bifold-door-mechanism.md) and
[the airflow task](../todo/right-side-airflow-and-filtration.md).

### Agreed scope — 2026-09-15

User authorised implementing the controller outside the fixed rear panel near
centre, an original 3D-printed STOP pendant holder at rear-left and a cable hole.
They operate from the left; the right wall has 200–300 mm clearance. Controller
measurements and fit will be validated later. Original Shapeoko 5 Pro controller
body uses a first-hand 171 × 337 × 89 mm envelope; no 5.1 substitution.

The implementation uses rail-supported steel backing strips, a controller shelf,
a PETG strap cradle and a 60 mm cable passage with two removable printed cover
halves leaving a 30 mm bundle aperture. Case mounting holes are transferred from
the actual case rather than invented. Pendant dimensions remain unknown, so the
128 × 40 × 154 mm usable cradle is explicitly a fit prototype; strap, bushings,
gaskets and final cable clamp selection remain installation requirements.

See [rear electrical guide](../../v3/docs/REAR_ELECTRICAL.md) for sources,
installation, part schedules, print limitations and measurement requirements.
Nilfisk filtration and the existing airflow geometry are outside this change.
No electrical wiring or stop-system changes are authorised or made.

Digital evidence: final default revision `f4dc49e8e6be9fe6` exports a quotation
ZIP with three original STLs/manifests and the installation guide. All 117,370
closed physical pairs are checked; no rigid collision witnesses. Five sampled
bifold poses pass. STL edge checks report closed meshes (2,116 cradle triangles,
1,284 per cable-cover half). Continuous motion remains unknown (361 unresolved
interval pairs across the assembly). The rear frame-gasket sleeve passages
produce a coverage failure and the related containment requirement failure;
this is exposed, not waived. Actual sealing and installation remain open.

Frontend: 45 unit tests, type check and production build pass. The new live
preview browser test passes with both bifolds open and the electrical notes
visible. The existing enclosure interaction test also passes on rerun (6.1
minutes), including manual verification, dimension changes, door controls and
CSV download. Cold runs encountered the existing 120-second response timeout;
the successful final rerun used the warm service cache. Final default
verification including shape construction takes approximately 36 seconds on
this machine after eliminating repeated closed-pair bounding-box extraction.
Backend regression: `uv run pytest` completed with 194 passes and one stale
service assertion expecting the previous zero-failure model. That assertion was
updated to require exactly the two sleeve-sealing failures and the new cable-bore
pass/installation-unknown checks. Its targeted rerun passes (1/1). Thus all 195
cases have passing results against their final assertions; the full command was
not repeated after the test-only expectation update. Ruff and diff checks pass.
Implementation delivered in [PR #18](https://github.com/wimpheling/workbench/pull/18).
Physical measurement and installation items below remain open.

## Implementation plan

- [ ] Establish component and access requirements
  - [ ] Identify the exact electrical block and STOP control, dimensions, mass, mounting points, and manufacturer requirements
  - [ ] Agree on locations with operating access, service access, and door movement accounted for
- [ ] Design mounting and cable routing
  - [x] Specify steel backing strips, controller shelf, frame sleeves and printed cradle; load path goes to rear rails, capacity remains unvalidated
  - [ ] Entry location and fixed-panel route defined; confirm actual connectors, bends, slack and cable lengths after measurement
  - [ ] Split cover and mounting passages modeled; select actual cushioned clamps, split bushing and sealing materials after measuring the harness
- [ ] Implement and verify the arrangement in v3
  - [x] Add controller envelope, mounting preparation, documented cable route and connector-access reference; pendant fit remains an explicit prototype assumption
  - [ ] Five-pose rigid hardware clearance and bearing-support tests pass; flexible cable interference, pendant retention and actual reach remain unverified
  - [x] Update supplier specifications, panel drilling, installation guide and three original STL/manifest exports
  - [x] Run relevant tests, checks, builds and browser/export checks; record exact results and remaining geometric/physical limitations above

## Open questions / blockers

- [ ] Which electrical block and STOP button will be used, and what are their mounting requirements?
- [ ] Can the proposed STOP location be readily reached from the operating position?
- [ ] Which cables, connectors, lengths, and entry/exit destinations must be accommodated?
- [x] Which equipment should be inside versus outside the enclosure? Controller and STOP pendant are outside; cables cross the fixed rear panel.
- [x] Does the agreed installation require electrical changes beyond mounting and routing? No; this scope changes only mechanical mounting and cable entry.

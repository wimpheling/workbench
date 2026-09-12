# V3 delivery tracking

Branch: `rebuild/v3-verified-enclosure`, based on the existing enclosure branch. Existing source and uncommitted work are preserved. This document tracks implementation separately from physical design release: a working application does not make unresolved supplier interfaces order-ready.

## Contract and scope

- [x] Preserve existing branch intent and identify Reiman Portugal / Wolweiss supplier references.
- [x] Define shared backend / verification / frontend contract.
- [x] Create isolated `v3/` Python environment with native CadQuery/OpenCascade.
- [x] Assign CAD core, independent verification and frontend to separate implementation agents.
- [x] Parametric frame and explicit inventory of modeled parts; unresolved hardware remains a release blocker.
- [x] Double front doors, unobstructed loading aperture for working-area-sized board.
- [x] Left-rear and back-right exterior bifold doors with guide constraints.
- [x] Wood wall/roof infills, glass door infills, roof hose penetration.
- [x] Reiman supplier geometry and source traceability.

## Verification

- [x] Mandatory inventory, identity, finite dimension/transform and reference checks.
- [x] Measured mating features and independently checked mechanism residuals.
- [x] Actual solid validity/intersection checks, including zero-clearance cases.
- [x] Explicit contact policies and complete pair accounting.
- [x] Conservative motion interval checks; unresolved intervals never pass.
- [x] Tolerance margins, machine envelope and loading aperture checks.
- [x] Missing physical evidence prevents order-ready status.
- [x] Adversarial regression tests for audit failure modes.

## Application and supplier deliverables

- [x] Local HTTP evaluation/export service with revision and stale-response protection.
- [x] Parametric authoring, CAD mesh viewer, four independent door controls.
- [x] Report with failures, unresolved evidence and coverage.
- [x] Supplier-specific extrusion, panel/glass and hardware CSVs.
- [x] Dimensioned PDF supplier drawings and assembly guidance.
- [x] Millimetre DXF panel outlines including declared holes.
- [x] STEP assembly from the same authoritative geometry.
- [x] ZIP quotation pack with model, report, provenance and unresolved specifications.
- [x] Tempered-glass processing and mounting requirements explicitly tracked.
- [x] README with reproducible install/run/test/export instructions.

## Independent acceptance

- [x] Backend suite passes in isolated environment.
- [x] Frontend tests, type checks and production build pass.
- [x] HTTP default/change/invalid input/pose/export tests pass.
- [x] PDF, CSV, DXF, STEP and ZIP exports parsed independently.
- [x] Browser interaction and downloads exercised.
- [x] Supervisor reviews false passes and remaining scope against original audit.
- [x] Remaining hard evidence blockers documented with exact consequences.

## Acceptance evidence — 2026-09-13

- Backend: **54 tests passed**, including actual CAD, adversarial validation, HTTP requests and supplier-file parsing.
- Frontend: **8 unit tests passed**, TypeScript check and production build passed.
- Browser: actual CAD viewer, independent four-door poses, invalid/blank input, parameter change, stale export protection, CSV download and desktop/mobile layout exercised against the real service.
- Existing application: **196 tests passed**, root `npm run check` and `npm run build` passed. Original uncommitted changes are unchanged.
- Default engineering report: **472 pass, 0 fail, 36 unknown**, 124 modeled physical components plus two reference envelopes. All **7,626** closed physical pairs evaluated.
- Continuous motion: **6,747** relevant pairs, **6,291** separated by analytic interval bounds, **432** covered by rigid-link invariance, **24** unresolved supplier-hardware proxy interactions. No unresolved pair is reported clear.
- All 24 structural mating interfaces have measured nominal end-face overlap, opposed normals and coincident datums. The default fully-open actual-solid audit finds no collisions.
- Supplier output: ZIP pack with a **26-page PDF**, separate supplier CSV schedules, 1:1 mm DXF outlines including the roof hole, STEP assembly, model and report. PDF inspected visually and parsed; DXF and STEP parsed independently.
- Generated examples and screenshots live under ignored `v3/artifacts/`; regenerate with `make export` from `v3/`.

## Hard evidence blockers for final ordering

The software is operational. The physical enclosure is **not released for purchase**. These boxes intentionally stay open; they cannot be checked honestly from the available supplier and machine evidence:

- [ ] Match the configurable machine envelope to the actual Shapeoko 5 Pro 4×4, spindle/router and dust shoe.
- [ ] Confirm hose bend radius, suspended support and clearance over the actual full CNC travel.
- [ ] Establish that purchased hinges, interleaf hinges, guide and carriage realize the proposed bifold axes and travel without custom fabrication; resolve the 24 proxy motion interactions with confirmed geometry.
- [ ] Confirm bracket orientations, mounting patterns, fastener lengths and quantities, rail/roof attachment and installation tool access.
- [ ] Select compatible glass/wood panel retention, glass thickness/edge finish and any processing required before tempering.
- [ ] Confirm latch/strike/stop engagement and adjustment provisions for each door; closed solids alone do not prove closure hardware works.
- [ ] Confirm supplier cutting tolerances and allowances for frame squareness, door sag and roof loading.

Quotation exports include candidate dimensions and these blockers; no supplier communication or order has been sent. Completion of implementation checkboxes above does not imply completion of these physical evidence requirements.

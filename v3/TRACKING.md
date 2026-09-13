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

## Containment and verification controls revision

The first acceptance run below covered solid clearance and kinematics but missed the user's dust-containment objective. Its results do not establish that the door gaps are acceptable. This revision adds a separate, mandatory containment assessment.

- [x] Continuous panel-edge seals and overlapping door perimeter barriers.
- [x] Covered front meeting seam with an explicit closing order and flexible bifold meeting seals.
- [x] Deliberate baffled makeup-air inlet, roof hose collar and base interface.
- [x] Independent seam coverage and airflow-geometry checks, including broken-model tests.
- [x] Geometry-only HTTP preview that never invokes verification.
- [x] Automatic-verification toggle, manual verification and unverified-preview export protection.
- [x] Supplier schedules and assembly notes include seal and airflow specifications.
- [x] Integrated backend, frontend, browser and original-application checks.
- [x] Final geometry review and regenerated quotation artifacts.

## Current acceptance evidence — containment revision

### Live door preview revision — 2026-09-13

- [x] Canonical closed meshes are returned by `/api/evaluate` and `/api/preview`; pose changes no longer tessellate or transfer a second full posed assembly.
- [x] SolidJS/Three applies smooth client-side rigid transforms from backend `model.doors` and `motion_leaf` metadata for both front swing leaves, both bifold leaves and both moving carriages.
- [x] Front opening/closing order remains explicit in the playback sequence: right fully opens before left; left fully closes before right. Playback cancels on parameter/material edits, verification mode changes, manual verification and component teardown.
- [x] Frontend transform fixtures match `core.pose_model` endpoint positions for all four doors; local slider/playback frames do not call `/api/evaluate` or `/api/preview`, including with Automatic verification disabled.
- [x] Pose-only viewer state does not change the design revision or hide current report evidence; parameter changes still invalidate evidence and preserve unverified-preview export protection.

- Model revision **`661c38797236d6cd`**: **1,085 pass, 0 fail, 55 unknown**. Physical release remains blocked by unresolved evidence.
- **76 backend tests**, **9 frontend unit tests** and **3 browser tests** pass. The actual production browser flow covers door order, all four controls, preview-only edits, manual verification, stale-export protection, downloads, invalid-input recovery and desktop/mobile layouts. Two of those browser scenarios exercise cancellation/queued-request races with controlled responses.
- Python lint/format, frontend type check/build and root check/build pass. The original application has **196 passing tests**, and its existing uncommitted diff was compared byte-for-byte and preserved.
- **288 physical parts** plus two references; all **41,328** closed physical pairs checked. Motion accounts for **36,127** pairs: **33,449** bounded clear, **2,605** rigid-invariant, **73** unresolved. No unresolved interval is reported collision-free.
- Local seam coverage, independently derived pane gaps, roof collar/bore, inlet aperture, full air-channel volumes, geometric area allowance and all straight opening-to-exit segments are checked. Missing/shortened/displaced/perforated barriers and an oversized hose have negative regression tests.
- Supervisor review found that the initial new header buried the old guide path despite its proxy-related `unknown` status. Guides were moved overhead with explicit nominal adapter members and mating features. A regression rejects the old buried-guide geometry; adapter supply, stiffness, bearings and stationary supports remain unconfirmed.
- Additional diagnostic sampling found zero straight-through openings in **7,411 rays across the four walls**. This is supplementary sampling, not an exhaustive boundary or airflow certificate; roof/base are excluded from that diagnostic. The actual CAD test suite provides the repeatable local certificates.
- Final quotation pack independently parsed: **37-page PDF**, **16 DXF panel outlines** including the rectangular vent cutout, **288 STEP solids**, seal/hardware specifications and door/airflow assembly notes. The generated PDF and actual viewer were visually reviewed.
- Generated artifacts under ignored `v3/artifacts/`: `enclosure-661c38797236d6cd-quotation-pack.zip`, extracted current supplier files, `boundary-sampling.json`, its diagnostic script, screenshots and `air-inlet-section.svg`.
- Full browser acceptance used the built application served directly by the backend at port 8000 (`PLAYWRIGHT_BASE_URL`), after an earlier development-server process interruption. A browser inspector-cache limit was avoided by testing revision/state headers rather than duplicating large mesh response bodies; HTTP tests separately inspect those bodies.

## Initial acceptance evidence — 2026-09-13 (before containment revision)

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
- [ ] Establish that purchased hinges, interleaf hinges, guide and carriage realize the proposed bifold axes and travel without custom fabrication; resolve the remaining proxy/contact motion interactions with confirmed geometry.
- [ ] Confirm bracket orientations, mounting patterns, fastener lengths and quantities, rail/roof attachment and installation tool access.
- [ ] Select compatible glass/wood panel retention, glass thickness/edge finish and any processing required before tempering.
- [ ] Confirm latch/strike/stop engagement and adjustment provisions for each door; closed solids alone do not prove closure hardware works.
- [ ] Confirm supplier seal profiles, free section, compression range, corner joints, membrane folding and glass packing/setting support.
- [ ] Obtain the finished overhead guide adapters, bearings and track supports with confirmed stiffness, load capacity and mounting schedules.
- [ ] Confirm the continuous supporting tabletop and commission inward airflow, dust capture and cooling with the selected vacuum, hose, dust shoe and filter.
- [ ] Confirm supplier cutting tolerances and allowances for frame squareness, door sag and roof loading.

Quotation exports include candidate dimensions and these blockers; no supplier communication or order has been sent. Completion of implementation checkboxes above does not imply completion of these physical evidence requirements.

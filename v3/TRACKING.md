# V3 delivery tracking

## Simple swing latches — 2026-09-14 / acceptance 2026-09-15

- [x] User accepts intentional bottom gaps; remove mandatory bottom-continuity requirement without hiding collisions or fitted-barrier checks.
- [x] Model two manual PETG swing levers and keepers with six nominal M6 screw/washer stacks, scheduled slot nuts and oriented print exports. Viewer assumes manual release before folding.
- [x] Finish native, frontend, browser and live-pack acceptance.

Acceptance completed 2026-09-15: live `02edfb1d248ce451`, 466 parts, 1,625 pass / 0 fail / 112 unknown. Two original PETG swing latches; 20.2 mm raised-handle clearance. Intentional bottom gaps and 121 mm local wipe breaks, no magnetic or parked catches. Final quotation pack matches model/print revisions and notes; STEP re-imports valid with 470 solids. Browser acceptance passed on the final geometry (5.7 minutes); the later source-only wipe-procurement correction was checked at three heights and leaves default model data identical except the fingerprint. Full `npm run check`: 165 backend tests passed (19m01s) before the final 20 mm mounting adjustment; the 33 affected backend cases passed afterward via scoped `npm run check` (6m47s). An additional final 4 mm driver-envelope test passed. Both check runs passed Ruff, 45 frontend tests, TypeScript and build. `npm test` passed 11 engineering + 45 frontend tests; explicit build passed. Evidence: `v3/artifacts/swing-latch/acceptance.json`, `final-quotation.zip` and logs. Physical print fit, friction/loosening, slot-nut engagement and gentle hand-pull/cycling remain outside digital acceptance.


- [ ] Physical fit, pivot friction/loosening, slot engagement and gentle hand-pull/cycling. See [design](docs/SWING_LATCHES.md).

## Bottom assembly removal — 2026-09-14

Current change — 2026-09-14: user requested removal from **both bifolds** of the bottom perimeter seals/backing and complete closed catches. The unsupported bottom rigid strips are removed with their backing. No GN4470 magnets, strikes, PETG holders or dedicated M5/M6 fixings remain in the active inventory, schedules or print exports. Vendor assets and prior sourcing studies are retained as history only. Both lower openings are now unsealed and closed-door retention is absent. Bottom containment obligations remain active; uncovered area must report failure. Four 88° travel stops and stock metalwork remain. No parked catches are reinstated.

- [x] Remove both complete bottom strip and closed-catch assemblies; preserve coverage obligations and document absent retention.
- [x] Removal validation superseded by the accepted swing-latch revision above; bottom gaps are now intentional by user choice.

## Stock-metal integration — 2026-09-14

- [x] Replace machined carriers with two single-solid 18 mm cuts of 80×40×6 S275JR angle; correct mounting-face seating, retain axle datums, model R7 roots and four nominal M6 root stacks.
- [x] Replace welded retention with 20×4 stock keepers, beveled ends and four bolted/notched 30×20×4 angles with R4 roots. Eight flush M4×40 end screws restore 3.1 mm nominal vertical clearance. Keep 52 ordinary M4×35 rail fixings separately scheduled.
- [x] Specify four closing tabs as 60 mm cuts from 50×4 steel flat stock with the existing two-hole mounting pattern. No structural PETG substitution.
- [x] Eight native pose checks, six dimension-extreme cases, nominal tool routes, mounting contact and retainer capture pass. Additional R4.5 root check preserves all eight keeper/angle contacts.
- [x] Production browser acceptance passes (2.3 minutes); half-open screenshot inspected. Live `7bd4c51b472f27b7`: 486 parts, 1,687 pass / 0 fail / 137 unknown. Two new unknowns are closed-end screw/brush overlaps; no earlier unknown suppressed.
- [x] Live quotation ZIP includes sourced installation notes and 26 revision-matched stock-metalwork rows; actual STEP re-imports valid with 502 solids.
- [x] Required checks complete: full backend run 158 pass / one obsolete ZIP-inventory assertion (17m18s); corrected export suite 9 pass and failed-case retry through `PYTEST_ADDOPTS=--lf npm run check` pass. Six additional dimension-extreme cases pass, covering all 165 current backend cases across these runs. Ruff, 44 frontend tests, TypeScript and production build pass; `npm test` also passes 11 engineering tests. Browser acceptance passes.
- [ ] Actual stock/slot-nut sections, small-quantity supply, grade/fastener/tolerance/brush and structural/impact acceptance remain open. See [current metalwork evidence](docs/STANDARD_METALWORK.md).

## Remaining metalwork investigation — 2026-09-14 (superseded by integration above)

- [x] Source standard steel angle and flat-bar routes for carrier, closing tabs and bolted rail ends; retain genuine Motedis plate/bracket CAD in the standalone study.
- [x] Native screen against `629b576e77187fd6`: eight poses, zero rigid clashes; flexible interactions remain. Straight-drop washer and end-barrier geometric witnesses pass; 11 engineering tests pass.
- [ ] Resolve the nominal 0.1 mm end-head/carrier vertical margin, stock radii, fastener/tool/tolerance stack, brush holder and load checks before integrating. Active geometry/BOM remains the previous revision. See [study and sourcing](../engineering/bifold-assembly/standard-metalwork/README.md).

## Standard bifold hardware — 2026-09-14

- [x] Replace custom leaf plates with sixteen bought CJP3030L drawing studies; preserve glazing and frame hinge stations, move interleaf end hinges 25 mm inward.
- [x] Integrate two genuine GN4470 A1/L2 closed kits on lower primary rails with four separate PETG adapters, nominal metal M5 fixings and M6 root screws. No parked retention.
- [x] Add native full magnetic-face coverage checks and broken-strike regressions; source dated hardware evidence and export separate print bodies.
- [x] Browser acceptance passes (5.0 minutes); half-open screenshot inspected. Live revision `629b576e77187fd6`: 476 parts, 1,657 pass / 0 fail / 135 unknown, incomplete.
- [x] Live quotation ZIP has two catch kits, sixteen CJP plates, four retained travel stops, no parked catch hardware; assembly STEP re-imports valid with 492 solids.
- [x] Both catch-holder STLs are watertight with quantity-two manifests matching the live revision: fixed 80 × 43 × 94 mm / 3,364 facets; moving 60 × 24 × 28.5 mm / 2,060 facets.
- [x] Seventeen focused hardware cases plus the tool-access test pass, including six dimension-extreme cases. `npm test`, `npm run check` and `npm run build` pass: 149 backend, 44 frontend and 11 root engineering tests. Final schedule/document-pack changes additionally pass native 80-stack motion/access audits, export inspection and browser acceptance.
- [ ] Nut STEP/engagement, final tolerances, actual force, racking, printed strength/creep and physical commissioning remain unvalidated. See [hardware evidence](docs/STANDARD_BIFOLD_HARDWARE.md).

## Simpler parking and reorganized notes — 2026-09-14

- [x] Remove parked magnets, four holders and eight dedicated M5 fixing
  assemblies from active inventory; remove parked-catch procurement and
  root fixing schedules. Retain four stops and four closed catch requirements.
- [x] Preserve downloaded CAD and study for reference, clearly superseded;
  active quotation packs omit holder STLs.
- [x] Move detailed sidebar hardware, sealing, glazing and containment notes
  into a new Design notes tab below the viewer. Keep operating controls and
  short sequence instructions in Open & close.
- [x] Root tests pass (11 engineering + 44 frontend), TypeScript/build and
  Ruff pass; three focused CAD-retention/removal tests pass after final wording.
- [x] Browser acceptance passes, including notes-tab access/switching, absent
  sidebar notes, retained sliders, removed catch meshes and articulated motion.
- [x] Live pack `simple-parking-export.gBZVVd/current-quotation-pack.zip`,
  revision `3097236c51b4424f`: 452 parts, four stops, four closed catch
  requirements, no parked catch geometry/fixing rows or holder prints.
  Report: 1,583 pass / 0 fail / 126 unknown; incomplete. Saved older packs
  remain historical artifacts and are not updated in place.
- [x] Full `npm run check` passes: 131 backend tests (14m01s), 44 frontend
  tests, Ruff lint/format, TypeScript and production build; only existing
  dependency deprecation warnings. Final-server browser recheck passes
  (2.2 minutes). Root `npm test` also passes 11 engineering tests.

## Offset parked-catch integration — 2026-09-14

- [x] Fit two complete GN4470 C2/L3 kits using intact vendor STEP, with
  four native ribbed PETG offset holders and eight nominal metal M5 fixing
  assemblies. Keep holder-to-profile M6 fixings explicitly schedule-only.
- [x] Orient the magnet's recessed screw heads outward; native geometry
  establishes the flat mounting back at source Y=-5.
- [x] Check all sixteen added parts against physical assembly solids at
  five opening fractions on both doors: no sampled penetration, 2 mm parked
  magnet/strike gap. Focused catch/completion suite: 21 passed.
- [x] Include two same-solid holder STL designs and revision-tagged manifests
  in the quotation ZIP, quantity two each, sized for the A1 mini.
- [x] Additional native screen at heights 650 and 1500 mm, closed/half/parked:
  no added catch-part penetration. This is sampled geometry, not release proof.
- [x] Rebuild/restart port 8000; browser acceptance passes (5.0 minutes),
  including supplier/holder inventory and articulated motion without CAD
  requests. Inspect updated half-open screenshot.
- [x] Live quotation export revision `5f3fc315dd0d1664`: 468 parts,
  1,631 pass / 0 fail / 127 unknown, incomplete and not released for order.
  Both STL meshes have every edge shared twice, bed minima (0,0,0), and
  quantity-two manifests matching the model/report revision: magnet holder
  2,460 facets, 61.5 × 33 × 64 mm; strike holder 2,352 facets,
  30.7591 × 33.1371 × 64 mm. Files are under
  `v3/artifacts/park-catch-export.X4rThO/printed-prototypes/`.
- [x] Root `npm test` (11 engineering + 44 frontend) and `npm run build` pass.
- [x] Full `npm run check` passes: 136 backend tests (14m49s), 44 frontend
  tests, Ruff lint/format, TypeScript and production build. Only existing
  dependency deprecation warnings. `git diff --check` clean. Additional live
  parked-position view: `v3/artifacts/parked-catches-overview.png`.
- [ ] Retention at the air gap, mounting tolerances, fastener engagement,
  PETG creep/strength and physical cycling remain unvalidated. Five sampled
  poses are not continuous-motion or manufacturing certification.

## Parked-catch CAD import — 2026-09-14

- [x] Receive correct GN 4470-50-C2-L3-SR STEP; import magnet and L3 strike
  unchanged, document source SHA and actual native dimensions in assets/GN4470.md.
- [x] Add isolated component loader and two passing native tests: variant,
  component dimensions, solid validity, source contact and invalid-key rejection.
  Focused Ruff lint/format pass. No active assembly or frontend change in this stage.
- [x] Terra real-solid mounting screen rejects the direct jamb/leaf layout:
  2.002 mm parked gap but magnet/strike collisions at four earlier poses,
  plus fixed-post collisions and misaligned strike mounting holes. Preserve
  the offset-holder design task; do not insert falsely fitted CAD.
- [x] Superseded by the offset-holder prototype integration above; the rejected
  direct mount remains excluded. Performance approval remains open.

## Printed parked-stop integration — 2026-09-14

- [x] Replace four prepared metal parked-stop brackets by native ribbed PETG
  prototypes; retain 88° pad contact and Ø6.5 / 30 mm mounting datums.
- [x] Model eight nominal metal washers and open washer/driver reliefs;
  preserve metal screws/slot nuts in the fixing schedule, not printed threads.
- [x] Add a bought 2 mm self-adhesive EPDM sheet candidate for four scissor-cut
  pads; no custom bumper machining. Adhesion/compression/wear remain unknown.
- [x] Add same-solid, bed-positioned STL and revision-tagged print manifest
  to the quotation ZIP; four identical bodies, no metal/pads in the STL.
- [x] Focused bifold suite passes (13 tests); after final face cleanup,
  print/export/washer and 88° contact tests pass again. Root tests pass
  (11 engineering + 44 frontend), production build and lint/format pass.
- [x] Live browser acceptance passes (4.9 minutes); inspect half-open screenshot
  with orange PETG stops. Export live ZIP and check matching revision
  `532cbc094157e432`: 452 parts, 1,583 pass / 0 fail / 126 unknown; incomplete.
- [x] Parse exported binary STL independently: 1,360 facets, every edge shared
  twice, lower bounds (0,0,0), upper bounds (39.4212,34.5537,60) mm. Manifest
  identifies four bodies and matches model/report revision. Files extracted
  under `v3/artifacts/park-stop-export.4zKhzT/printed-prototypes/`.
- [x] Full `npm run check` passes: 128 backend tests (12m58s), 44 frontend
  tests, Ruff lint/format, TypeScript and production build. Root `npm test`
  also passes the 11 standalone engineering tests. Only existing dependency
  deprecation warnings; `git diff --check` clean.
- [ ] Print/support trial, layer/impact strength, clamp creep, pad attachment
  and cycle life remain unvalidated. Gentle travel only, not a rated stop/latch.

## Retail meeting-seal simplification — 2026-09-14

- [x] Respect user sourcing constraint: remove six custom meeting clamp bars
  and sixteen M6 fixing sets; use two cut-to-length Tesa 05422 retail candidates.
- [x] Move wipes to secondary meeting stiles; restore direct frame mounting
  for primary handles. Preserve independent one-leaf motion and nominal seam
  coverage without modifying the existing coverage obligation.
- [x] Source 1 m × 38 mm stock and manufacturer PP/PU material specification.
  Record 688 mm default cuts, retail link and dated price. Explicitly retain
  unknown thickness, adhesive-band fit, slot bridging, preload and wear.
- [x] All 12 focused bifold tests pass, including five-pose seal/handle checks
  and a missing-seal mutation. Root `npm test` passes (11 engineering and
  44 frontend tests); `npm run build` passes.
- [x] CSV inspection at revision `e50ffddd2505df02`: 444 modeled parts,
  42 fixing rows, two retail wipe rows; no meeting clamps or handle lip stack.
- [x] Live-browser acceptance on port 8000 passes (4.7 minutes), including
  replacement mesh inventory, honest candidate note and articulated motion
  without CAD requests. Inspect updated half-open screenshot.
- [x] Full `npm run check` passes: 127 backend tests (12m23s), 44 frontend
  tests, Ruff lint/format, TypeScript and production build. Only existing
  dependency deprecation warnings. Live report: 1,559 pass / 0 fail /
  125 unknown, incomplete and not released for order.
- [ ] Confirm actual retail section, adhesive layout and repeated folding use;
  physical testing and commissioning remain excluded, not completed.

## Bifold digital completion — 2026-09-14

- [x] Preserve the bifold branch/worktree; no port back to the obsolete root app.
- [x] Model sixteen corner plates, one-piece metal carrier candidates,
  two-fixing closing tabs and four padded parked operating stops.
- [x] Replace four handles with explicitly drawing-based GHD9008B studies.
  GBL3030.KIT remains six installation requirements, not falsely fitted CAD.
- [x] Check new rigid hardware at five poses; lower the bottom rigid backing
  to remove the observed half-travel gusset interference. Park-pad contact and
  deliberately overshot primary leaf tests pass. Printed guide bodies remain
  connected after opening their thin mounting-bore webs.
- [x] Add UI fixing schedules, partial masses/moments and quotation supplement.
  Preserve missing hardware/load terms and retailer questions explicitly.
- [x] Replace inner head covers by exterior hoods without beam reliefs; add
  angled-brush study, connected-section checks and broken-connection mutations.
  Carrier/bristle deflection remains unknown, not cleared by a collision waiver.
- [x] Add one-sided meeting lips and six clamp segments around handle feet;
  check closed contact and full-open disengagement. Actual compound/preload pending.
- [x] Final browser acceptance passes in 4.7 minutes against port 8000;
  half-open screenshot inspected. Revision `12ad55cb055b475f`: 450 parts,
  1,577 pass / 0 fail / 125 unknown; status incomplete, not released for order.
- [x] Export the live quotation ZIP and inspect its supplement: six required
  catches, 48 fixing rows, matching revision/release status. Exported STEP
  re-imports as a valid shape with 446 solids; no fabrication release implied.
- [x] Final `make -C v3 check` passes: 127 backend tests, 44 frontend tests,
  Ruff lint/format, TypeScript and production build. Standalone engineering
  tests: 11 pass. Backend run 12m27s; only existing dependency deprecation warnings.
- [ ] Catch installation and actual seal/attachment selection remain unfinished.
  Supplier/physical acceptance is not implied by nominal geometry.
  See [completion details and retailer questions](docs/BIFOLD_COMPLETION.md).

## Metal underside retainer and rail end bars — 2026-09-14

- [x] Replace segmented printed keepers by four continuous 18 x 4 mm steel
  strips, with four welded end bars and relieved PETG ends. Add 60 metal
  sleeves and 60 header-slot bridge washers; recess washer seats in printed
  bodies and shorten alignment keys to clear them. These are custom nominal
  parts, not vendor STEP or released fabrication drawings.
- [x] Eight focused tests cover inventory, metal-stack contact, five normal
  door poses, straight-down washer capture and roller overtravel blocking.
- [x] Rebuild/restart port 8000; browser acceptance passes (3.9 min), half-open
  screenshot inspected. Live revision `b60346afb78193f2`: 420 parts, 1,427 pass,
  3 fail, 92 unknown. The same two head-coverage failures and containment
  requirement fail; no confirmed rigid collision witness. Brush overlaps
  remain unknown, not waived. UI describes retention and its evidence limits.
- [x] Full `make -C v3 check`: 115 backend tests, 44 frontend tests,
  lint/format, TypeScript checks and production build pass. Browser acceptance
  passes against the rebuilt app on port 8000.
- [ ] Validate custom parts, welds, thin printed webs, sleeve/washer fit,
  fasteners/slot nuts, impact, tilt/side escape and operating stops/catches.
  See [retention calculation and assembly notes](docs/RAIL_RETENTION.md).

## Slot-captured Lexan study — 2026-09-13

- [x] Download unchanged FSP vendor PDF; no public FSP08 STEP found. Keep
  drawing-based installed section explicitly distinct from vendor CAD.
- [x] Replace polycarbonate bifold surface beads with 16 mitred inserts, resize
  four 4 mm Lexan panels and expose provisional cuts/warnings in UI and CSV.
  Front doors and alternative bifold materials retain their prior mounting.
- [x] Calculate 40 K expansion reserve and cutting/positioning allowances;
  nominal default engagement 3 mm, reserve 2 mm per edge. Independent model
  checks for nominal expansion and assumed lip engagement pass by default.
- [x] Check actual profile/panel/insert intersections and mitred corners at
  closed, half and full opening. Browser acceptance passes on port 8000;
  inspected half-open screenshot. Live revision `eee51478e9462bb5`: 1,103 pass,
  3 fail, 85 unknown. Only the pre-existing two head-coverage failures and
  containment requirement fail; no confirmed collision witness remains.
- [x] Full `make -C v3 check`: 107 backend tests and 44 frontend tests pass,
  plus lint/format, TypeScript checking and production build. Focused browser
  acceptance passes against the live application in 3.1 minutes.
- [ ] Obtain actual gasket CAD and written Lexan compatibility (FSP08 is PVC),
  or choose a compatible alternative. Approve minimum engagement, corner seal,
  frame connectors and physical expansion/retention before ordering/cutting.
  See [source and calculations](backend/enclosure/assets/FSP.md).

## Real roller and centring bushes — 2026-09-13

- [x] Import user-supplied GN753.1 roller and GN753.2 bush STEP files unchanged,
  with provenance and asset fingerprints. Two rollers and four bushes now use
  native vendor solids, not simplified annuli.
- [x] Orient both bush collars into the roller bore; keep existing clamping
  faces/roller/carrier datums. Nominal tip gap is 1 mm. Focused kernel tests
  preserve volumes and contact and detect a deliberately reversed bush.
- [x] Restart/rebuild v3 on port 8000. Live API confirms six imported
  roller/bush instances; browser acceptance passes and half-open screenshot
  is inspected. Default report remains 1,311 pass, 3 fail, 84 unknown, with
  the same two head coverage failures and containment requirement failure.
- [x] Full validation: 98 backend tests, 44 frontend tests, 11 standalone
  engineering tests, lint/format, type checking and production build pass.
- [ ] Obtain spacer STEP and validate complete fastener/clamping/load/retention
  details. Real roller CAD does not make the printed assembly manufacturing-ready.

## Real bifold hinges — 2026-09-13

- [x] Replace both frame and interleaf placeholder wings with the supplied
  Elesa+Ganter CFG.30/30 SH-6-C33 STEP leaves and pins, without scaling or
  invented knuckles. Three hinges per joint, twelve complete hinges total.
- [x] Place real mounting planes and fixing centres against the extrusion
  faces/slot centres; rotate each leaf with its own frame/door and retain pin
  contact at five tested poses. Kernel tests check validity and no overlap.
- [x] Default report now has 1,311 pass, 3 fail, 84 unknown. The remaining
  failures are unchanged head sealing failures, not hinge solid interference.
- [x] Focused browser acceptance checks all 36 vendor component meshes and
  independent door animation. Half-open screenshot inspected. The initial cold
  native evaluation exceeded the old 120-second event timeout; the test now
  permits 300 seconds within its existing 600-second overall allowance.
- [x] Full validation: 95 backend tests, 44 frontend tests, 11 engineering
  tests, lint/format, type checking and production build pass. The native
  backend suite takes about eight minutes with the detailed hinge solids.
- [ ] Confirm fixing screw lengths, slot inserts, combined loads and tolerance
  allowances physically; STEP geometry alone does not approve the installation.

## Mechanical correction pass — 2026-09-13

- [x] Remove confirmed rigid clashes using supplier header relief, candidate
  CIB08T inner connectors, displaced rigid backing and relieved head covers.
- [x] Add drilled exterior carrier/axle shelf, lower axle stack and separate
  primary-leaf closed-stop tabs. All mounting/load details remain provisional.
- [x] Check board insertion to the centred work area, including the full board
  sweep; retain regression tests for approach and final-position obstructions.
- [x] Default report: 1,275 pass, 3 fail, 108 unknown. No confirmed collision
  witnesses; two head-cover coverage failures plus containment requirement fail.
- [x] Software checks: 90-test full backend suite plus the added PDF-coordinate
  regression (all 9 export tests pass), 44 frontend tests, 11 engineering tests,
  lint/format, type checking and production build. The focused revision C browser
  acceptance test passes on the restarted port-8000 service; screenshot inspected.
- [ ] Close head-cover relief/fastener leakage, validate brush deformation,
  detail parked stops/catches, and obtain supplier/physical connection evidence.

## Initial revision C integration — 2026-09-13 (history)

- [x] Replace ideal equal-link bifolds and overhead doglegs with rear-corner,
  unequal-link 88° mechanisms, a 750 mm rear opening, 682 mm default leaf height
  and 4 mm polycarbonate infills.
- [x] Model segmented A1 mini PETG guides, keeper strips/keys, bought roller,
  metal washer/axle/spacer and provisional carrier/hinge installation envelopes.
- [x] Use actual 3060 header sections; resize rear/left fixed panels and roof
  beams for the revised frame. Supplier header-corner joinery remains unresolved.
- [x] Publish mechanism datums to live browser animation; 30 pose parity cases
  are checked in both directions against a backend-generated fixture.
- [x] Use independent interval motion bounds, and retain unknown native-solver
  evidence rather than reusing the old equal-link proof.
- [x] Update quotation exports, including separate polycarbonate panel schedules.
- [x] Verify 83 backend tests (82-test full suite plus the new fixture-freshness
  regression), 44 frontend tests, 11 engineering tests, lint, formatting,
  frontend type checking and production build.
- [x] All four browser acceptance tests pass against the rebuilt v3 service
  on port 8000, including actual CAD/export flows and revision C live poses.
  Inspect `v3/artifacts/printed-bifold-v3.png` for the tested rendering.
  The default engineering report retains 19 failed checks and 53 unknowns;
  these are not software-test failures or manufacturing approval.
- [ ] Resolve header-to-header corner interference, corner bracket/door fit,
  board insertion conflicts, remaining motion contacts and head/meeting sealing.
- [ ] Detail full hinge/carrier/fastener/stop/catch installation and physical
  coupon, load, creep and dust-wear tests before any manufacturing release.

The checklist below records prior delivery history. The current prototype
intentionally reports `invalid` / **Design needs correction** where modeled
interference or missing barrier coverage is established. Software tests verify
that these failures are retained, not that the hardware is ready to build.

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

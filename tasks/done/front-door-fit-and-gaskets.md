# Fit the front doors inside the frame using the bifold components

## Description

Deliver basic inset front doors using the current bifold corner connections,
slot-captured infill arrangement and real CFG hinges, preserving loading access,
the completed bifolds and bottom Design notes tab.

## Discussion

Started from updated main at `bad45a3`, including final bifold PR #15, in the
`fix/front-inset-doors` branch and dedicated worktree. Inspected the backend,
CFG vendor STEP/datum notes, CJP/FSP drawing studies and latest bifold decisions.
The former purchase-ready gasket scope is superseded for this delivery by the
user's explicit instruction to keep gasket/material uncertainties visible.
Outstanding supplier/physical work is retained in
[front hardware and gasket validation](../todo/front-door-hardware-and-gasket-validation.md).

The profile front faces are Y=-24, 6 mm behind the frame front face. Real CFG
axes at Y=-38 connect via six 6 mm moving-wing spacers. Eight CJP3030L door
plates and four fixed-frame plates replace the obsolete front connection
arrangement; the latter remove aperture-intruding angle brackets. Default
jamb/meeting gaps are 5 mm, top/bottom gaps 4 mm. No fixed centre post is added.

The full-model check also caught the top closing strip/backing touching the
existing 3060 left header. Both now start 18 mm from the opening edge, leaving
3 mm nominal header clearance. Fixed front additions are included in the
expanded native-solid regression. Seal envelopes occupy the aperture side of
the backing; remaining deflection against corner plates is explicitly unknown.
Perimeter and meeting corner coverage remains a failure until real returns
and products are designed, rather than being silently waived.

The right-hand meeting strip closes last. Its 10 mm offset onto the owning
stile corrects an actual first-degree collision with the left handle found by
native-solid sweep sampling. Open right fully, then left; close in reverse.
Travel is 100° per door. Handles and hinge barrels project; door profiles,
infill and meeting strip sit behind the structural front face.

Default 6 mm front glass is captured by a thickness-adapted, unselected slot
holder study; FSP08 is not assigned to 6 mm glass. Front cuts are provisionally
775.5 × 678 × 6 mm (two). Actual holder compound/section, glass setting support,
wood moisture movement and physical retention are unresolved. More than 6 mm
front infill fails the thickness check. The existing bifold PVC/Lexan uncertainty
is preserved. All 312 bifold component records compare equal to updated main.

See [front-door design](../../v3/docs/FRONT_DOORS.md) for datums, quantities,
installation details and verification limits. Existing right-side airflow
requirements remain tracked in [the airflow task](../todo/right-side-airflow-and-filtration.md).

The full-model report passes both inset checks and the continuous loading prism
for a 1219.2 × 1219.2 × 100 mm board at Z=600. Its 61,040 moving pairs contain
60,699 bounded-clear/rigid-invariant cases, zero collision witnesses and 341
unknown interval/contact cases. The only failures are the five front perimeter/
meeting coverage checks and their containment requirement. They remain visible
because actual corner returns and seal installation have not been established.
The running review server at http://127.0.0.1:8000 is warmed on revision
`13f77b1cffb053a5`. Its actual HTTP supplier CSV confirms 28 CJP plates,
18 complete CFG hinges, six front spacers, 676 mm jamb stops and 1646 mm top
stop. Unselected front holder entries and `NOT RELEASED` status are retained.
Browser captures were inspected for open/closed fit and the bottom Design notes.

Final validation — 2026-09-15:

- Backend: **181 passed** in 629.52 s, using
  `uv run --with pytest-xdist==3.8.0 pytest -n 6 -v --junitxml=/tmp/front-tests-final.xml`
  from `v3/`. The complete suite ran with an ephemeral test-worker dependency;
  project dependencies were not changed. Twelve upstream Starlette/AnyIO
  deprecation warnings; no failures or errors.
- Frontend: **45 tests passed**, `npm run check` and `npm run build` passed.
- Browser: **2 passed**, `front-doors.spec.ts` and `printed-bifold.spec.ts`,
  against the actual local service. Opening/closing interlocks, no CAD requests
  during pose changes, preserved bifolds and bottom notes verified.
- Native solids: front infill/holder fit; expanded fixed-front collision checks;
  every degree of both front opening stages and their reverse closing paths.
- Actual HTTP CSV, revision matching, supplier quantities/cuts and unreleased
  status checked. Full backend suite includes real supplier ZIP/PDF/STEP checks.
- Changed Python files pass Ruff; Markdown links and `git diff --check` pass.
- Delivered through [PR #17](https://github.com/wimpheling/workbench/pull/17).
  Server remains running for review; no merge to main is performed.

## Implementation plan

- [x] Establish and implement the inset arrangement
  - [x] Define profile/hinge datums, spacer geometry, gaps and corner connections
  - [x] Adapt slot-holder geometry and cuts to front material/thickness
  - [x] Preserve the bifold component records and bottom Design notes tab
  - [x] Preserve a centre-post-free loading opening and enforce closing order
- [x] Record unresolved supplier and physical evidence explicitly
  - [x] Retain product, compound, engagement, setting-support and moisture uncertainties
  - [x] Document rear closing strips, backing, corner/end support, fixings and unvalidated preload
  - [x] Carry fabrication and gasket selection obligations into the linked follow-up task
- [x] Verify and deliver the change
  - [x] Check closed native-solid fit and infill/holder contact against vendor extrusion slots
  - [x] Sample complete staged opening and reverse closing paths at every degree, correcting the first-degree handle collision
  - [x] Record final continuous-motion and loading-prism results, including unresolved bounds
  - [x] Run full backend and frontend checks plus browser verification
  - [x] Update supplier schedules and Design notes, publish PR and leave server running

## Open questions / blockers

- [x] Inset/hinge arrangement: six CFG hinges and 6 mm moving-wing spacers, 100° modeled travel; physical loading/sag remains in follow-up
- [x] No centre post: the offset right-door meeting strip carries the overlap; right opens first and closes last
- [x] Exact gasket, latch force and adjustment: unresolved, not claimed verified; retained in the linked supplier/physical validation task
- [x] Continuous bounds versus samples: one-degree solid sampling is additional evidence, not a proof between samples; unknown interval cases remain visible

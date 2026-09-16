# Four millimetre glass and front seal junctions

## Description

Continue PR #17: use 4 mm for all glass and resolve the five nominal front
perimeter/meeting coverage failures without a centre post or bifold changes.

## Discussion

The user confirmed 4 mm as the intended glass target and requested resolution
of seal corner/end coverage. Continue the existing dedicated branch/worktree.
Preserve gasket compound, compression, glass support and physical validation
uncertainties. Retain full coverage obligations and check actual added solids.

Glass now defaults to 4 mm, including alternate glass bifold selections; default
4 mm polycarbonate bifolds remain unchanged. Front FSP08 is a candidate within
the documented 3–5 mm range, with glass setting support/retention unapproved.

Jamb strips retain relieved inner support tongues; head/sill strips connect
around the corners. Installed gasket roots are relieved around actual fixed
metal and bonded at their butt joints. Two flexible L-shaped head/sill boots
connect the exterior meeting strip to the rear gasket, without a centre post.
A separate 4.5 × 12 mm foam plug closes the exposed header channel. An initial
boolean gasket study left an isolated fragment in that channel; the final model
removes disconnected fragments and schedules an explicit, insertable plug.

All seven nominal sections across the five original front seam obligations and
25 connection checks pass locally. Minimum/maximum dimension and clearance
settings, support tongues, broken-seal mutations and actual plug fit are tested.
The seam still spans 0…H with the original 2 mm overlap and 1 mm opposing cut
allowance. The final HTTP-served model, revision `0a548259ccad9236`, reports
1675 pass, zero fail and 122 unknown checks (`incomplete`, not order-ready).
Continuous motion has 61,840 pairs: 61,479 resolved, zero collision witnesses
and 361 unresolved bounds/contact cases. Both inset checks and the full board
insertion prism pass. The actual HTTP supplier CSV confirms 4 mm glass,
24 FSP08 candidates, 720 mm jamb strips, 1674 mm head/sill strips, end boots,
the 12 mm header plug and `NOT RELEASED` status. All 312 bifold component records compare unchanged against the
previous front-door delivery (which preserved updated-main bifolds).

Backend validation: **187 tests passed**, 12 upstream Starlette/AnyIO deprecation
warnings, no failures/errors; 741.64 seconds. Command from `v3/`:
`uv run --with pytest-xdist==3.8.0 pytest -n 6 -v --junitxml=/tmp/front-seal-final-tests.xml`.
Ephemeral test workers; no dependency-file changes.

Frontend validation: 45 tests passed, plus type checking and production build.
Both real-browser tests passed in 4.6 minutes using the running server: front
sequence, glass cuts, report coverage, client-only animation and preserved
bifold controls/Design notes. Open, closed and notes captures were inspected.
Ruff and local Markdown link/whitespace checks passed.

Delivered through [PR #17](https://github.com/wimpheling/workbench/pull/17),
unmerged. Review server remains running at http://127.0.0.1:8000 on final
revision `0a548259ccad9236`. Physical/supplier approval remains in the linked
follow-up task; no order release or physical sealing proof is claimed.

## Implementation plan

- [x] Set the glass target and update holder specifications and schedules
- [x] Design supported corner returns and meeting-end junctions
- [x] Verify coverage, connections, mutation sensitivity and full rigid sweeps
- [x] Run backend/frontend checks and browser verification
- [x] Update Design notes and PR #17; leave the review server running

## Open questions / blockers

- [x] Physical material/hardware approval remains in [the validation task](../todo/enclosure-detailed-validation.md); this task resolves nominal geometry only.

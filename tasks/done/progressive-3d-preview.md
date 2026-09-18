# Load the 3D preview before verification

## Description

Show current geometry while engineering verification runs, on initial load and parameter edits.

## Discussion

Use the existing geometry-only endpoint before requesting verification. Preserve cancellation and stale-result protection; exports require a matching completed report. Geometry construction still takes time and native CAD requests remain serialized.

Validation: 45 frontend tests, TypeScript check and production build pass. Four
browser tests pass, including real CAD geometry displayed with verification
held pending, door interaction, export gating, mode cancellation, failure and
revision mismatch handling. The real-report test completes successfully after
verification and preserves the selected door pose. No backend or API changes.

## Implementation plan

- [x] Publish preview before verification starts
- [x] Keep preview available on verification failure and reject stale results
- [x] Run frontend checks and browser regressions

## Open questions / blockers

- [x] No API change required; use existing preview and evaluation endpoints

# Retire the superseded root application

## Description

Remove root `src/` and its tooling now that v3 is the active product.

## Discussion

The user confirmed removal after dependency inspection found v3 independent
of root src. Keep v3/frontend/src, supplier assets, and legacy history.
Root commands now run v3, and contributor documentation identifies its
Python model as the source of truth. The front-door task remains separate.

Verification: `npm test` passed (14 frontend tests, 76 backend tests);
`npm run check` passed (TypeScript, Ruff lint and format); `npm run build`
passed. Backend tests reported two dependency deprecation warnings.
`git diff --check` passed.

## Implementation plan

- [x] Remove the superseded source and exclusive build configuration
- [x] Route root commands to v3 and update documentation
- [x] Run npm test, npm run check, and npm run build; record results

## Open questions / blockers

- [x] v3 uses its own backend, frontend, and supplier assets; no root src dependency found.

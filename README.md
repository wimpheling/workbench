# Workbench

Workbench is a browser-based, parametric EnclosureV2 workbench built with Vite Plus, SolidJS, Three.js, and Replicad/OpenCascade.

## Architecture

- `src/domain/`: typed IDs, units, frames/anchors, EnclosureV2 model, catalogs, configurations, connections, panels, and manufacturing report/cut-plan generation.
- `src/validation/`: deterministic constraints, kinematics, motion-envelope sampling, fit policies, Replicad solid checks, and structured reports.
- `src/rendering/`: declarative-model to Three.js scene adapter and viewer.
- `src/exports.ts`: JSON, CSV BOM/cut-list, and simple SVG drawing exports.
- `src/ui/`: SolidJS authoring controls, validation display, viewer, and downloads.
- `legacy/`: the historical renderer-facing application; it is not the active product path.

The active model uses millimetres internally. Its canonical inputs are named `innerClearWidthMm`, `innerClearHeightMm`, and `innerClearDepthMm`; compatibility adapters convert older dimension records at the boundary. EnclosureV2 dimensions are parameters, not golden test values.

## Commands

```sh
npm ci
npm run dev
npm test
npm run check
npm run build
npm run validate:workflows
```

The quality suite currently covers 31 test files / 154 tests. Build output is `dist/`.

## Current limits

The manufacturing report currently covers the aluminium frame and extrusion cut planning, with profile-catalog stock lengths and estimate rates. Hardware, panel cut records, full vendor catalogs, complete project-wide collision evaluation, continuous-motion proof, PDF production, and browser smoke tests are not yet implemented. The viewer applies EnclosureV2 door motion through generic assembly and motion records.

Frame3DD is an optional external structural sidecar. The code can serialize inputs, parse saved results, and return an explicit `unavailable` diagnostic; Frame3DD is not installed or configured locally and is never required for rendering, ordinary validation, or exports. It is simplified screening, not engineering certification.

Known non-blocking build warnings include Replicad `fs`/`path`/`crypto` browser externalization and a large WASM/JavaScript bundle.

## GitHub Pages

`.github/workflows/pages.yml` deploys `dist/` from `main` (or manual dispatch) using GitHub Actions. Run `npm run validate:workflows` locally to check its contract. Repository Pages settings, environment approval, and the remote deployment URL require authenticated GitHub access and cannot be verified from this checkout.

See `CAD_ROADMAP.md` for the audited implemented scope, remaining plan, and explicit blockers.

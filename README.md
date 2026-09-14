# Workbench

A parametric enclosure planning application for a Shapeoko 5 Pro 4×4.
The active application lives in `v3/`:

- `v3/backend/enclosure/`: Python/CadQuery model, geometry verification, HTTP API, and supplier exports.
- `v3/frontend/src/`: SolidJS/Three.js interface consuming the backend model.
- `legacy/`: archived renderer history.

The Python model is the source of truth. Dimensions are millimetres:
X right, Y toward the back, Z up. The superseded root `src/` application
was removed; its history remains in Git.

## Setup and run

Install Node.js/npm, uv, and make. From the repository root:

```sh
npm run setup
npm run dev
```

Open http://127.0.0.1:8000. This builds the frontend and starts the native
CAD backend. For frontend hot reload, also run `npm run dev:frontend` and
open http://127.0.0.1:5173. A static frontend alone cannot evaluate CAD.

## Verification and exports

```sh
npm test
npm run check
npm run build
npm run export
```

Root npm scripts delegate to v3; dependencies are locked in `v3/uv.lock`
and `v3/frontend/package-lock.json`. Build output is `v3/frontend/dist/`;
quotation packs are generated under `v3/artifacts/`.

See [v3 documentation](v3/README.md) for model limitations, supplier
requirements, browser tests, and additional commands. `CAD_ROADMAP.md`
and `DOOR_CLEARANCES.md` describe the retired EnclosureV2 application.

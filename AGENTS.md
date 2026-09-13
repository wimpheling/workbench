# Workbench contributor notes

The active product is `v3/`: Python/CadQuery in `v3/backend/` is the geometry
and engineering authority; SolidJS/Three.js in `v3/frontend/` renders the
evaluated model. Use millimetres internally. Read `v3/README.md` for setup
and `v3/docs/CONTRACT.md` for the model contract.

Before handoff, run the relevant backend and frontend checks. `make -C v3 check`
runs backend lint, formatting and tests plus frontend tests, type checking
and production build. Run browser acceptance tests for UI/motion changes.

`engineering/` contains standalone, unreleased design studies and prototype
parts. They are not integrated into v3 unless explicitly wired into its model.
Run `npm run test:engineering` when changing these calculations.

Track task progress according to `tasks/AGENTS.md`. Preserve explicit unknowns
and prototype status; geometric checks are not manufacturing certification.

# Workbench contributor notes

The active product is the Vite Plus/SolidJS application under `src/`. Its
EnclosureV2 domain model is the source of truth; keep rendering as an adapter
over the evaluated model and use millimetres internally.

`legacy/` is archived renderer history. Do not add product features there.
Only its retained EnclosureV2 snapshot remains for historical reference.

Before handoff, run `npm test`, `npm run check`, and `npm run build` for active
model, rendering, or UI changes.

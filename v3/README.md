# Workbench V3

An enclosure planning application for a Shapeoko 5 Pro 4×4 in a Lisbon workshop. The enclosure has two full-width front swinging doors, a bifold door in the rear half of the left wall, a bifold door in the right half of the back wall, wood wall/roof panels and a roof hose penetration. Reiman Portugal is the selected aluminium supplier.

**This is an engineering verification workbench, not a released fabrication design.** It generates usable quotation documents and evaluates actual geometry, but supplier hinge/mounting details, machine/hose dimensions and physical tolerances still require evidence. Reports and every ordering pack preserve those unresolved requirements. Do not order tempered glass from a pack marked `NOT RELEASED FOR ORDER`.

The existing application remains outside this folder, unchanged. V3 uses native Python/CadQuery/OpenCascade as its geometry authority and a SolidJS/Three.js interface. No cloud account is required; run it locally. A static Pages site cannot perform native CAD evaluations.

## Run

Prerequisites: [uv](https://docs.astral.sh/uv/), Python 3.12 (uv can install it), and Node.js with npm. Dependencies are locked in `uv.lock` and `frontend/package-lock.json`.

From the repository root:

```sh
cd v3
uv sync --locked
cd frontend
npm ci
npm run build
cd ..
uv run uvicorn enclosure.service:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000**. The first evaluation loads the CAD kernel and supplier assets and takes longer than a pose update. Native kernel operations are serialized; a small revision cache avoids repeating full verification while opening doors.

For frontend development, start the Python service and run `npm run dev` in `v3/frontend`. Vite serves **http://127.0.0.1:5173** and proxies `/api` to port 8000.

## Use

1. Set clear internal dimensions. Defaults start at 1674 × 1649 × 740 mm (width × depth × height).
2. Choose front and bifold infill materials. Front glass and bifold wood are initial selections, not confirmed glass specifications.
3. Inspect the model, hide roof/walls, and open each door independently. Reference envelopes can be shown separately.
4. Read failures and unresolved evidence. A successful constraint solve is only one piece of evidence; it does not imply clearance or order readiness.
5. Export a supplier quotation pack for review. All dimensions, geometry and evidence share one design revision. Changing parameters invalidates the previous export selection until evaluation finishes.

Coordinate convention: X right, Y toward the rear, Z up; front wall at Y=0; all lengths are millimetres. Clear dimensions exclude the surrounding frame. The machine and hose envelopes are configurable **unconfirmed assumptions**, not specifications silently substituted from the newer Shapeoko 5.1.

## Supplier files

The ZIP pack includes:

- `reiman-extrusions.csv`: individual part IDs, Wolweiss references, finished cut lengths, quantities, requested cutting tolerance and pending machining.
- `glass-panels.csv`, `wood-panels.csv`, `hardware.csv`: supplier-specific schedules. Hardware without a selected product stays visibly pending.
- `supplier-drawings.pdf`: dimensioned local part outlines, cutting/processing notes, revision, release status, unresolved checks and assembly guidance.
- `panel-outlines.dxf`: closed panel outlines at 1:1 in millimetres, declared holes on a separate layer, annotations outside cut geometry. Outlines are arranged side by side, not a sheet nesting/toolpath plan.
- `assembly.step`: closed physical assembly built from the same authoritative solids used for meshes and verification. Provisional hardware envelopes are identified in the model; they are not hardware manufacturing drawings.
- `model.json`, `verification.json`, `README.txt`: complete evaluated parameters, parts, provenance, evidence and installation checks.

The supplier should confirm cutting tolerance, finishing, connector installation requirements and all glass processing before release. Tempered-glass holes/cutouts and edge treatment must be specified before tempering. No field glass cutting/drilling is included. Downloads are local; the application never sends orders or messages to suppliers.

Headless export:

```sh
cd v3
uv run python -m enclosure.cli --out artifacts --format pack
uv run python -m enclosure.cli --parameters my-dimensions.json --out artifacts --format pdf
uv run python -m enclosure.cli --out artifacts --require-order-ready
```

The final command still writes a traceable pack but exits with code 2 when evidence does not permit ordering. Ordinary quotation exports remain available for invalid/incomplete designs, with their status prominently marked.

## What verification means

- **Integrity:** required inventory and obligations cannot disappear; missing identities, invalid transforms and unresolved references are diagnosed.
- **Assembly:** transformed joint datums are independently measured. Native CadQuery constraints independently solve an ideal bifold axis configuration; solver output residuals are checked.
- **Solids:** supplier profile sections are extruded to length. Closed-pose pair checking uses conservative broad-phase separation and OpenCascade intersections. Zero clearance still prohibits penetration. Every physical pair is accounted for.
- **Motion:** analytic trigonometric corner extrema bound the modeled mechanism through intervals, including independent door combinations. Ambiguous intervals are subdivided within a stated budget; remaining overlap of bounds is **unknown**, never a proof of collision freedom. These are floating-point engineering bounds with stated numeric margins, not formally verified arithmetic.
- **Tolerance/access:** checks include a declared cutting-error margin and a swept workpiece loading prism. Mounting adjustment, sag, squareness and supplier thickness tolerance need additional confirmed allowances.
- **Evidence:** pass / fail / unknown remain separate. Any failed requirement yields `invalid`; unresolved evidence yields `incomplete`. Ready-to-order requires all relevant evidence and no unresolved ordering items.

Geometric verification does not certify glass impact containment, structural capacity, acoustic performance or flexible-hose behaviour. Those limitations remain explicit. See [tracking](TRACKING.md), [implementation contract](docs/CONTRACT.md) and [sources](docs/SOURCES.md).

## Test

```sh
cd v3
uv run pytest
cd frontend
npm test
npm run check
npm run build
```

Browser acceptance instructions and results are recorded in `TRACKING.md`. Backend tests include real kernel operations, broken-model mutations and independent parsing of DXF/STEP supplier outputs. Browser tests exercise the actual HTTP service rather than a fabricated scene response.

## Layout

```text
backend/enclosure/core.py          Parametric physical inventory and poses
backend/enclosure/profiles.py      Supplier STEP sections and catalogue geometry
backend/enclosure/constraints.py   Native assembly constraint solve
backend/enclosure/verification.py  Independent evidence and motion bounds
backend/enclosure/exports.py       Supplier documents and geometry exports
backend/enclosure/service.py       Local HTTP interface
backend/enclosure/cli.py           Headless evaluation/export
backend/tests/                    Engineering and HTTP regression tests
frontend/                         SolidJS / Three.js browser application
docs/                             Contract, sources and review notes
```

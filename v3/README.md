# Workbench V3

An enclosure planning application for a Shapeoko 5 Pro 4×4 in a Lisbon workshop. The enclosure has two full-width front swinging doors, a bifold door in the rear half of the left wall, an asymmetric bifold opening at the right of the back wall, wood wall/roof panels and a roof hose penetration. Reiman Portugal is the selected aluminium supplier.

**This is an engineering verification workbench, not a released fabrication design.** It generates usable quotation documents and evaluates actual geometry, but supplier hinge/mounting details, machine/hose dimensions and physical tolerances still require evidence. Reports and every ordering pack preserve those unresolved requirements. Do not order tempered glass from a pack marked `NOT RELEASED FOR ORDER`.

V3 is the active application. The old root EnclosureV2 application and archived renderer have been removed; their history remains in Git. V3 uses native Python/CadQuery/OpenCascade as its geometry authority and a SolidJS/Three.js interface. No cloud account is required; run it locally. A static Pages site cannot perform native CAD evaluations.

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
2. Choose front and bifold infill materials. Front glass remains provisional; bifolds default to 4 mm polycarbonate.
3. Inspect the model, hide roof/walls, and open each door independently. Reference envelopes can be shown separately.
4. Leave **Automatic verification** enabled to evaluate changes, or turn it off to update geometry previews only. Use **Verify now** when ready. Previews have no current engineering report and cannot enable exports; a prior report is hidden when its settings no longer match.
5. Read failures and unresolved evidence. A successful constraint solve is only one piece of evidence; it does not imply clearance or order readiness.
6. Export a supplier quotation pack for review. All dimensions, geometry and evidence share one design revision. Changing parameters invalidates the previous export selection until evaluation finishes.

Door sliders and the **Play opening / Play closing** controls animate the canonical CAD meshes in the browser. Motion uses the `model.doors` kinematics and each part's `motion_leaf` metadata, so pose frames do not call the native CAD service or verification endpoint. The right front leaf opens before the left; closing reverses that order. Changing dimensions/materials, switching verification mode or starting a manual verification cancels playback cleanly. A parameter edit with Automatic verification off still requests a geometry-only `/api/preview`; pose-only changes do not.

Coordinate convention: X right, Y toward the rear, Z up; front wall at Y=0; all lengths are millimetres. Clear dimensions exclude the surrounding frame. The machine and hose envelopes are configurable **unconfirmed assumptions**, not specifications silently substituted from the newer Shapeoko 5.1.

## Door seals and airflow

The current [bifold completion notes](docs/BIFOLD_COMPLETION.md) describe
inward-face corner plates, the one-piece metal carrier, two-fixing closing
tabs and 88° parked stops. GHD9008B handles are drawing studies; six
GBL3030.KIT catches remain explicit installation requirements, not fitted CAD.
The UI and quotation pack expose fixing schedules and partial load screening.

Exterior head hoods replace the relieved inner covers. Their angled brush
studies close the nominal head sections, but carrier deflection and actual
brush/holder selection remain unvalidated. Meeting seals are now one-sided
clamped wipe lips that disengage during opening, not stretching membranes.

The bifold guide now has a proposed removable steel underside retainer: two
continuous 18 x 4 mm strips, a 10 mm axle slot and welded end bars. Metal
compression sleeves and bridge washers bypass PETG in the mounting clamp path.
These are custom prepared parts, not sourced vendor STEP or rated safety
hardware. See [rail retention details](docs/RAIL_RETENTION.md) for cut sizes,
clearances, assembly procedure and the remaining physical validation.

The 4 mm polycarbonate bifolds now use a slot-captured **FSP08 study** instead
of the surface beads described below for front/alternative-material doors.
The 16 inserts use a downloaded vendor PDF, not vendor STEP. Revised panel cuts
and a 40 K expansion allowance are shown in the UI and quotation schedules.
FSP08 is PVC: Lexan compound compatibility is **not confirmed**; corners,
minimum engagement and frame-connector interference require approval before
cutting. See [provenance and calculations](backend/enclosure/assets/FSP.md).

Front/alternative-material infills have retaining beads, edge seals and face packing; the 4 mm Lexan bifolds use the slot study above. Fixed wood panels overlap the frame borders and sit against continuous gaskets. Bifold head coverage is nominally closed by exterior hoods and angled-brush studies; physical brush/carrier deflection remains unvalidated. The right front leaf carries the overlapping meeting strip: **open right fully, then left; close left fully, then right**. The model rejects incompatible poses and the UI locks the corresponding controls. Bifold meeting lips clamp to one leaf and disengage from the other; animation does not simulate rubber deformation.

The right wall has a supplier-cut 240 × 80 mm makeup-air opening and a cleanable external hood with staggered baffles. At default dimensions its minimum nominal passage is 16,632 mm², slightly over twice the 100 mm hose cross-sectional area. The area ratio is a design allowance, not an airflow-performance claim. Increasing hose diameter can require a larger inlet. Air enters passively; extraction is through the dust shoe and roof hose, with the vacuum and its exhaust outside the enclosure. The roof has an annular collar/gasket; the base gasket requires a flat, continuous supporting table.

Verification measures nominal barrier sections, their specified connections and inlet passages. Supplier seal grade, free section, installed compression, glass setting support, attachment details and wipe-lip preload remain unresolved. An assembled test must establish inward leakage, sufficient extraction and cooling with the actual vacuum, hose, shoe and filter. The model does not certify a completely sealed boundary or fine-dust capture.

Bifolds use the revision C A1 mini PETG guide prototype under continuous 3060 headers: unequal leaves, rear-corner parking, 88° travel and a default 750 mm rear opening. The default leaf height is 682 mm. Five modules per opening carry a bought GN753.1 roller and metal washer/axle; CFG hinges support the leaves. The metal carrier, corner plates, closed tabs and parked operating stops are modeled. Their capacity, catch installation, final fasteners, head sealing and physical load/wear performance remain unconfirmed. See [engineering model](docs/ENGINEERING_MODEL.md).

## Supplier files

The ZIP pack includes:

- `reiman-extrusions.csv`: individual part IDs, Wolweiss references, finished cut lengths, quantities, requested cutting tolerance and pending machining.
- `glass-panels.csv`, `wood-panels.csv`, `polycarbonate-panels.csv`, `hardware.csv`: supplier-specific schedules. Hardware without a selected product stays visibly pending.
- CSV schedules distinguish finished cutting dimensions from nominal component envelopes and preserve any proposed seal section/compression specifications. Hardware envelope dimensions are not instructions to manufacture a supplier component.
- `supplier-drawings.pdf`: dimensioned local part outlines, cutting/processing notes, revision, release status, unresolved checks and assembly guidance.
- `panel-outlines.dxf`: closed panel outlines at 1:1 in millimetres, declared holes on a separate layer, annotations outside cut geometry. Outlines are arranged side by side, not a sheet nesting/toolpath plan.
- `assembly.step`: closed physical assembly built from the same authoritative solids used for meshes and verification. Provisional hardware envelopes are identified in the model; they are not hardware manufacturing drawings.
- `model.json`, `verification.json`, `README.txt`: complete evaluated parameters, parts, provenance, evidence and installation checks.
- `bifold-completion.json`: required-but-unfitted catches, proposed fixing schedules and partial load calculations with exclusions.
- `containment-and-airflow.txt`: door sequence, seal-selection requests, inlet dimensions and installation/commissioning requirements, also included in the PDF.

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
- **Assembly:** transformed joint datums are independently measured. Offset-link closure is checked against explicit datums; the older native equal-link solver is not claimed as proof of the revision C mechanism.
- **Solids:** supplier profile sections are extruded to length. Closed-pose pair checking uses conservative broad-phase separation and OpenCascade intersections. Zero clearance still prohibits penetration. Every physical pair is accounted for.
- **Motion:** analytic trigonometric corner extrema bound the modeled mechanism through intervals, including independent door combinations. Ambiguous intervals are subdivided within a stated budget; remaining overlap of bounds is **unknown**, never a proof of collision freedom. These are floating-point engineering bounds with stated numeric margins, not formally verified arithmetic.
- **Tolerance/access:** checks include a declared cutting-error margin and a swept workpiece loading prism. Mounting adjustment, sag, squareness and supplier thickness tolerance need additional confirmed allowances.
- **Containment/airflow:** actual solid subtraction checks required seam regions with overlap/cutting allowance and independently derived infill gaps. Annular hose coverage, the wall cutout, baffle passages and straight opening-to-exit paths are checked separately. Missing, shifted, shortened or perforated barriers cannot pass through an unchanged part name or bounding box. Local geometric certificates do not establish complete boundary sealing or physical rubber performance.
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

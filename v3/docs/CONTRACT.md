# V3 implementation contract

All active implementation lives in `v3/`. Coordinates and lengths are millimetres: X right, Y toward the back, Z up; front is Y=0.

Revision C bifolds add `mechanism: printed-guide-revision-c`, primary/secondary
link vectors, `guide_normal_mm`, unequal leaf widths, a guide-module plan and
explicit prototype status to each door. `back_opening_width_mm` defaults to
750 mm (supported range 650–800 mm); bifold material defaults to 4 mm
polycarbonate. Published vectors drive both backend and frontend poses. The
old native equal-link constraint solver is not evidence for this mechanism.
Keep real header-corner, access and sealing failures visible in the report.

Python package: `v3/backend/enclosure`. Core API: `build_model(parameters: dict | None = None) -> dict`, `build_shapes(model: dict, pose: dict | None = None) -> dict[str, cadquery.Shape]`, `default_parameters() -> dict`. Core owns `core.py` and geometry/kinematic helpers. Verification owns `verification.py`: `verify(model: dict, shapes: dict | None = None) -> dict`. Supervisor owns service and supplier exports. Frontend consumes HTTP JSON.

Model JSON contract (extend compatibly, communicate additions):

- `revision`: content hash of full inputs/catalog/verification-relevant definitions; `units`: `mm`.
- `parameters`: validated explicit inputs. Required defaults: `width_mm=1674`, `depth_mm=1649`, `height_mm=740`, `panel_thickness_mm=6`, `glass_thickness_mm=6`, `clearance_mm=4`, `cut_tolerance_mm=0.5`, `workpiece_width_mm=1219.2`, `workpiece_depth_mm=1219.2`, `workpiece_thickness_mm=100`. Machine/hose dimensions are assumptions with confirmation status, never silently verified manufacturer facts.
- `parts`: list of `{id, name, category, material, supplier, product_code, size:[x,y,z], position:[x,y,z], rotation_deg:0, assembly, geometry_fidelity, quantity:1, ...}`. Size is a local box envelope; position is its centre; rotation about world Z. Categories: extrusion, panel, glass, hardware, machine-envelope, hose-envelope. Physical modeled hardware may be conservative bounding solids explicitly labeled. Nonphysical clearance reference envelopes must be identified separately. Include all required physical items or record unresolved items as requirements.
- `joints`: named part IDs and local mating features / expected contact policy, never arbitrary global collision exclusions.
- `doors`: front-left, front-right, left-rear, back-right; motion definitions and exact part membership, pivots, hinge datums and allowed range. Two front swinging leaves, two exterior bifold assemblies. Core publishes `pose_model(model, pose)` returning model with updated part transforms; build_shapes uses it. Pose dictionary maps door ID to opening fraction [0,1].
- `requirements`: list with stable `id`, `description`, `category`, `references`; expected checks cannot disappear with geometry.
- `assumptions`: list with stable `id`, `description`, `confirmed` boolean, `references`.
- `ordering`: supplier interfaces and unresolved manufacturing facts retained explicitly.

Verification JSON: `{status: valid|invalid|incomplete, revision, checks:[{id,status:pass|fail|unknown,category,message,references, measured?,required?,unit?,method?,...}], summary:{pass,fail,unknown}, coverage:{...}, order_ready:boolean}`. No missing evidence or violating requirement becomes a pass. Geometry only means geometry, not load certification. `order_ready` requires all necessary evidence; export request-for-quotation packs always available with unresolved details and status prominently marked.

HTTP: GET `/api/defaults` -> parameters; POST `/api/evaluate` with `{parameters, pose?}` -> `{model, report, meshes:[{id,positions:[...],indices:[...]}]}` (mesh coordinates WORLD millimetres); POST `/api/export/{format}` same payload returns file. Formats: `pack` ZIP, `pdf`, `csv`, `dxf`, `step`, `json`. GET `/api/health`. Validation error HTTP 422 with readable detail. Frontend has configurable `/api` proxy to localhost:8000. Heavy evaluation is server-side; identify stale responses by revision/request sequencing.

POST `/api/preview` accepts the same inputs and returns current model/meshes with `report: null`. It never invokes verification, even when a cached report exists. The frontend's automatic-verification toggle selects preview versus evaluation, with a manual verification action. Changed settings invalidate displayed evidence immediately; preview-only responses cannot enable supplier exports. Aborting a client request prevents a late result from replacing current state; it does not promise cancellation of a CAD operation already executing on the server.

Evaluation and preview responses include `X-Design-Revision` and `X-Verification-State` (`evaluated` or `preview`). These identify the response without requiring an extra copy of its mesh body; the authoritative report remains in the evaluated JSON payload.

Dependencies: Python 3.12, CadQuery, scipy, numpy, fastapi, uvicorn, pydantic, reportlab, ezdxf, pytest, httpx. Frontend SolidJS, Three.js, Vite, TypeScript. Pin/install dependencies and commit lockfiles. No deployment or provider messaging.

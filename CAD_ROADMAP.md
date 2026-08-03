# CAD Roadmap

This roadmap describes how to evolve this repository from a browser-based 3D piece renderer into a small, parametric, manufacturing-aware CAD system for woodworking, aluminium extrusion, and assembled structures.

It is intentionally tied to the current codebase. The goal is not to design a generic CAD kernel in one step, but to introduce a stable domain model around the existing Replicad geometry and Three.js viewer, one useful vertical slice at a time.

## Product direction

The system should answer three questions for every project:

1. **Does the design make geometric sense?** Pieces should be placed from meaningful references, dimensions should remain valid when parameters change, and moving parts should have valid motion.
2. **Can it be built?** The model should produce a bill of materials, cut list, panel list, connectors, machining operations, and useful drawings.
3. **Can it be changed safely?** A project should be adjustable through parameters and configurations without manually repairing dozens of unrelated transforms.

EnclosureV2 is the only active product target. It already contains a parametric frame, aluminium profiles, two compound doors, a moving hinge pivot, project-level assertions, and a price calculation. Its current dimensions remain project inputs—not validation targets.

## Quality audit — 2026-08-03

This audit reflects the implementation on `refactor/viteplus-solidjs` at the
quality phase commits and the local quality gates. A checked item below means
that implementation and relevant automated coverage are present; a planned API
sketch is not evidence of completion.

### Implemented

- The active Vite Plus/SolidJS application is under `src/`, with active sources
  in `src/domain`, `src/validation`, `src/rendering`, and `src/ui`; the older
  renderer remains under `legacy/`.
- EnclosureV2 has typed IDs, unit conversion, shared profile/material catalogs,
  frames/anchors, declarative members, Three.js adaptation, constraints,
  deterministic kinematics, sampled motion envelopes, fit policies, a Replicad
  solid-check adapter, structured reports, an extrusion BOM/cut plan, and
  JSON/CSV/SVG exports.
- Local quality gates pass: 21 test files and 65 tests, formatting/lint/type
  checks, production builds, workflow policy validation, and diff whitespace
  validation. `Vitest` is available through `npm test`; this is non-browser
  coverage, not an automated browser smoke test.

### Explicit blockers and limits

- Frame3DD remains an optional external sidecar. Serialization, parsing, and an
  explicit `unavailable` result exist, but no solver is installed/configured in
  this checkout; no structural result is claimed.
- Pages workflow semantics are validated locally, but repository Pages settings,
  environment approval, and the remote deployment URL require authenticated
  GitHub access and cannot be verified here.
- Replicad/OpenCascade solid validation is covered by static solid-check tests
  and scene integration. Door motion solid validation has focused tests: it
  checks a two-door Cartesian grid against moving-vs-static and moving-vs-moving
  pairs, reports pair IDs and the first blocking sampled-state failure, and
  returns `incomplete` for exhausted budgets or kernel errors. A `clear` result
  only covers the sampled states and is explicitly not a continuous-motion
  proof. BOM coverage is currently frame extrusions; hardware, panels, and
  vendor data are not inferred.
- Browser smoke tests, PDF/vector drawing production, full stock optimization,
  hardware/panel manufacturing records, generic door assembly migration, and
  later configuration variants remain planned and must stay unchecked.
- A browser smoke test was attempted against
  `https://wimpheling.github.io/workbench/`, but the execution environment has
  no browser/Playwright. HTTP/MIME checks are available, but do not replace the
  browser smoke test.

## Current-state assessment

### What exists today

The repository has a working Replicad/Three.js/SolidJS pipeline:

- [ ] `legacy/src/lib/render.tsx` initializes Replicad/OpenCascade and mounts the SolidJS renderer.
- [ ] `legacy/src/lib/AbstractShapeMaker.ts` stores pieces by group, builds Replicad geometry, converts it to Three.js meshes, and exposes group visibility and door pivots.
- [ ] `legacy/src/lib/pieceHelpers.ts` generates box geometry, 3030/3060 aluminium extrusion geometry, box joints, half-laps, specification keys, and an optional fused compound geometry path.
- [ ] `Piece` describes a single item with geometry, material, display properties, and an `assemble(obj)` callback.
- [ ] `CompoundPiece` groups several `Piece` records and optionally creates a hinge pivot. `enclosureV2` uses this for its two doors.
- [ ] `src/ui/Assembly.tsx` provides the current viewer, selection information, group visibility controls, saved camera controls, and door animation.
- [ ] `legacy/src/projects/enclosureV2/consts.ts` centralizes the enclosure's current input values and several derived dimensions.
- [ ] `legacy/src/projects/enclosureV2/enclosureV2Assertions.ts` checks required structure member names, profile/material classification, and the presence of two equal-width doors.
- [ ] `legacy/src/projects/enclosureV2/calculatePrices.ts` estimates extrusion cost from total member length and fixed per-100-unit prices.
- [ ] The repository history shows a useful progression: Replicad adoption, the enclosureV2 project, compound/animated doors, and a merged fix for frame/door parametric behavior. Future work should preserve this incremental style.

### Current limitations

The current architecture is a renderer-facing scene description rather than a CAD domain model:

- [ ] Placement is hidden in imperative `assemble(obj)` callbacks. A callback may combine rotations, translations, and Three.js-specific behavior without exposing a semantic anchor or local coordinate frame.
- [ ] `Piece` mixes manufacturing identity, geometry, display metadata, grouping, and rendering placement.
- [ ] The geometry union is small and partly hard-coded. `pieceHelpers.ts` contains the profile dimensions and slot geometry for 3030/3060 directly, while project constants contain another copy of profile dimensions.
- [ ] `getGeometry()` has repeated per-side dispatch for box joints and half-laps. Joint compatibility is documented but not represented as a relationship between two members.
- [ ] `AbstractShapeMaker.assemble()` duplicates material/mesh setup for regular pieces and compound pieces and owns door-specific pivot behavior.
- [ ] Compounds are primarily visual grouping. They do not yet have an assembly hierarchy, local coordinate frame, motion limits, or hardware requirements.
- [ ] `piecesBySpecs` groups pieces through a string key. This is useful for a first UI, but it is not a typed BOM or manufacturing identity.
- [ ] The price calculation is a console estimate. It does not model stock bars, kerf, offcuts, vendor pricing, connectors, panels, hardware, or waste.
- [ ] Assertions are mostly name/profile checks. They do not yet inspect placements, clearances, intersections, or the generated geometry.
- [ ] There is no general project parameter object or configuration system. EnclosureV2 uses module-level constants and manually repeated derived transforms.
- [ ] There is no formal unit type. EnclosureV2 documents model values as centimetres, while the viewer converts selected object dimensions by multiplying by 10 to display millimetres.
- [x] `package.json` exposes `npm test`; the Vitest suite covers pure domain, validation, rendering-adapter, UI-authoring, export, and Frame3DD-boundary behavior without a browser.
- [ ] The repository contains draft projects and stale enclosure parameter files outside the active scope; they should be deleted during the foundation phase, with Git history serving as the archive.
- [ ] The README describes technical drawings, real-time adjustment, and cutting layouts more fully than the current source implements. The roadmap treats these as targets, not existing capabilities.

### Architectural target

The intended layering is:

```text
Project parameters/configuration
        ↓
Parametric design model
  (references, placements, constraints,
   parts, joints, assemblies, motion)
        ↓
Manufacturing model
  (BOM, stock, cuts, panels, hardware,
   machining operations, costs)
        ↓
Geometry adapters
  (Replicad solids and Three.js transforms)
        ↓
Viewer, specs, drawings, exports
```

Replicad remains the solid-geometry engine and Three.js remains the interactive viewer. The domain model should not need to know which renderer is displaying it.

## Guiding principles

### 1. Parameters are inputs, not golden dimensions

The default enclosure dimensions are useful examples, not fixed truths. Tests should verify relationships and invariants:

- [ ] a member length is positive;
- [ ] two doors remain equal when the opening is split symmetrically;
- [ ] a panel fits within its frame with the requested clearance;
- [ ] a rail spans its referenced supports;
- [ ] a hinge remains on the requested edge;
- [ ] a configuration is manufacturable.

Tests should not fail merely because a user changes the enclosure width, height, or depth.

### 2. Manufacturing intent is first-class

“A 3060 extrusion between these two supports” is more useful than “a mesh rotated by 90 degrees and placed at this coordinate.” The model should retain profile, stock, cut length, material, joinery, hardware, and assembly relationships.

### 3. Semantic references before a general constraint solver

Start with named anchors and derived formulas. Add a solver only when the project requires underconstrained or user-editable sketches. Most enclosure relationships can initially be expressed deterministically and more reliably than through a general numerical solver.

### 4. Pure model generation, side-effectful rendering

Parameter evaluation, validation, BOM generation, and cut-list generation should work without a browser or WebGL context. Rendering should consume the evaluated model.

### 5. Explicit coordinate systems

Every placement should state its local frame, axis direction, and orientation. Avoid making users infer intent from chained `rotation.x`, `rotation.y`, `rotateY`, and `position.set` calls.

### 6. Preserve inspectability

A user should be able to select a part and discover its design ID, source feature, material, dimensions, references, joints, and manufacturing record—not only a display name and bounding-box size.

### 7. Prefer small vertical slices

Each phase should produce something visible or useful. For example, introduce anchors for the existing enclosure frame, then use those anchors to generate the existing frame and its cut list before attempting a complete CAD rewrite.

### 8. Keep geometry and manufacturing tolerances separate

Nominal dimensions describe design intent. Clearance, slot fit, saw kerf, machining allowance, panel expansion, and vendor tolerances are manufacturing rules and should not be hidden inside arbitrary geometry offsets.

## Proposed domain model

These types are illustrative design sketches, not a requirement to introduce all of them at once or copy them verbatim. They define the vocabulary that later features should converge on; referenced helper types can be introduced incrementally as each slice is implemented.

### Units and scalar values

Choose one canonical internal unit for manufacturing. Millimetres are the most practical long-term choice for aluminium, panels, fasteners, and CNC work. Convert the current enclosure inputs at the new model boundary; do not preserve the old centimetre-oriented API.

```ts
export type Length = number;
export type Angle = number; // radians internally

export type Dimensions = {
  x: Length;
  y: Length;
  z: Length;
};
```

If nominal numeric aliases are not enough to prevent mistakes, add branded units later. Do not introduce unit wrappers everywhere before the model boundaries are clear.

### IDs and parameter evaluation

Names are for people; stable IDs are for references, tests, and exports.

```ts
export type PartId = string;
export type FeatureId = string;
export type ParameterId = string;

export type ParameterValue = number | string | boolean;

export type DesignParameters = Record<ParameterId, ParameterValue>;

export type EvaluationContext = {
  parameters: DesignParameters;
  profiles: ProfileCatalog;
  materials: MaterialCatalog;
  tolerances: TolerancePolicy;
};
```

The first implementation can use plain objects and explicit derived functions. A full expression language is not necessary for the initial phases.

### Coordinate frames and anchors

Use a right-handed project frame with documented meaning, for example `X` left/right, `Y` up, and `Z` front/back. A project may expose named frames for the enclosure, door, panel, or CNC work envelope.

```ts
export type Axis = 'x' | 'y' | 'z';

export type Transform = {
  position: { x: Length; y: Length; z: Length };
  rotation: { x: Angle; y: Angle; z: Angle };
};

export type CoordinateFrame = {
  id: string;
  parent?: string;
  transform: Transform;
};

export type Anchor = {
  id: string;
  frame: string;
  point: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };
  direction?: { x: number; y: number; z: number };
  semantic:
    | 'corner'
    | 'edge'
    | 'center'
    | 'face'
    | 'opening'
    | 'hinge'
    | 'custom';
};
```

Useful EnclosureV2 anchors would include `front-left`, `front-right`, `back-left`, `back-right`, `side-mid-left`, `side-mid-right`, `front-opening`, `top-plane`, and door hinge lines. The exact default dimensions remain parameters.

### Profiles, materials, and stock

Profile geometry and purchasing information should come from one catalog. This removes the current duplication between `consts.ts`, `pieceHelpers.ts`, and price calculation.

```ts
export type Profile = {
  id: string; // e.g. 'aluminium-3030'
  section: Dimensions;
  geometry: 'tSlot' | 'box' | 'custom';
  stockLengths?: Length[];
  pricePerLength?: number;
};

export type Material = {
  id: string;
  label: string;
  density?: number;
  thickness?: Length;
  color?: string;
  transparent?: boolean;
};
```

The initial catalog only needs the existing 3030/3060 profiles, wood, compact polycarbonate, and aluminium classifications.

### Parts and features

Separate the manufacturing part from the generated solid and from its viewer representation.

```ts
export type Part = {
  id: PartId;
  name: string;
  category: 'extrusion' | 'panel' | 'solid' | 'hardware' | 'assembly';
  material: string;
  geometry: GeometrySpec;
  placement: PlacementSpec;
  references?: string[];
  manufacturing?: ManufacturingSpec;
};

export type PlacementSpec = {
  frame: string;
  origin: AnchorReference | PointReference;
  orientation: OrientationSpec;
};

export type GeometrySpec =
  | { kind: 'box'; size: Dimensions; operations?: GeometryOperation[] }
  | { kind: 'profile'; profile: string; length: Length; operations?: GeometryOperation[] }
  | { kind: 'panel'; boundary: BoundaryReference; thickness: Length };
```

Placement should be expressed as data. The old `assemble(obj)` callback model is not a compatibility requirement and may be removed as soon as EnclosureV2 is rebuilt on the new model.

### Assemblies and motion

Compound pieces should become assemblies with a hierarchy and optional joints of motion.

```ts
export type Assembly = {
  id: string;
  name: string;
  parts: PartId[];
  children?: string[];
  frame: string;
  motion?: MotionSpec;
};

export type MotionSpec = {
  kind: 'revolute' | 'prismatic';
  axis: { x: number; y: number; z: number };
  origin: AnchorReference;
  limits?: { min: Angle; max: Angle };
  defaultValue?: number;
};
```

The current door pivot can be represented as a revolute motion around a hinge anchor. The viewer can then animate a generic motion rather than special-casing `doorPivots` in `Assembly.tsx`.

## Phased implementation plan

### Phase 0 — Stabilize the modeling boundary

**Goal:** Make the current behavior explicit and create a safe base for architectural changes.

Tasks:

- [x] Document the canonical coordinate frame and current unit convention (the active model/UI use millimetres; `toMillimetres()` handles cm/m inputs).
- [x] Decide where conversion from current centimetre project values to manufacturing units happens: at the domain/model boundary.
- [x] Replace stringly-typed display names as internal references with stable IDs, while retaining human-readable names.
- [x] Add a small `ProjectDefinition`/`EvaluationContext` boundary around project parameters.
- [x] Move the 3030/3060 profile dimensions and slot width into a single profile catalog consumed by geometry and pricing.
- [x] Add the initial immutable wood, compact polycarbonate, and aluminium material classifications to the evaluation catalog.
- [ ] Delete the draft project directories `src/projects/enclosure/`, `src/projects/montessoriLibrary/`, `src/projects/test/`, and `src/projects/workbench/`, plus their unused bathroom-plan assets; Git history is the archive for removed projects.
- [ ] Delete the stale `src/projects/enclosureV2/enclosureV2Const.ts` and make `projects.ts` expose only EnclosureV2.
- [ ] Extract repeated material and mesh conversion in `AbstractShapeMaker.assemble()` into renderer helpers.
- [ ] Replace `Piece` and `CompoundPiece` with the new typed part/assembly model; no compatibility adapter is required.
- [ ] Update README and `AGENTS.md` so they describe implemented features separately from planned features.

Acceptance criteria:

- [x] EnclosureV2 still renders its default model through the tested scene construction.
- [x] Changing width, height, or depth regenerates dependent model geometry/placements.
- [ ] 3030/3060 geometry, displayed profile metadata, and price lookup use the same catalog records.
- [x] The project can be evaluated in a non-browser test without mounting Three.js.

### Phase 1 — Declarative placements and semantic anchors

**Goal:** Replace raw transform callbacks for the enclosure frame with meaningful placement data.

Tasks:

- [x] Add `CoordinateFrame`, `Anchor`, `Transform`, and `PlacementSpec` types.
- [x] Add pure helpers such as `betweenAnchors()`, `atAnchor()`, `midpoint()`, `offsetAlong()`, and `orientedAlong()`.
- [x] Define an enclosure root frame and named corner, opening, midpoint, and hinge anchors.
- [x] Introduce a `makeRail({ from, to, profile })` helper for a profile whose length is derived from two anchors.
- [x] Introduce a `makePost({ from, to, profile })` helper for vertical or arbitrary-axis members.
- [x] Encode wide-face orientation of 3060 profiles as an explicit profile orientation, not a sequence of unexplained rotations.
- [x] Add a Three.js adapter that translates the declarative placement into the current mesh transform.
- [ ] Migrate EnclosureV2 doors from the legacy renderer after the frame is stable; the declarative door migration is incomplete.
- [x] Integrate production scene construction so every declarative EnclosureV2 member is adapted into a stable, inspectable Three.js object.

Example target API:

```ts
model.addExtrusion({
  id: 'front-top',
  profile: 'aluminium-3060',
  between: ['front-left-top', 'front-right-top'],
  orientation: { wideFace: 'front' },
  group: 'Structure',
});
```

Acceptance criteria:

- [x] The enclosure member list reads as a layout rather than a list of manual `position.set()` calls.
- [x] A dimension change updates all dependent rail lengths and anchors.
- [x] Existing side middle supports, front 3060 members, back middle support, and top-back tie remain represented explicitly.
- [x] A placement can be tested by inspecting numeric transforms without constructing a Three.js scene.

### Phase 2 — Constraints and model validation

**Goal:** Turn implicit design relationships into reusable, reportable validation.

Start with deterministic constraints, not a general solver.

Initial constraint types:

- [x] `PositiveLength`
- [x] `Equal`
- [x] `CenteredOn`
- [x] `Between`
- [x] `Coincident`
- [x] `Parallel`
- [x] `Perpendicular`
- [x] `Distance`
- [x] `FitsWithin`
- [x] `ClearanceAtLeast`
- [x] `SymmetricAbout`
- [x] `SupportedBy`

Suggested API:

```ts
export type ConstraintSeverity = 'error' | 'warning';

export type ConstraintResult = {
  id: string;
  severity: ConstraintSeverity;
  passed: boolean;
  message: string;
  references: string[];
  measured?: number;
  expected?: number;
};

export function validateModel(model: EvaluatedModel): ConstraintResult[];
```

EnclosureV2 constraints should cover:

- [x] all structural member lengths are positive;
- [x] the left and right side supports are at the depth midpoint;
- [x] the front opening has no middle support;
- [x] front top and front post members use 3060 and required members are reported when missing;
- [x] the two doors have equal nominal widths and cover the canonical x opening;
- [ ] the closed door seam is checked against a named clearance value; the current check does not establish a configured policy;
- [x] panel bounds stay inside their frame relative to their anchor and orientation;
- [x] no required anchor is orphaned;
- [x] no part has an impossible profile orientation.

Move the current project assertions into this result-based system, preserving a throwing helper for startup failures if desired. Keep project-specific rules in the project, and reusable geometric rules in `src/lib`.

Acceptance criteria:

- [x] The UI shows structured errors and warnings without parsing exception strings.
- [x] Changed parameters produce measured, referenced constraint failures rather than generic missing-piece errors.
- [x] Constraint tests use small synthetic models and do not require WebGL.

### Phase 3 — Practical validation, kinematics, and optional structural analysis

**Goal:** Build the practical validation layer that tells the user whether the evaluated model is geometrically valid, moves correctly, fits together with real tolerances, and is structurally plausible enough to warrant further review.

This phase is deliberately layered. Deterministic TypeScript handles model relationships, motion, tolerances, and reports; Replicad/OpenCascade remains authoritative for solid intersections and minimum-distance checks; sampled or adaptive evaluation checks moving assemblies; and Frame3DD is the only additional analysis dependency, used as an optional external structural sanity-analysis sidecar. No browser physics engine, general constraint solver, mesh-collision package, or full FEA framework is required.

#### Dependency boundary

The production validation layer must use the existing TypeScript, Three.js, Replicad, and OpenCascade dependencies. New validation code should not require additional runtime packages for:

- [x] parameter and invariant checks;
- [x] frame and assembly transforms;
- [ ] revolute and prismatic kinematics;
- [ ] static and moving collision checks;
- [ ] minimum-distance and clearance checks;
- [ ] glass, panel, door, slot, and connector fit rules;
- [ ] tolerance-budget evaluation;
- [ ] structured reports consumed by the demo and BOM.

Vitest may be added as a development-only test runner. Frame3DD is the only optional external analysis tool in this roadmap. `three-mesh-bvh`, Rapier, SolveSpace, FreeCAD, Code_Aster, Gmsh, SciPy, and OR-Tools are explicitly deferred rather than implicit dependencies.

#### Deterministic TypeScript kinematics

Implement a small, testable transform graph for rigid assemblies and the motion types needed by the projects:

- [x] revolute joints for hinged doors and access panels;
- [ ] sliding/prismatic joints for future panels or drawers;
- [ ] nested parent/child assembly frames;
- [x] limits, default positions, and named states;
- [x] deterministic transform-composition primitives and motion-value evaluation;
- [ ] no physics simulation, contact solver, or frame-rate-dependent behavior.

Suggested API:

```ts
export type Motion =
  | { kind: 'revolute'; axis: Vector3; origin: AnchorReference; min: Angle; max: Angle }
  | { kind: 'prismatic'; axis: Vector3; origin: AnchorReference; min: Length; max: Length };

export type KinematicState = {
  values: Record<string, number>;
};

export function evaluateKinematics(
  model: EvaluatedModel,
  state: KinematicState
): EvaluatedModel;
```

The current door pivot behavior should migrate to this API. The viewer should consume evaluated transforms and animate between states, while tests can evaluate a door at exact angles without initializing Three.js.

> **Audit note:** Revolute door motion, limits, named states, and pure transform helpers are implemented and tested. Both EnclosureV2 doors expose named `closed` and `open` states at exact angles; the viewer consumes their evaluated poses without rebuilding geometry, and viewer pose-controller tests cover that path. Continuous animation, browser smoke/integration, prismatic motion, and nested assembly propagation remain incomplete.

#### Authoritative solid checks

> **Audit note:** Static `solidChecks.ts` intersection/distance logic is covered
> by Replicad/OpenCascade tests and integrated into scene construction. The
> motion-specific suite covers the two-door grid, kernel truth, pair coverage,
> first blocking sampled-state failure, and `incomplete` diagnostics. Broad
> phase optimization and touching classification are not implemented. Pair IDs
> are available; feature/constraint provenance is not consistently attached.

Use Replicad/OpenCascade solids—not Three.js meshes or only axis-aligned bounding boxes—as the authority for geometric validity:

- [x] exact or kernel-backed intersection checks for static parts;
- [x] minimum-distance checks between selected solids or surfaces;
- [ ] configurable broad-phase bounds only as a performance optimization before authoritative checks;
- [ ] classification of touching, overlapping, separated, and invalid/unknown results;
- [ ] stable IDs for both offending parts and the feature/constraint that requested the check; the current checks expose pair IDs, but do not yet attach the requesting feature/constraint consistently.

Suggested API:

```ts
export type ClearanceCheck = {
  id: string;
  subject: PartId;
  target: PartId;
  minimum: Length;
  tolerancePolicy?: string;
};

export type SolidCheckResult = {
  status: 'clear' | 'collision' | 'insufficient-clearance' | 'indeterminate';
  distance?: Length;
  intersection?: boolean;
  diagnostics: string[];
};

export function checkSolidClearance(
  model: EvaluatedModel,
  check: ClearanceCheck
): SolidCheckResult;
```

Three.js may display the result and provide fast previews, but it must not silently replace the authoritative Replicad/OpenCascade check for manufacturing or fit decisions.

#### Motion-envelope validation

For every moving assembly, validate the path rather than only its endpoints:

- [x] sample named motion intervals with deterministic resolution;
- [ ] use adaptive subdivision where clearance changes rapidly or a coarse sample brackets a collision; the generic `motionEnvelope.ts` helper refines sign changes, but the Replicad door sweep does not use it;
- [x] check moving-vs-static and moving-vs-moving pairs in the Replicad door sweep;
- [x] record sampled motion values at a detected blocking event;
- [x] support a configurable minimum clearance and maximum state budget for the Replicad door sweep;
- [x] distinguish sampled states covered by the sweep from an unverified interval when the state budget is exhausted.

The first implementation can use uniform sampling plus refinement around the minimum. It should not claim a mathematical continuous-motion proof. A swept-volume implementation may be added later if a project needs it.

> **Audit note:** The door motion solid sweep evaluates a deterministic two-door
> Cartesian grid using Replicad/OpenCascade as the authority, covers
> moving-vs-static and moving-vs-moving pairs, restores the initial pose, and
> reports the first blocking sampled-state result with pair IDs and state.
> Exhausted state budgets and kernel errors are `incomplete`/unverified. A
> `clear` result is limited to sampled states and carries a diagnostic that it
> is not continuous/swept proof. The generic `motionEnvelope.ts` helper is
> separate and does not upgrade this door sweep to adaptive or continuous
> validation.

#### Tolerance and fit policies

Nominal dimensions and manufacturing allowances must be separate inputs. Add typed policies for the actual materials and interfaces in scope:

- [x] compact-polycarbonate panel-slot thickness tolerance primitive;
- [ ] panel expansion or installation gap;
- [ ] door-to-frame and door-to-door clearance;
- [ ] hinge-side and latch-side allowances;
- [ ] slot-fit depth and profile tolerance;
- [ ] fastener/connector clearance holes;
- [ ] saw kerf and machining allowance where manufacturing output needs it.

```ts
export type FitPolicy = {
  id: string;
  material?: string;
  interface: 'panel-slot' | 'door-frame' | 'door-seam' | 'connector' | 'custom';
  nominalClearance: Length;
  minimumClearance: Length;
  thicknessTolerance?: Length;
  notes?: string[];
};
```

Policies should be named and overridable per project/configuration. Avoid scattering offsets such as `0.5` through project transforms without recording what they mean.

> **Audit note:** The tested scope is a compact-polycarbonate panel-slot thickness-tolerance primitive. It is not a complete clearance integration; expansion/installation gaps, door allowances, connector-hole rules, and machining allowances remain missing.

#### Structured validation reports

All checks—including existing enclosure assertions, kinematic checks, solid checks, fit checks, and optional structural results—should feed one structured report consumed by the demo, specs view, and BOM/manufacturing pipeline.

```ts
export type ValidationIssue = {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'model' | 'kinematics' | 'clearance' | 'fit' | 'structural' | 'manufacturing';
  message: string;
  references: string[];
  state?: KinematicState;
  measured?: number;
  expected?: number;
  diagnostics?: string[];
};

export type ValidationReport = {
  status: 'valid' | 'warnings' | 'invalid' | 'incomplete';
  issues: ValidationIssue[];
  modelRevision: string;
};
```

The BOM should be able to mark parts affected by unresolved fit/collision issues, and the demo should be able to show the same issue with highlighted parts and an actionable message. Reports must not depend on parsing console logs or exception text.

#### Optional Frame3DD sidecar

Frame3DD is an external, optional structural sanity-analysis path for selected frame members. It is not a browser-runtime dependency, not a replacement for Replicad/OpenCascade, and not an automatic engineering approval system.

Inputs should be a versioned document generated from the evaluated model:

```ts
export type StructuralAnalysisInput = {
  modelId: string;
  modelRevision?: string;
  nodes: Array<{
    id: string;
    anchorId: string;
    position: Vector3;
    restraint?: { x: boolean; y: boolean; z: boolean; rx: boolean; ry: boolean; rz: boolean };
  }>;
  members: Array<{
    id: string;
    partId: PartId;
    startNode: string;
    endNode: string;
    profileId: string;
    materialId: string;
  }>;
  materials: StructuralMaterial[];
  sections: StructuralSection[];
  loadCases: StructuralLoadCase[];
};
```

Outputs should include solver status/diagnostics, node displacements, reactions, member forces, and stable IDs mapping back to anchors and parts. The adapter should support exporting the input, invoking a local Node/CLI sidecar when explicitly enabled, parsing results, and importing a saved result JSON for browser visualization.

Limitations:

- [ ] The model is an idealized beam/frame representation, not the detailed solids, T-slots, brackets, bolts, joints, panels, or contact surfaces.
- [ ] Results depend on explicitly authored supports, loads, material data, section properties, and connection assumptions; these cannot be inferred safely from geometry alone.
- [ ] Initial scope is linear static screening. It does not cover structural certification, code compliance, nonlinear behavior, fatigue, vibration, seismic, fire, or safety approval.
- [x] a missing solver produces an `unavailable` diagnostic;
- [ ] a missing solver must not break rendering, ordinary validation, BOM generation, or drawings.

#### Inputs and outputs for the whole validation phase

> **Audit note:** Pure kinematic states, sampled envelope results, fit
> diagnostics, and Replicad solid checks are implemented with focused tests.
> Scene construction integrates the static and door-motion checks into
> `validationReport`, and the UI consumes that scene report. Shared report
> consumption by the BOM remains incomplete; the global report/BOM criterion
> therefore stays unchecked.

Inputs:

- [ ] evaluated parts, assemblies, anchors, and frames;
- [ ] kinematic states and motion ranges;
- [ ] profile/material catalogs;
- [ ] named fit/clearance policies;
- [ ] authored supports and load cases for optional Frame3DD analysis;
- [ ] validation thresholds and computational budgets.

Outputs:

- [x] deterministic evaluated states;
- [x] static solid collision and minimum-distance results; the door sweep also checks blocking collision/clearance at sampled states;
- [ ] sampled/adaptive motion-envelope results; the generic helper is tested separately, while the Replicad door sweep is sampled and does not provide adaptive subdivision;
- [x] fit/tolerance diagnostics;
- [ ] one structured `ValidationReport` consumed by the demo and manufacturing/BOM layers; the demo/UI consumes the scene report, but BOM consumption is not implemented.
- [ ] optional Frame3DD input/result documents and structural issues.

#### Acceptance criteria

- [x] Both EnclosureV2 doors can be evaluated at exact named `closed`/`open` angles and the viewer consumes their evaluated poses without rebuilding geometry; controller tests cover the path.
- [ ] Sliding assemblies can use the same deterministic transform API.
- [x] Static collisions and minimum clearances are determined from Replicad/OpenCascade solids, with Three.js used only for display or optional previews.
- [x] A door motion check reports the state and pair IDs at the first detected blocking collision or insufficient-clearance result; it does not claim a minimum non-blocking clearance or continuous/swept proof.
- [ ] Door, panel, glass/polycarbonate, slot, and connector fit rules are named policies rather than unexplained numeric offsets.
- [ ] The demo and BOM consume the same structured validation report; no consumer parses console output.
- [ ] EnclosureV2 can export a deterministic Frame3DD input document, and an external run can be imported without requiring Frame3DD in the browser.
- [x] Missing solver, malformed geometry, or exhausted motion-validation budgets result in explicit `incomplete`/diagnostic states rather than false passes for the implemented solid/motion paths.
- [ ] Tests cover a valid reference frame, an intentional collision, an insufficient panel/door clearance, a kinematic limit violation, and an unavailable Frame3DD executable; coverage is granular rather than complete across this mixed criterion.

### Phase 4 — First-class joints, connectors, and interfaces

**Goal:** Model how parts attach, not only where their solids overlap.

Unify the current woodworking joints and future hardware under a relationship model.

```ts
export type Joint =
  | { kind: 'box'; host: PartId; mate: PartId; side: Side; fingers: number; depth: Length }
  | { kind: 'halfLap'; host: PartId; mate: PartId; size: Length; side: Side }
  | { kind: 'tSlotBolt'; host: PartId; mate: PartId; bolt: string; nut: string }
  | { kind: 'angleBracket'; host: PartId; mate: PartId; hardware: string };

export type Connection = {
  id: string;
  parts: PartId[];
  interface: InterfaceSpec;
  joint?: Joint;
  hardware?: HardwareRequirement[];
};
```

Implementation sequence:

1. Wrap existing `boxJoint()` and `halfLapJoint()` as geometry operations with explicit host/mate metadata.
2. Add profile interface metadata for T-slot faces and slot directions.
3. Add visual connector placeholders for bolts, nuts, brackets, hinges, and panel clips.
4. Add fastener counts and installation notes to the BOM.
5. Add fit rules: male/female box joints must agree on count and nominal dimensions; panel thickness must be compatible with a slot; bolt/nut sizes must match the profile slot.

Avoid trying to infer every connection from geometric intersection. Connections should be authored or generated by known feature helpers.

Acceptance criteria:

- [x] Typed joint records are generated and validated as domain data.
- [ ] A connection is visible in the model/specs and appears in manufacturing output.
- [ ] A mismatched mating joint produces a clear validation error.
- [ ] Hardware can be hidden from the structural view without being removed from the BOM.

### Phase 5 — Assembly hierarchy and states

**Goal:** Build on the deterministic motion kernel from Phase 3 so doors and future access panels become inspectable assemblies with reusable states.

Tasks:

- [ ] Replace the `doorPivots` special case with an assembly frame and `MotionSpec`.
- [ ] Represent each hinge/slider axis and origin through the shared kinematics API.
- [ ] Add assembly tree selection, visibility, and source-feature inspection.
- [ ] Define named states such as `open`, `closed`, and `service` for use by validation, drawings, and the demo.
- [ ] Allow a project to define an operating envelope for the CNC gantry, spindle, dust hose, and cable chain.

Suggested states:

```ts
export type AssemblyState = {
  id: string;
  motions: Record<string, number>;
};

export type Configuration = {
  id: string;
  parameters: DesignParameters;
  states?: AssemblyState[];
  enabledFeatures?: string[];
};
```

Acceptance criteria:

- [ ] Doors can be opened to a requested angle and returned to a valid closed state.
- [ ] The model reports door/frame and door/door interference.
- [ ] The same motion API can later drive a sliding panel or removable roof without adding another renderer-specific special case.

### Phase 6 — Panels and bounded infill

**Goal:** Add enclosure walls, roof, side panels, back panels, and door infill from frame boundaries.

Panels should be derived from surrounding geometry, not manually typed as unrelated boxes.

```ts
model.addPanel({
  id: 'left-wall',
  boundary: {
    edges: ['left-bottom', 'left-top', 'back-left', 'front-left'],
  },
  material: 'polycarbonate-4mm',
  installation: 'slot-in',
  clearance: { edge: 0.5, depth: 0.2 },
});
```

Features to support:

- [x] domain panels retain boundary, material, thickness, and installation data;
- [ ] planar panels are fully integrated into the rendered enclosure;
- [ ] slot-in, clip-in, screw-on, and removable installation modes;
- [ ] panel edge clearances and expansion allowance;
- [ ] cutouts for doors, extraction ducts, cable passes, and emergency access;
- [ ] optional opaque, transparent, or perforated visual materials;
- [ ] panel IDs and individual cut-list records.

For the CNC enclosure, panel modeling should include the roof and walls eventually, but should not block the frame and manufacturing phases.

Acceptance criteria:

- [ ] A panel width/height follows the frame if the enclosure parameters change.
- [ ] Panel thickness affects fit and does not silently alter the nominal frame dimensions.
- [ ] A panel that cannot fit due to negative clearance is reported before rendering.

### Phase 7 — Manufacturing model, BOM, and cut lists

**Goal:** Generate buildable purchasing and fabrication output.

Replace `calculatePrices()` with a reusable manufacturing report.

Core outputs:

- [x] extrusion BOM/cut-plan records are generated from the domain model;
- [ ] hierarchical bill of materials;
- [ ] grouped part list with quantities and nominal dimensions;
- [ ] aluminium extrusion cut list grouped by profile;
- [ ] panel cut list grouped by material and thickness;
- [ ] connectors and fasteners with quantity and specification;
- [ ] stock-bar optimization with selectable stock lengths;
- [ ] kerf, trim allowance, and waste/offcut reporting;
- [ ] cost estimate with vendor/catalog metadata;
- [ ] assembly order and installation notes.

Suggested types:

```ts
export type ManufacturingPart = {
  partId: PartId;
  quantity: number;
  material: string;
  profile?: string;
  cutLength?: Length;
  cutSize?: Dimensions;
  operations?: ManufacturingOperation[];
  notes?: string[];
};

export type StockItem = {
  id: string;
  material: string;
  profile?: string;
  length: Length;
  quantity: number;
  price?: number;
};

export type CutPlan = {
  stock: StockItem[];
  cuts: Array<{ stockId: string; partId: PartId; offset: Length; length: Length }>;
  kerf: Length;
  waste: Length;
};

export function buildManufacturingReport(model: EvaluatedModel): ManufacturingReport;
```

Implementation sequence:

1. Generate a typed BOM from current pieces and compound children.
2. Add nominal cut lengths and profile IDs for 3030/3060 members.
3. Add panel and hardware records.
4. Add a simple first-fit stock-bar planner with kerf and waste.
5. Add CSV/JSON output before adding a polished UI.
6. Add vendor catalogs and price data as optional inputs rather than constants in project code.

Do not fuse away individual manufacturing parts when generating a BOM. A door frame may be one visual assembly but four extrusions, one panel, hinges, and hardware in the manufacturing model.

Acceptance criteria:

- [ ] EnclosureV2 produces a stable, inspectable BOM without scraping console output.
- [ ] Equal parts are grouped by profile/material/length while retaining their source IDs.
- [ ] Cut plans include kerf and report waste and unassigned parts.
- [ ] Pricing is clearly labeled as an estimate and is independent of the viewer.

### Phase 8 — Drawings and exports

**Goal:** Turn the evaluated model into documentation a builder can use.

Prioritize simple, reliable outputs over a full drawing workbench.

First outputs:

- [x] SVG and JSON exports of the evaluated model/domain records;
- [ ] front, side, top, and isometric views;
- [ ] exploded assembly view with part labels;
- [ ] individual cut sheets for extrusions and panels;
- [ ] dimension annotations generated from model references;
- [ ] hole, slot, and connector locations;
- [ ] BOM and assembly notes;
- [ ] SVG/PDF-ready full drawing output;
- [ ] JSON export combining the evaluated model and manufacturing report.

Later outputs may include STEP/STL/OBJ where the underlying Replicad and export tooling support them, but exported solids should never replace the structured BOM and feature data.

Suggested API boundary:

```ts
export type DrawingView = {
  id: string;
  camera: Transform;
  visibleParts?: PartId[];
  dimensions?: DimensionAnnotation[];
  labels?: LabelAnnotation[];
};

export function renderDrawing(model: EvaluatedModel, view: DrawingView): DrawingDocument;
export function exportModel(model: EvaluatedModel, format: 'json' | 'svg' | 'stl'): Uint8Array;
```

Acceptance criteria:

- [ ] A dimension in a drawing references a model value and updates when parameters change.
- [ ] A drawing can be regenerated in a script or test without opening the viewer.
- [ ] Exported part IDs correspond to BOM and assembly IDs.

### Phase 9 — Configurations and project authoring

**Goal:** Make one model useful for multiple build variants.

Configurations should select parameter sets and optional features, not duplicate project source files.

Useful EnclosureV2 configurations:

- [ ] alternate width, height, or depth;
- [ ] doors enabled/disabled;
- [ ] single or double door;
- [ ] fixed, removable, or sliding panels;
- [ ] roof enabled/disabled;
- [ ] reinforced frame or lighter frame;
- [ ] extraction duct and cable-pass options;
- [ ] different profile catalogs or stock lengths.

Add:

- [x] serializable configuration records for parameters and enabled features;
- [ ] validation of parameter ranges and feature dependencies;
- [ ] named presets;
- [ ] deterministic regeneration from the same input;
- [ ] a UI editor only after the model/configuration API is stable.

Acceptance criteria:

- [ ] Two configurations can be compared by parameters, parts, BOM, cost, and validation results.
- [ ] A configuration can be saved and loaded without executable project code.
- [ ] Optional features do not leave orphaned anchors, joints, or BOM records.

## Advanced feature backlog

The following features belong in the long-term system, but should be pulled into implementation only when the preceding model boundaries can support them.

### Reference geometry and coordinate frames

- [ ] project, assembly, part, and feature-local frames;
- [ ] named points, axes, planes, faces, edges, and openings;
- [ ] transformations between frames;
- [ ] attach/detach operations;
- [ ] mirror and pattern operations;
- [ ] reference stability when feature order changes;
- [ ] visual display of anchors and axes for debugging.

### Constraints

- [ ] relational dimension constraints;
- [ ] equal, symmetric, aligned, parallel, perpendicular, coincident, tangent, and offset constraints;
- [ ] named design rules and tolerances;
- [ ] error/warning severity;
- [ ] deterministic evaluation first;
- [ ] optional numerical solver only for sketches or genuinely underconstrained layouts;
- [ ] explainable diagnostics with measured and expected values.

### Practical validation and optional Frame3DD analysis

- [ ] deterministic TypeScript revolute and prismatic kinematics;
- [ ] exact transform evaluation for nested rigid assemblies;
- [ ] Replicad/OpenCascade-authoritative intersection and minimum-distance checks;
- [ ] sampled/adaptive motion-envelope validation with explicit computational budgets;
- [ ] named tolerance and fit policies for glass/polycarbonate panels, doors, slots, and connectors;
- [ ] structured validation reports shared by the demo, specs, BOM, and manufacturing outputs;
- [ ] optional Frame3DD export, external execution, result parsing, and stable ID mapping;
- [ ] explicit `unavailable`/`incomplete` diagnostics when a solver or validation budget is unavailable;
- [ ] visual overlays for collisions, minimum clearances, motion states, and structural warnings.

### Joints and connectors

- [ ] current box and half-lap joints as typed operations;
- [ ] T-slot nuts, bolts, brackets, corner cubes, hinges, panel clips, and threaded inserts;
- [ ] connector placement from profile interfaces;
- [ ] mating validation;
- [ ] drilling and machining operations associated with connectors;
- [ ] installation order and tool requirements.

### Assemblies and kinematics

- [ ] nested assembly tree;
- [ ] rigid and moving subassemblies;
- [ ] revolute and prismatic joints;
- [ ] limits, default positions, and named assembly states;
- [ ] swept-volume and collision checks;
- [ ] exploded transforms;
- [ ] service/maintenance configurations;
- [ ] machine operating envelope.

### Panels and sheet goods

- [ ] boundary-derived dimensions;
- [ ] stock sheet sizes and grain direction;
- [ ] edge treatments and corner radii;
- [ ] cutouts and openings;
- [ ] kerf and cutter diameter;
- [ ] expansion gaps and slot fit;
- [ ] nesting and waste optimization;
- [ ] removable panel hardware.

### Interference and clearance checking

- [ ] static solid intersections;
- [ ] bounding-box broad phase followed by exact or narrow-phase checks;
- [ ] minimum separation distance;
- [ ] moving-part swept volumes;
- [ ] required access clearances;
- [ ] panel and profile slot fit;
- [ ] configurable tolerance policy;
- [ ] visual highlighting of offending parts and references.

### BOM, costs, and fabrication

- [ ] hierarchical BOM;
- [ ] profile and material catalogs;
- [ ] stock optimization;
- [ ] kerf and waste;
- [ ] vendor prices and currencies;
- [ ] optional labor and assembly estimates;
- [ ] revisioned reports;
- [ ] CSV/JSON export;
- [ ] printable build list.

### Drawings and exports

- [ ] orthographic views;
- [ ] dimensions and tolerances;
- [ ] hole/slot callouts;
- [ ] exploded diagrams;
- [ ] cut sheets;
- [ ] SVG/PDF output;
- [ ] structured JSON;
- [ ] Replicad-supported solid exports;
- [ ] later DXF/STEP support if a reliable adapter is available.

### Configurations

- [ ] saved parameter sets;
- [ ] optional features;
- [ ] alternate materials and profiles;
- [ ] variant comparison;
- [ ] valid/invalid configuration matrix;
- [ ] deterministic serialization;
- [ ] migration of saved project files.

## Testing strategy

Testing should grow with the domain model and remain independent of the renderer wherever possible.

### Pure unit tests

Test these as pure functions:

- [x] unit conversion and rounding;
- [x] profile catalog dimensions and identity;
- [x] anchor coordinates and frame transforms;
- [x] rail/post lengths and orientation;
- [x] panel boundary calculations;
- [x] joint parameter validation;
- [x] door seam and hinge offset calculations;
- [x] constraint evaluation;
- [x] revolute transform composition and motion limits;
- [x] fit-policy evaluation and tolerance diagnostics;
- [x] validation report aggregation and severity/status calculation.
- [ ] prismatic transform composition and motion limits;
- [ ] BOM grouping and quantity calculation;
- [ ] stock-bar planning, kerf, and waste.

These tests should use small synthetic inputs and should not initialize OpenCascade or WebGL. OpenCascade-backed checks belong in a separate geometry test layer.

### Project model tests

For EnclosureV2, test invariants rather than defaults:

- [x] required structural IDs exist exactly once;
- [x] all required profiles are correct;
- [x] side middle supports are symmetric and located at the depth midpoint;
- [x] front top/corner profiles remain 3060;
- [x] the back middle support and top-back tie remain present;
- [x] door count and symmetry remain valid;
- [x] changing principal parameters changes expected dependent lengths;
- [x] invalid dimensions return useful errors;
- [x] panel and door clearance diagnostics are evaluated for valid configurations.

Use a matrix of small and large parameter values. Include near-boundary values so that negative or zero lengths are caught.

### Geometry tests

Geometry tests should be layered:

1. Verify geometry metadata and transforms without generating solids.
2. Generate representative Replicad solids for profiles, boxes, joints, and panels.
3. Check bounding boxes, volume positivity, and expected extents.
4. Add exact intersection/clearance checks only where they protect a manufacturing or safety rule.

Avoid snapshotting large serialized meshes. Mesh snapshots are brittle and obscure the design intent.

### Kinematics and motion-envelope tests

Test deterministic motion independently of rendering:

- [x] revolute states at limits and representative intermediate values;
- [ ] prismatic states at limits and representative intermediate values;
- [ ] nested assembly transform composition;
- [x] invalid motion values and limit diagnostics;
- [x] moving-vs-static and moving-vs-moving collision fixtures;
- [x] minimum-distance results at sampled states;
- [x] adaptive refinement in the generic `motionEnvelope.ts` helper around a deliberately narrow clearance minimum;
- [x] explicit `incomplete` results when the door-sweep state budget is exhausted.

Use Replicad/OpenCascade-backed solids for authoritative intersection and distance fixtures. Three.js bounding boxes may be tested only as an optional broad-phase optimization.

### Manufacturing golden tests

For a small set of named configurations, keep expected structured outputs:

- [ ] grouped BOM entries;
- [ ] cut lengths;
- [ ] panel sizes;
- [ ] connector quantities;
- [ ] cut-plan waste bounds.

The golden data should use stable IDs and normalized numbers, not display-order-dependent strings.

### Frame3DD sidecar tests

Keep structural analysis tests outside the browser runtime:

- [ ] deterministic export tests for node/member topology and stable IDs;
- [ ] fixture tests for material, section, support, and load-case serialization;
- [ ] parser tests using a small checked-in solver-result fixture;
- [ ] round-trip mapping tests from Frame3DD result IDs back to anchors and parts;
- [x] graceful `unavailable` and malformed-input results when the executable is missing or returns malformed output;
- [ ] synthetic-frame tests that verify predictable structural warnings;
- [ ] validation-report tests showing that structural warnings reach the demo and BOM without blocking ordinary rendering.

These tests should not require Frame3DD to be installed. A separately marked integration test may invoke the real executable when the developer or CI environment provides it.

### Renderer smoke tests

Keep a small number of browser-level checks for:

- [ ] the project page loads;
- [ ] the expected groups render;
- [ ] a door can transition between named states;
- [ ] selection resolves to a model part ID;
- [ ] hidden groups do not appear.

Do not make every geometry rule depend on browser automation.

### Regression workflow

For each modeling change:

1. Run TypeScript/build validation.
2. Run lint/format checks.
3. Run pure model, kinematics, and manufacturing tests.
4. Run Replicad/OpenCascade geometry and clearance tests.
5. Run Frame3DD export/parser tests; run the external solver only when available and explicitly enabled.
6. Run a browser smoke test for changed interaction or rendering behavior.
7. Inspect the affected project visually for geometry orientation, validation overlays, and assembly state.
8. Record any intentional change to BOM, cut list, validation report, structural report, or dimensions in the commit description.

The repository currently exposes `npm run build` and `npm run lint`; add a test command when the first pure domain module lands rather than relying indefinitely on constructor assertions.

## Suggested repository evolution

The current `src/lib` should be reorganized into the following modular structure as part of the EnclosureV2 rewrite:

```text
src/lib/
  domain/
    units.ts
    parameters.ts
    geometry.ts
    frames.ts
    anchors.ts
    parts.ts
    assemblies.ts
    constraints.ts
    joints.ts
  catalogs/
    profiles.ts
    materials.ts
    hardware.ts
  manufacturing/
    bom.ts
    cutList.ts
    nesting.ts
    pricing.ts
  validation/
    kinematics.ts
    solidChecks.ts
    motionEnvelope.ts
    fitPolicies.ts
    reports.ts
  analysis/
    frame3dd/
      input.ts
      export.ts
      runner.ts
      result.ts
  geometry/
    replicadAdapter.ts
    joints/
  rendering/
    threeAdapter.ts
    materials.ts
```

This is a destination for the active EnclosureV2 model, not a compatibility layer. It is acceptable to replace the existing renderer-facing architecture directly and remove obsolete files once the new modules compile and the EnclosureV2 checks pass.

## Explicit non-goals

These are deliberately out of scope for the near and medium term:

- [ ] Building a general-purpose replacement for FreeCAD, Fusion, or a full parametric CAD kernel.
- [ ] Supporting a general constraint solver before deterministic anchors, formulas, and validation rules cover the actual projects.
- [ ] Adding Rapier or another browser physics engine for rigid-body simulation, contact, or collision authority.
- [ ] Implementing full solid FEA, structural certification, vibration/fatigue analysis, load certification, or safety certification. The optional Frame3DD path is only simplified structural sanity analysis.
- [ ] Guaranteeing vendor-specific extrusion geometry or hardware compatibility without an explicit catalog entry.
- [ ] Driving a CNC machine directly, controlling tools, or claiming generated output is safe without human review.
- [ ] Automatically inferring all joints, hardware, or manufacturing intent from mesh intersections.
- [ ] Treating visual mesh fidelity as proof of manufacturability.
- [ ] Replacing Replicad/OpenCascade for solid modeling or Three.js for interactive display without a concrete limitation.
- [ ] Adding a full collaborative/cloud project system, account model, or backend before local deterministic generation is reliable.
- [ ] Supporting every export format at once; prefer JSON, SVG, and a small number of reliable solid exports.
- [ ] Running Frame3DD or any structural solver inside the browser, or making it a prerequisite for viewing and generating ordinary project geometry.
- [ ] Making default EnclosureV2 dimensions immutable or using them as universal test fixtures.
- [ ] Keeping stale README promises as if they were implemented features.

## First recommended implementation sequence

The first work should be a focused foundation slice:

1. Establish the unit and coordinate-frame contract.
2. Add a shared 3030/3060 profile catalog.
3. Delete draft project directories and old navigation entries; retain only EnclosureV2.
4. Introduce stable part IDs and a typed evaluated model without preserving `Piece` compatibility.
5. Add declarative anchors and model the EnclosureV2 frame members.
6. Replace throwing/name-based enclosure assertions with reusable constraint results.
7. Add deterministic kinematics, Replicad/OpenCascade solid checks, motion-envelope sampling, fit policies, and structured validation reports.
8. Add the optional Frame3DD exporter, external runner boundary, result parser, and structural-report integration.
9. Generate a typed BOM and extrusion cut list that consume validation reports.
- [ ] 10. Convert doors to generic assemblies and named motion states.
- [ ] 11. Add panel boundaries, panel/door tolerances, and clearance checks.
- [ ] 12. Add hardware/connections, stock optimization, drawings, and configurations only after the core model is stable.

The first meaningful milestone is not a new renderer. It is: **change an enclosure parameter, receive a valid regenerated frame, a constraint report, and a buildable cut list without manually editing transforms.**

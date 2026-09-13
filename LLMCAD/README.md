# LLMCAD: first architecture draft

## Product thesis

LLMCAD is an AI-native, fabrication-first CAD system. It turns a negotiated
design brief and a real user's capabilities into a verified manufacturing
package.

The product is not a chat UI that happens to emit meshes. Its durable source
of truth is a versioned semantic design graph: a machine-readable account of
what every part is, why it exists, what constrains it, and what evidence shows
that it can be manufactured.

The initial vertical is CNC plywood furniture. The system should eventually
support other fabrication methods, but a single domain makes the primitives,
checks, and user capability model concrete enough to evaluate rigorously.

## The design loop

```text
Conversation and requirements interview
        |
        v
Structured brief + capability profile
        |
        v
Semantic design graph
        |
        +--> solve continuous parameters
        +--> generate solids
        +--> verify geometry and manufacture
        |
        v
Named diagnostics and evidence
        |
        v
Agent revises the design graph until requirements pass
        |
        v
Cut files, toolpaths, BOM, and assembly instructions
```

The agent edits semantic operations and declared parameters, never arbitrary
mesh vertices. Every evaluation is deterministic for a fixed design graph,
capability profile, dependency version, and tolerance policy.

## Source of truth

The semantic design graph owns:

- assemblies, parts, material, coordinate frames, parameters, and units;
- manufacturing-aware primitives such as `sheetPanel`, `pocket`, `tabSlot`,
  `dowelHole`, `fastener`, `engraving`, and `decorativeRelief`;
- named requirements, their priority, provenance, and diagnostic text;
- capability facts: machines, work envelopes, cutters, stock, materials,
  tolerances, tools, suppliers, and budget;
- an immutable revision/operation history and evaluation evidence.

The graph must distinguish three kinds of constraints:

| Kind             | Meaning                                     | Example                                         |
| ---------------- | ------------------------------------------- | ----------------------------------------------- |
| Hard requirement | Must pass; no trade-off is permitted.       | All parts fit the CNC work envelope.            |
| Goal             | Minimise or maximise a measurable quantity. | Minimise sheet waste.                           |
| Preference       | A negotiable design direction.              | Give the front and base strong Art Deco motifs. |

This graph is not a Manifold scene, a Ceres problem, a renderer scene, or a
G-code file. Those are evaluated artifacts compiled from it.

## Kernel stack

```text
Semantic design graph                         LLMCAD-owned
        |
        +-- constraint compiler --> Ceres + Eigen
        |                            continuous solve: dimensions and poses
        |
        +-- solid compiler ------> Manifold
        |                            robust CSG and manufacturable mesh solids
        |
        +-- assembly verifier ---> FCL
        |                            collision, clearance, contacts, motion
        |
        +-- ray-query service ----> Embree (optional initially)
        |                            picking, access, visibility, thickness rays
        |
        +-- display adapter ------> mesh renderer
        |
        +-- production adapters --> CAM, slicer, BOM, documents
```

### Dependencies

| Dependency           | Responsibility                                                                                                            | Not responsible for                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Manifold             | Robust manifold mesh solids, CSG booleans, construction operations, and evaluated mesh output.                            | Intent, arbitrary geometric solving, assembly collision policy, or CAM.                   |
| Ceres Solver + Eigen | Nonlinear continuous optimisation of dimensions, transforms, alignment, proportions, and smooth clearance objectives.     | Discrete options, topology changes, CAD semantics, and user-facing conflict explanations. |
| FCL                  | Mesh/primitive collision, nearest distance, tolerance, contact, broad-phase assembly queries, and swept-motion collision. | Creating solids or deciding whether an intersection is an intended joint.                 |
| Renderer             | Visual inspection, selection, overlays, and manipulation affordances.                                                     | Authoritative geometry or constraints.                                                    |
| Embree (later)       | Fast ray queries for picking, tool accessibility, visibility, undercut-like checks, and thickness sampling.               | General collision detection or rendering state.                                           |

Manifold is the fabrication geometry authority. It gives the system a strong
invariant: each finished part is a watertight, oriented manifold mesh.
Manifold validity is necessary but not sufficient; LLMCAD still verifies
minimum feature size, expected components, material thickness, tool access,
and other manufacturing conditions.

FCL evaluates relations between evaluated parts. It should return the named
entities, closest/contact points, normal, measured clearance, and (for motion)
the failing pose. LLMCAD maps that low-level result back to a stable diagnostic.

## Constraint compilation and evaluation

The constraint graph is compiled into the appropriate evaluator, rather than
making any one solver the source of truth.

```text
semantic constraint
  "seat clears armrest by 5 mm while folding"

  -> Ceres: optimise a smooth preferred clearance where applicable
  -> Manifold: construct seat and armrest solids
  -> FCL: find the minimum clearance over the declared motion range
  -> LLMCAD: issue ASM-024 with affected parts, pose, and remediation
```

Boolean/topology transitions are not smooth, so they should not be assumed to
be Ceres residuals. A design change that turns a closed pocket into an edge
opening is a discrete/topological change: evaluate it with Manifold, then let
the agent or a discrete search choose a revised operation graph.

All diagnostics need a stable identifier, severity, source requirements,
involved semantic entities, measured values and units, tolerance, evidence,
and an actionable remediation description. The target is the equivalent of a
compiler or linter report, not an opaque optimisation result.

## First product: CNC plywood furniture

### Capability profile

The first supported user profile contains at least:

- CNC work envelope and hold-down/exclusion regions;
- available cutter diameters, flute lengths, and safe cut depths;
- supported materials, sheet sizes, thickness, costs, and tolerances;
- assembly tools and available fasteners;
- preferred suppliers and maximum budget;
- desired load, use conditions, and safety factor.

### Initial primitives

- sheet panel and 2D outline;
- through-cut, pocket, drilled hole, and engraved relief;
- tab-and-slot and dowel-hole joint;
- fastener and assembly transform;
- mirrored/repeated motif and pattern;
- explicit stock sheet and machining setup.

### Initial verifiers

- valid Manifold solid for every physical part;
- material boundary and minimum web/feature checks;
- cutter-radius, tool-depth, and tool-access checks;
- machine-envelope and clamp-clearance checks;
- assembly collision and declared joint-clearance checks;
- stock containment, cut list, BOM, and cost checks;
- basic structural rules/simplified estimates with named assumptions.

### Initial outputs

- interactive mesh preview;
- SVG/DXF profiles and a documented coordinate/origin convention;
- machine-independent 2.5D toolpath IR plus a first CNC postprocessor;
- cut list, BOM, procurement list, and assembly instructions;
- evaluation report with every passing and failing constraint.

## Delivery sequence

1. Define the graph schema, unit/tolerance policy, and deterministic evaluator
   contract.
2. Implement the capability profile and a small primitive library.
3. Compile primitives to Manifold and implement topology/manufacturing checks.
4. Create a verification report format with stable diagnostics and evidence.
5. Produce real sheet-cut outputs, BOMs, and assembly instructions.
6. Add FCL for assembly clearance and hinge/slide motion checks.
7. Add Ceres once coupled continuous dimensions and placements make direct
   formulas brittle.
8. Let the agent make only validated graph edits; measure whether it resolves
   failures without regressing already-passing requirements.

## Explicit non-goals for the first product

- General editable B-rep/NURBS mechanical CAD.
- STEP as the authoritative format or full CAD round-trip interoperability.
- Arbitrary imported-mesh repair.
- A general-purpose FEM platform.
- Building a full 3D-print slicer or enterprise CAM package.
- Unrestricted agent-written geometry code outside the semantic operation API.

STEP/B-rep support can be added later by compiling semantic operations into an
analytic backend. It should not be reconstructed from a final Manifold mesh.

## Success criterion

The first end-to-end demonstration is not an impressive render. It is a real
user supplying a machine, tooling, material, and a furniture brief; LLMCAD
producing a distinctive design plus manufacturing outputs; then successfully
repairing the design when stock thickness, machine size, tool choice, or a
hard constraint changes.

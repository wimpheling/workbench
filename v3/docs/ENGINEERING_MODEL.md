# Engineering model and evidence boundary

The model uses millimetres, with X right, Y toward the back, Z up. `width_mm`, `depth_mm`, and `height_mm` are the clear structural envelope, not outside dimensions. Four continuous corner posts extend 30 mm below and above that envelope; top and bottom rails butt into their side faces. Roof cross beams support the light roof at one-third and two-thirds depth. Midposts divide the rear-left and rear-right access regions.

Extrusions use the actual retained AST03003004 STEP end face, including slots and internal voids, extruded to the ordered cut length. No section scaling occurs. CBR3030 brackets use the retained supplier STEP solid, but their mounting orientations and fastenings are not confirmed. Both asset contents contribute to the revision fingerprint.

## Doors

Front leaves swing outward from axes outside the front frame. Latches, handles, panel clips and provisional closing stops move with their leaves; no fixed centre obstruction is introduced. Front infills default to glass, bifold infills to wood. The glass is a plain rectangular pane with surface-retention proposals, not a verified glazing system.

Each bifold is an equal-link planar mechanism with vertical hinge axes. In local coordinates its wall pivot is `(0,0)`, its elbow is `(L cos θ,L sin θ)`, and its carriage is `(2L cos θ,0)`. Leaf orientations are `+θ` and `−θ`. Frame centre planes lie 19 mm outward from their hinge-axis links, and are shortened by twice the configured end gap. The permitted nominal range is 0–85 degrees. This is an explicitly proposed axis arrangement; it does not assert that an unmodified CFG hinge plus GSD carriage automatically implements it.

`constraints.solve_bifold_axes` independently solves the second link's orientation using native CadQuery assembly constraints. The first link is fixed at the requested angle; a coincident hinge point, vertical axis and endpoint-in-guide-plane constrain the second link. Its initial orientation is perturbed and its final hinge, guide and link residuals are measured. The solver's successful return alone is never taken as evidence of correctness. Closed and fully folded singular positions are handled by the explicit analytic model rather than this numerical cross-check.

## What remains unproven

- Actual Shapeoko 5 Pro 4×4 swept dimensions, spindle, dust shoe and flexible hose routing; default machine dimensions are placeholders.
- Mounting of the proposed hinge axes with actual supplier components, track/carriage compatibility, strike/stop placement and retention, screw schedules and any supplier drilling.
- CBR3030 orientations, roof-beam and midpost fastenings.
- Door/glass retention, hardware capacity, sag, roof stiffness, real cutting/squareness tolerances and adjustment provisions.

These are explicit ordering blockers, not optional warnings. The supplier pack is suitable for a request for quotation and technical confirmation, not an instruction to purchase. Solid geometry and analytic kinematics provide useful evidence while these facts remain unresolved; they cannot replace them.

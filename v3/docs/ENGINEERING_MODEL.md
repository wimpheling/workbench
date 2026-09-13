# Engineering model and evidence boundary

The model uses millimetres, with X right, Y toward the back, Z up. `width_mm`, `depth_mm`, and `height_mm` are the clear structural envelope, not outside dimensions. Four continuous corner posts extend 30 mm below and above that envelope; top and bottom rails butt into their side faces. Roof cross beams support the light roof at one-third and two-thirds depth. Midposts divide the rear-left and rear-right access regions.

Extrusions use the actual retained AST03003004 STEP end face, including slots and internal voids, extruded to the ordered cut length. No section scaling occurs. CBR3030 brackets use the retained supplier STEP solid, but their mounting orientations and fastenings are not confirmed. Both asset contents contribute to the revision fingerprint.

## Doors

Front leaves swing outward from axes outside the front frame. No fixed centre obstruction is introduced. The right leaf carries an exterior meeting astragal: the permitted domain is right leaf moving with left closed, or left leaf moving with right fully open. Core pose validation and UI controls enforce this order; motion verification evaluates both stages while retaining independent combinations with the bifolds. Front infills default to glass, bifold infills to wood. Continuous opposing retaining beads, edge gaskets and soft face packing replace isolated clips; glass setting support, fixing pitch and compatible rubber profiles remain supplier questions.

Each bifold is an equal-link planar mechanism with vertical hinge axes. In local coordinates its wall pivot is `(0,0)`, its elbow is `(L cos θ,L sin θ)`, and its carriage is `(2L cos θ,0)`. Leaf orientations are `+θ` and `−θ`. Frame centre planes lie 19 mm outward from their hinge-axis links, and are shortened by twice the configured end gap. The permitted nominal range is 0–85 degrees. This is an explicitly proposed axis arrangement; it does not assert that an unmodified CFG hinge plus GSD carriage automatically implements it.

`constraints.solve_bifold_axes` independently solves the second link's orientation using native CadQuery assembly constraints. The first link is fixed at the requested angle; a coincident hinge point, vertical axis and endpoint-in-guide-plane constrain the second link. Its initial orientation is perturbed and its final hinge, guide and link residuals are measured. The solver's successful return alone is never taken as evidence of correctness. Closed and fully folded singular positions are handled by the explicit analytic model rather than this numerical cross-check.

## What remains unproven

- Actual Shapeoko 5 Pro 4×4 swept dimensions, spindle, dust shoe and flexible hose routing; default machine dimensions are placeholders.
- Mounting of the proposed hinge axes with actual supplier components, track/carriage compatibility, strike/stop placement and retention, screw schedules and any supplier drilling.
- CBR3030 orientations, roof-beam and midpost fastenings.
- Door/glass retention, hardware capacity, sag, roof stiffness, real cutting/squareness tolerances and adjustment provisions.

These are explicit ordering blockers, not optional warnings. The supplier pack is suitable for a request for quotation and technical confirmation, not an instruction to purchase. Solid geometry and analytic kinematics provide useful evidence while these facts remain unresolved; they cannot replace them.

## Containment design and verification

`containment_geometry.py` adds overlapping perimeter stops, nominal installed rubber seals, continuous infill retention/packing, bifold meeting membranes, fixed-wall lap joints, roof bearing gaskets, a table interface and an annular roof hose collar. Its source contributes to the model revision. Bifold fixed pivots are at the shared mid-wall jambs, with outward-facing folds. Rubber volumes are installed geometric proposals, not elasticity solutions; potential deformation/contact interactions remain unknown rather than being exempted from collision checking.

The passive inlet uses a rectangular right-wall cutout and supplier-cut wood baffles with two changes in direction. Its minimum passage is compared with a declared two-times-hose-area design allowance. Geometric obstruction and straight opening-to-exit paths are checked independently of airflow performance. There is no assumed extractor capacity, pressure loss, cooling rate or filter efficiency. See the exported seal/airflow notes and source references for the installation evidence required.

Containment checks subtract actual solids from mandatory barrier regions with declared overlap and cut allowances. They also derive pane/frame edge gaps independently, check the actual collar annulus and bore, and measure inlet passages. The report explicitly retains the distinction between local barrier coverage, complete enclosure-boundary evidence and physical dust performance. The supporting table is not silently included as a supplied part.

Fixed wood panels now overlap the full 30 mm structural border. A nominal 2 mm continuous gasket separates each panel from its frame; the roof also sits on perimeter gasket and roof-beam bearing pads. A 3 mm bottom gasket requires a continuous, flat supporting tabletop at Z = −33 mm. That tabletop is explicitly not supplied or confirmed by this model.

The door running gaps remain. Fixed backing/stop strips and fitted rubber bridge those gaps behind the closed leaves, including the bifold header space. At the shared fixed-panel/bifold jamb the stop mounts outside the overlapping wood panel; the other perimeter stops have backing strips to reach the same plane. These are proposed cut-stock arrangements whose fastening schedules and actual compression profiles still require supplier confirmation.

The right front leaf carries the exterior astragal. The enforced operating domain is: open the right leaf fully, then open the left; close the left, then close the right. Requests violating that sequence are rejected. Each bifold has an exterior flexible meeting cover whose real folding, attachment and fatigue behaviour remain unresolved; its displayed rigid transform is not a rubber-deformation simulation.

Each infill has continuous opposing retaining beads, a full-depth edge gasket, and soft packing bridging each pane face to its retaining bead. Those installed surfaces meet nominally; the selected rubber profile, preload, glass setting support and fastener pitch are not certified by the nominal geometry.

The passive right-wall makeup inlet uses supplier-cut panels forming two turns: air enters the bottom of the outer channel, passes above an internal upright, then reaches the wall opening. The bottom return and upright block a direct diagonal path from the wall opening to the external throat. At the default 6 mm material thickness its narrowest modeled passage is 16,632 mm², compared with the 100 mm hose's 7,854 mm² cross-section. The factor-of-two area target is a declared geometric design allowance, not a flow-rate or extraction-performance guarantee. Larger hoses or thicker material can invalidate that target. The vacuum exhaust must remain outside the enclosure.

The roof collar is a real annulus, including the roof cutout, flange and nominal gasket. Hose attachment, independent hose support and dust-shoe routing remain supplier/installation checks. Local barrier coverage is checked against actual CAD solids; complete pressure containment, rubber performance, room airflow and extraction adequacy still require physical commissioning.

The guide track now sits overhead at `H + 80 mm`, with its carriage at `H + 63 mm`. A proposed supplier-fabricated dogleg adapter routes from the second leaf's outer face below the header, up a 6 × 30 mm outer leg at local normal 145 mm, and back above the header to the slider axis. Its four cut-stock members have explicit mating features and are verified as rigid nominal solids. This preserves the validated equal-link kinematics while keeping the entire guide passage out of the header seal. The outer leg retains more than 4 mm nominal header clearance at 85 degrees. The old buried-guide placement has an adversarial CAD intersection regression. Adapter strength, bearings, fabricated connections and stationary track supports remain quotation/engineering requirements; the design does not ask the customer to fabricate this adapter.

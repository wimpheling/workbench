# Engineering model and evidence boundary

Latest intent — 2026-09-14: a **simple enclosure, not a hermetic seal**. Bottom gaps on both bifolds are intentional, not missing-seal failures. One original PETG swing lever and keeper across each folding joint now provides light manual retention; lift before opening. No magnets or bottom hardware return. See [swing-latch design](SWING_LATCHES.md) for mounting, prints, sourcing and remaining physical fit checks. This supersedes earlier absent-retention and mandatory-bottom-continuity statements below.


Current change — 2026-09-14: user requested removal from **both bifolds** of the bottom perimeter seals/backing and complete closed catches. The unsupported bottom rigid strips are removed with their backing. No GN4470 magnets, strikes, PETG holders or dedicated M5/M6 fixings remain in the active inventory, schedules or print exports. Vendor assets and prior sourcing studies are retained as history only. Both lower openings are now unsealed and closed-door retention is absent. Bottom containment obligations remain active; uncovered area must report failure. Four 88° travel stops and stock metalwork remain. No parked catches are reinstated.


The model uses millimetres, with X right, Y toward the back, Z up. `width_mm`, `depth_mm`, and `height_mm` are the clear structural envelope, not outside dimensions. Four continuous corner posts extend 30 mm below and above that envelope; top and bottom rails butt into their side faces. Roof cross beams support the light roof at one-third and two-thirds depth. Midposts divide the rear-left and rear-right access regions.

Extrusions use actual retained AST03003004 and AST03006006 supplier STEP end faces, including slots/voids, swept without section scaling. Left/rear top headers use 3030; the front uses upright 3060 with a common top datum. See [frame headers](FRAME_HEADERS.md) for the adapter connection and conditional beam assessment. Asset contents contribute to the revision fingerprint. CBR3030 bracket orientations and fastening remain provisional.

## Doors

Current completion details are in [STANDARD_METALWORK.md](STANDARD_METALWORK.md)
and [STANDARD_BIFOLD_HARDWARE.md](STANDARD_BIFOLD_HARDWARE.md). Standard corner
plates and stock steel carriers replace the earlier unconnected-frame and
printed-carrier proposals. Four operating travel stops and two closed GN4470
kits are modeled; parked catches remain removed. Handle geometry comes from
drawings, not STEP.
Partial calculated masses deliberately exclude unselected hardware and cannot
establish hinge capacity. Earlier prototype descriptions below are historical
where superseded by these completion details.

For 4 mm Lexan bifolds, surface retaining beads are replaced by a **provisional
slot-captured FSP08 study**. The vendor PDF is retained in assets; no public
vendor STEP was found. The installed section and 45-degree mitres are
drawing-based approximations. Nominal daylight + 6 mm gives the default cuts;
thermal/cutting allowances are recomputed for other dimensions. The UI exposes
cut sizes and ordering warnings, while verification independently checks nominal
expansion reserve and assumed lip engagement. FSP08 PVC compatibility, minimum
retention, corner sealing, setting support and frame connector layout are
unconfirmed. See [calculation/provenance](../backend/enclosure/assets/FSP.md).

Both bifold hinge lines now use the retained Elesa+Ganter CFG.30/30 SH-6-C33
STEP assembly: two independently moving molded leaves and the real pin, including
knuckles and countersunk holes. Three complete hinges per joint give twelve
complete hinges across the two bifolds. Source geometry is never scaled or
reconstructed; see [asset provenance and datums](../backend/enclosure/assets/CFG3030.md).
Frame and interleaf mounting faces are oriented oppositely about their common
pin datums. This supersedes the earlier wing-envelope representation, not the
outstanding screw/insert, tolerance and load validation requirements.

Front leaves swing outward from axes outside the front frame. No fixed centre obstruction is introduced. The right leaf carries an exterior meeting astragal: the permitted domain is right leaf moving with left closed, or left leaf moving with right fully open. Core pose validation and UI controls enforce this order; motion verification evaluates both stages while retaining independent combinations with the bifolds. Front infills default to glass, bifold infills to wood. Continuous opposing retaining beads, edge gaskets and soft face packing replace isolated clips; glass setting support, fixing pitch and compatible rubber profiles remain supplier questions.

Each bifold uses the revision C offset, unequal-link mechanism in `bifold.py`. The left opening spans half the depth; the rear opening defaults to 750 mm (`back_opening_width_mm`). Parking pivots are at the rear-left and rear-right corners. Both open outward to 88°. CFG.30/30 hinges use 5 mm jamb/meeting gaps; the secondary leaf is 40 mm wider. Default leaf widths are 384.75/424.75 mm left and 347.5/387.5 mm rear, all 834 mm high. Bifold infills default to 4 mm polycarbonate.

The closed pin-to-pin vector is `(primary_width + 5, 46)` and the elbow-to-guide vector is `(secondary_width - 12.5, -23)` in face-local coordinates where positive Y points inward. The slider normal is 23 mm from the frame pin. The continuous asin closure branch determines the secondary angle. Backend and browser poses share these published datums. The old native equal-link constraint solver does not certify this mechanism: its evidence is explicitly unknown. Independent interval/trigonometric bounds enclose offset-link motion; overlapping bounds remain unknown, not collision-free.

## What remains unproven

The GN753.1 roller and GN753.2 bushes now also use intact vendor STEP solids,
including the recessed bearing faces and the bushes' centring collars. Both
collars face into the bore, leaving a nominal 1 mm tip gap. See
[source files and mounting datums](../backend/enclosure/assets/GN753.md).
This supersedes the previous roller/bush annulus envelopes, but not the
provisional spacer, fasteners, printed track, custom metal carrier or load/retention evidence.

- Actual Shapeoko 5 Pro 4×4 swept dimensions, spindle, dust shoe and flexible hose routing; default machine dimensions are placeholders.
- Mounting of the proposed hinge axes with actual supplier components, track/carriage compatibility, strike/stop placement and retention, screw schedules and any supplier drilling.
- CBR3030 orientations, roof-beam and midpost fastenings.
- Door/glass retention, hardware capacity, sag, roof stiffness, real cutting/squareness tolerances and adjustment provisions.

These are explicit ordering blockers, not optional warnings. The supplier pack is suitable for a request for quotation and technical confirmation, not an instruction to purchase. Solid geometry and analytic kinematics provide useful evidence while these facts remain unresolved; they cannot replace them.

## Containment design and verification

`containment_geometry.py` adds proposed stops, seals, infill retention, fixed-wall lap joints, roof/table gaskets and the hose collar. Bifold heads use exterior hoods and angled brush studies: nominal sections and their contact chain are checked, while carrier/bristle deflection remains unresolved. Retail Tesa 05422 meeting-wipe candidates adhere only to secondary meeting stiles and disengage from primary leaves on opening. Custom meeting clamps are removed and handles mount directly to frames. Width/stock length are sourced; section, adhesive band and suitability for this use remain unconfirmed. Rigid animation is not a deformation simulation.

The passive inlet uses a rectangular right-wall cutout and supplier-cut wood baffles with two changes in direction. Its minimum passage is compared with a declared two-times-hose-area design allowance. Geometric obstruction and straight opening-to-exit paths are checked independently of airflow performance. There is no assumed extractor capacity, pressure loss, cooling rate or filter efficiency. See the exported seal/airflow notes and source references for the installation evidence required.

Containment checks subtract actual solids from mandatory barrier regions with declared overlap and cut allowances. They also derive pane/frame edge gaps independently, check the actual collar annulus and bore, and measure inlet passages. The report explicitly retains the distinction between local barrier coverage, complete enclosure-boundary evidence and physical dust performance. The supporting table is not silently included as a supplied part.

Fixed wood panels now overlap the full 30 mm structural border. A nominal 2 mm continuous gasket separates each panel from its frame; the roof also sits on perimeter gasket and roof-beam bearing pads. A 3 mm bottom gasket requires a continuous, flat supporting tabletop at Z = −33 mm. That tabletop is explicitly not supplied or confirmed by this model.

Bifold side gaps are 5 mm, bottom gap 3 mm and guide headroom 55 mm. Sealing and brush engagement still need detailing. Polycarbonate infills use the provisional FSP08 slot study; other materials retain surface beads. No failed sealing or hardware interaction is waived.

The right front leaf carries the exterior astragal. The enforced operating domain is: open the right leaf fully, then open the left; close the left, then close the right. Requests violating that sequence are rejected. Each bifold has an exterior flexible meeting cover whose real folding, attachment and fatigue behaviour remain unresolved; its displayed rigid transform is not a rubber-deformation simulation.

Each infill has continuous opposing retaining beads, a full-depth edge gasket, and soft packing bridging each pane face to its retaining bead. Those installed surfaces meet nominally; the selected rubber profile, preload, glass setting support and fastener pitch are not certified by the nominal geometry.

The passive right-wall makeup inlet uses supplier-cut panels forming two turns: air enters the bottom of the outer channel, passes above an internal upright, then reaches the wall opening. The bottom return and upright block a direct diagonal path from the wall opening to the external throat. At the default 6 mm material thickness its narrowest modeled passage is 16,632 mm², compared with the 100 mm hose's 7,854 mm² cross-section. The factor-of-two area target is a declared geometric design allowance, not a flow-rate or extraction-performance guarantee. Larger hoses or thicker material can invalidate that target. The vacuum exhaust must remain outside the enclosure.

The roof collar is a real annulus, including the roof cutout, flange and nominal gasket. Hose attachment, independent hose support and dust-shoe routing remain supplier/installation checks. Local barrier coverage is checked against actual CAD solids; complete pressure containment, rubber performance, room airflow and extraction adequacy still require physical commissioning.

Revision C replaces the floating overhead track and dogleg with five PETG modules per default opening, bolted into two tapped rows of 8 mm steel adapters, each attached to the single underside slot of a continuous 3030 header. Native solids cut the 23 mm cavity, M4 holes and alignment recesses; separate 4 mm keeper strips leave a 10 mm throat. The vertical GN753.1 roller axis, steel M4 axle, M6 large washer and metal spacer are modeled. The carrier is an 18 mm cut of 80 × 40 × 6 stock steel angle with an R7 root, two M6 clearance holes on 30 mm centres and an M4 axle hole. Its mounting face and axle datums are checked independently. Keeper strips now use 20 × 4 stock with end bevels; notched R4 stock-angle ends bolt through flush M4 countersunk screws. A further 4 mm metal spacing ring lowers the shelf beneath the rail screw-head allowance; axle head, two vendor STEP bushes, lower washer and locknut are included. Fastener/spacer envelopes and clamp/load capacity remain unconfirmed. These changes supersede the standalone study's carrier stack, not its rail-module dimensions. No updated carrier STL or manufacturing release is implied.

The left/rear 3030 headers meet square-cut without a corner relief. Two protruding bottom CBR3030 brackets are replaced by candidate CIB08T slot connectors using retained supplier STEP geometry; slot engagement, installation access and joint strength remain unconfirmed. This is a quotation request, not permission to omit structural connections. Rigid perimeter backing stays clear of the free-stile/gusset swing. Two closing tabs per opening are 60 mm cuts of 50 × 4 steel flat stock with two fixing stations each. Parked operating stops are modeled; stop impact capacity and catch installation remain unresolved.

Prepared exterior head hoods clear the framing without reliefs. The angled brush has an explicit unselected root/reach/drop study, not approved vendor geometry. Separate hood/wipe coverage sections and a contact chain replace the former inner-cover plane check; flexible carrier interference remains unknown. Board access checks the entire swept board up to a final position centred in the enclosure. This proves only the declared straight loading path, conditional on workshop approach space. Print coupons before full-door use; no printed load rating is asserted.

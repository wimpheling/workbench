# Inset front doors — geometric prototype

The front uses two simple outward-swinging 3030 doors. There is no fixed centre
post. The completed bifold mechanisms, infill cuts, guides, swing latches and
bottom Design notes tab are preserved.

## Closed fit and operation

Coordinates are millimetres: front structural face Y=-30; enclosure interior is
positive Y. Both door profile fronts are Y=-24 (6 mm inset), backs Y=6. They
occupy the front aperture and extend into the enclosure, rather than standing
forward of the frame. Handles and hinge barrels project for operation.

At the default 1674 × 870 opening, each door frame is 829.5 × 862, with 5 mm
jamb gaps, 5 mm between doors, and 4 mm top/bottom gaps. The horizontal gaps
follow the fixed CFG mounting pitch; the clearance parameter sets the front
top/bottom gaps. The hinge axes are
(2.5, -38) and (1671.5, -38), with stations Z=120, 435, 750. Each CFG mounting
face is 8 mm behind its pin axis. A 26 × 36 × 6 aluminium spacer under each
moving wing connects that face to the inset door. Vendor solids are articulated
without scaling or modifying their shape; the fixed wing and pin stay fixed.

Open **right fully, then left**; close **left fully, then right**. Nominal travel
is 100° per door. The 40 mm meeting strip is offset 10 mm onto the right door:
it covers the centre gap and reaches the owning stile's slot without hitting
the left handle during the first degree of opening. The default strip/left-handle
X separation has a conservative all-angle lower bound of 1.928 mm, computed
from the strip corner radius about its actual hinge axis. A centred strip failed that
check and must not be substituted. The backend and browser enforce this order.

The stated angle is a motion limit, not a rated physical stop or hold-open
mechanism. Hinge capacity for these wide glass leaves, sag, adjustment, screw
engagement, closure retention and abuse/impact loads remain unvalidated. Use
light manual operation during prototype trials; no latch force is specified.

## Corner and closing-strip connections

Eight CJP3030L plates connect the door corners on their inward faces, using
the same drawing study and five M6 fixing schedule as the bifolds. Four more
CJP3030L plates connect the **front faces of the fixed frame corners**, replacing
CBR3030 angles that intruded into the door opening. Their open quadrants face
the aperture; the remaining side-rail brackets are retained. Counts for the
whole enclosure are 28 CJP3030L plates and 18 complete CFG hinges (12 bifold,
6 front). Corner-plate radii, fasteners and joint stiffness remain unapproved.

Rear closing strips use 12 mm rigid backing against the frame. Their front
faces are Y=12; the nominal flexible seals span Y=6…12. The rigid strips now
continue around the corners instead of leaving unsupported seal ends:

- Each default jamb strip is 850 × 30 × 2 mm. Two 20 × 22 mm open-end
  reliefs clear the side-rail brackets while retaining 10 mm inner tongues.
  The existing backing remains 806 mm long; each tongue cantilevers 22 mm.
- Head and sill strips are each 1674 × 30 × 2 mm, with no left-header notch.
  The front opening is now 870 mm beneath the upright beam; see [headers](FRAME_HEADERS.md).
- Gasket blanks are two 850 × 13 × 6 mm jambs and two 1680 × 13 × 6 mm
  horizontal strips. Bond/vulcanise their butt joints into a continuous surround.
  Root/corner reliefs follow actual fixed backing, bracket and header solids;
  the installed gasket does not occupy those metal volumes or fill inaccessible
  extrusion pockets. The square left-header junction no longer needs the former
  separate foam end plug. Deflection around moving corner plates remains unvalidated.

The rear perimeter and exterior meeting strip sit at different depths. Two
fixed **L-shaped flexible end boots** connect them at the head and sill. Each
comprises a 30 × 42 × 4 mm installed saddle within the existing door gap and a
30 × 1 × 10 mm front apron. Bond the apron to the frame front face and saddle;
bond the saddle to the rear gasket. The astragal end wipes the saddle. The
apron wraps around the extrusion's rounded edge and projects 1 mm ahead of
its front face. There is no vertical centre post and no change to closing order.

The meeting check follows three connected sections: the main astragal section
and the head/sill returns at the frame front face. Together they retain the
**entire original 0…H seam obligation**, with 2 mm overlap and 1 mm total cut
allowance. Connections from frame to apron, saddle, astragal and rear gasket
are checked against actual solids. Removing end pieces, shifting a seal or
cutting a hole must fail coverage or connection checks.

These are installed section studies, not selected gasket products. The strip
reliefs, bonded joints and end boots still require supplier preparation and
physical trials. Tongue stiffness, attachment pitch, adhesive, free section,
compression and wiping wear are unapproved. The meeting gasket retains an
assumed 3 mm installed section. Nominal coverage does not establish chip/dust
performance, a hermetic enclosure or purchase readiness.

## Slot-captured front infill

The glass target is **4 mm everywhere**. The default front panes now use the
same drawing-based **FSP08 candidate** as the bifolds, within its documented
3–5 mm panel range. Its installed lip shape remains a study, not vendor STEP
or approval of glass retention. The default bifolds remain 4 mm polycarbonate;
selecting glass for them also uses the shared 4 mm glass target, while retaining
the alternative-material bifold retention arrangement.

Default front cuts are **775.5 × 808 × 4 mm**, two panels. Each has nominal
3 mm slot engagement and 2 mm reserve per edge, based on an assumed 5 mm usable
slot depth. Glass uses a provisional 9×10⁻⁶/K expansion coefficient over 40 K;
confirm the actual grade and environment. The default inventory includes 24
FSP08 candidate inserts: eight front and sixteen unchanged bifold inserts.

Four mitred inserts surround each front pane. Assemble the frame around the
panel; do not drill or trim tempered glass in the workshop. Glass dead-load
setting support, minimum engagement, impact/pull-out retention, exact holder
section, compound, corners and installation need approval before cutting.
The existing FSP08 PVC/Lexan compatibility blocker remains unchanged on the
four bifold panes. Supplier schedules retain `NOT RELEASED` status.

For alternate front infill, glass within 3–5 mm uses the FSP08 candidate;
thicker glass and wood use the separate unselected adapted section study.
Maximum studied thickness remains 6 mm. Thicker infill fails the thickness
check and requires redesign; wood moisture movement remains unresolved.

## Verification scope

Backend checks measure the closed front datum, actual extrusion/panel/holder
fit, supplier hinge geometry and staged motion. Regression checks sample
both complete opening paths at one-degree intervals with native solids;
closing traverses those same paths in reverse. The production interval verifier
also examines continuous travel and the full workpiece insertion prism.
Unresolved bounds around hinge contact and nonrectangular parts remain unknown;
finite samples are not a continuous collision-freedom proof. Physical flexible
seal behaviour, tolerance stacks, sag and hardware performance remain untested.

The front seam tests now pass all seven sections covering the five original
perimeter/meeting obligations, plus 25 nominal support/junction connections.
They also cover the minimum and maximum opening/clearance settings and reject
removed, displaced and perforated sealing details. Actual support-tongue
footprints are checked separately. The full-model report at revision `0a548259ccad9236` has **zero failures**:
1675 pass and 122 unknown checks, hence `incomplete`. Both inset checks and the
continuous board-insertion prism pass. Continuous motion accounts for 61,840
pairs, with 61,479 resolved, 361 unresolved and no collision witnesses. The new
flexible junctions retain unvalidated wiping/contact bounds.

Validation passed: **187 backend tests, 45 frontend tests and two real-browser
tests**, plus type checking, build and Ruff. The backend emitted 12 upstream
deprecation warnings, with no failures or errors. Open/closed browser captures
and bottom Design notes were inspected. Full commands and results are recorded in [the current task](../../tasks/done/front-glass-and-seal-junctions.md).
The [first delivery task](../../tasks/done/front-door-fit-and-gaskets.md) records
the earlier 6 mm version and its then-unresolved front coverage failures.

# Inset front doors — geometric prototype

The front uses two simple outward-swinging 3030 doors. There is no fixed centre
post. The completed bifold mechanisms, infill cuts, guides, swing latches and
bottom Design notes tab are preserved.

## Closed fit and operation

Coordinates are millimetres: front structural face Y=-30; enclosure interior is
positive Y. Both door profile fronts are Y=-24 (6 mm inset), backs Y=6. They
occupy the front aperture and extend into the enclosure, rather than standing
forward of the frame. Handles and hinge barrels project for operation.

At the default 1674 × 740 opening, each door frame is 829.5 × 732, with 5 mm
jamb gaps, 5 mm between doors, and 4 mm top/bottom gaps. The hinge axes are
(2.5, -38) and (1671.5, -38), with stations Z=120, 370, 620. Each CFG mounting
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

Rear closing strips use 12 mm rigid backing against the frame. The top strip
starts 18 mm from the left opening edge, giving 3 mm nominal clearance to the
3060 header; its backing also starts at 18 mm. Their front
faces are Y=12; the nominal flexible seals span Y=6…12. Jamb backing/strips end
32 mm from the top and bottom to clear the existing side-rail brackets. Seal
end support, corner transitions, attachment pitch, compression and actual
perimeter/meeting products remain unresolved. The perimeter and meeting coverage checks
retain their full obligations: these strips do not establish closed corner
returns at the head and sill, and missing coverage remains a failure. Rubber
envelopes occupy the aperture side of the backing; deflection against the
2 mm corner plates remains unknown. The meeting gasket has an assumed
3 mm installed section, with its free section and preload unselected. These are chip-containment
studies, not evidence of a hermetic enclosure or purchase-ready gaskets.

## Slot-captured front infill

The default 6 mm glass uses the bifolds' inward-slot arrangement, with a
separate **unselected thin-wall holder study** sized for the actual front
thickness. FSP08's documented panel range is 3–5 mm; it is **not specified for
6 mm glass**. The adapted installed section is an assumed EPDM candidate,
not vendor CAD and not a new catalogue product. Maximum studied front
thickness is 6 mm; thicker glass or wood remains selectable for exploration
but fails the holder-thickness check and requires redesign.

Default front cuts are 775.5 × 678 × 6 mm, two panels. Each has nominal 3 mm
slot engagement and 2 mm reserve per edge, based on an assumed 5 mm usable
slot depth. Glass uses a provisional 9×10⁻⁶/K expansion coefficient over 40 K;
confirm the actual grade and environment. Wood's provisional thermal allowance
does not establish moisture movement or durable edge retention.

Four mitred inserts surround each front pane. Assemble the frame around the
panel; do not drill or trim tempered glass in the workshop. Glass dead-load
setting support, minimum engagement, impact/pull-out retention, exact holder
section, compound, corners and installation need approval before cutting.
The existing FSP08 PVC/Lexan compatibility blocker remains unchanged on the
four bifold panes. Supplier schedules retain unselected product entries and
`NOT RELEASED` status instead of assigning FSP08 to the front glass.

## Verification scope

Backend checks measure the closed front datum, actual extrusion/panel/holder
fit, supplier hinge geometry and staged motion. Regression checks sample
both complete opening paths at one-degree intervals with native solids;
closing traverses those same paths in reverse. The production interval verifier
also examines continuous travel and the full workpiece insertion prism.
Unresolved bounds around hinge contact and nonrectangular parts remain unknown;
finite samples are not a continuous collision-freedom proof. Physical flexible
seal behaviour, tolerance stacks, sag and hardware performance remain untested.

The full-model run reports zero rigid collision failures, passing inset checks
and a clear continuous insertion prism for a 1219.2 × 1219.2 × 100 mm board
at Z=600. Continuous motion remains unknown: 61,040 pairs, 60,699 resolved,
341 unresolved, no collision witnesses. The five front perimeter/meeting
coverage checks and their containment requirement fail; no other requirement
is claimed failed by this nominal run. See the front-door task for final test
results and remaining physical evidence.

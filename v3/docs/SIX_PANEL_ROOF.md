# Six-panel roof prototype

## Layout

The accepted transport layout is two columns by three rows. Retain the two
full-width 30×30 crossbars at one-third and two-thirds of the enclosure depth.
Add three short 30×30 centreline members, each ending against the existing
crossbars or outer frame rather than crossing another extrusion. Every beam
top stays at H+30; all six panel undersides are at H+32 in the nominal gasket
study. The outer frame and upright 30×60 front beam are unchanged.

Default enclosure: W=1674, D=1649, H=900, panel thickness 6 mm. Keep the current
wood material study; grade, flatness and stiffness require confirmation.
Panel-to-panel seams have 2 mm gaps centred on supporting beams.

| Parts | Quantity | Nominal cut, mm |
| --- | ---: | --- |
| Left/right front and rear panels | 4 | 866 × 578.667 × 6 |
| Left/right middle panels | 2 | 866 × 547.667 × 6 |
| Front/rear centreline members | 2 | 534.667 long, 30×30 |
| Middle centreline member | 1 | 519.667 long, 30×30 |

These are model dimensions, not rounding or fabrication-tolerance instructions.
The quotation includes six separate panel drawings/cut entries and the three
additional profile lengths. Cuts recalculate with enclosure dimensions.

## Height and hose routing

The owner selected a 900 mm frame-height candidate, 160 mm above the earlier
740 mm design, for additional hose-routing space. Frame tops are at 930 mm;
panel undersides are at 932 mm and panel tops at 938 mm with the default gasket
and panel thickness. Crossbar undersides are at 900 mm; underside straps
extend to 897 mm. The deeper front header has an 870 mm clear opening.

The actual setup is an original Shapeoko 5 Pro with a Makita trim router,
standard Sweepy V2 and Nilfisk AERO 21-21 PC. Keep the current 600 mm machine
envelope as an explicit unconfirmed assumption; the additional space is not
a verified hose-motion allowance. A supported loop and guide near the router
are the proposed routing concept, but support hardware and flexible hose
geometry are not modeled. Validate X/Y/Z travel, homing and tool-change
positions for tension, bending, droop and contact before approving the height.
The taller doors also need renewed mass, hinge/guide load and sag assessment.
The polycarbonate infill cuts are 779.8 mm high: the thermal study increases
vertical edge reserve to 2.1 mm, leaving 2.9 mm nominal engagement and a
0.8024 mm conservative minimum-engagement bound. This is less than the earlier
1 mm test margin; physical retention remains unapproved. No verification
threshold or assumed slot depth has been relaxed to accept the taller panes.

## Support joints and removal

Two 150×30×3 mm underside steel straps bridge the centreline/crossbar joints,
with five M6 countersunk fixing stations each. A 90×30×3 mm rear strap uses
three stations. Each station aligns with an underside slot in the corresponding
member. Nominal countersinks are 90°, 12 mm diameter over 6.5 mm holes.

The front beam is 30 mm deeper than the centre member. A proposed 30 mm tall,
3 mm steel angle with 30×30 mm legs in plan connects the centre member's side
slot to the front beam's inner face/upper slot row. Its two fixings use M6
screws/slot nuts. This keeps the connection above the front-door seal backing.
The model uses square-root nominal geometry: real root radius, washers, access,
fastener lengths, clamping stiffness and load capacity need approval. These
connections are supplier-prepared studies, not sourced rated assemblies.

Panels lift off after releasing their clamps. Perimeter/seam clamp tabs into
the frame's top slots are proposed; actual clamp products, positions, bolt
lengths and panel-edge reliefs remain unresolved. No guessed fixing holes are
released. Plan to remove left panels first so the open roof provides access
towards the right, which is against a wall. Actual reach and removal clearance
need a physical check; six small panels do not prove access to every fixing.

## Gasket grid

Candidate: [EMKA 1016-16](https://www.emka.com/products/1016-16), self-adhesive
EPDM sponge strip, 15 mm wide and 3 mm free thickness, supplied in 10 m lengths.
The model assumes **2 mm installed height**, which is a provisional compression
study, not manufacturer approval. Adhesion, clamp spacing, panel flatness and
compression require detailed validation.

Four perimeter strips, two transverse strips and three centreline segments
form a single-height grid. Butt junctions meet without stacked foam. Centreline
segments stop at transverse-strip edges; transverse strips join the side seals.
Each panel has gasket contact on all four sides. Continuous coverage checks
span the panel seams and their junctions; removing a centre segment fails them.
Bonded junctions, actual compression and leakage still need physical testing.

## Hose interface

The opening is centred in the **middle-left panel**, at X=403, Y=824.5 by default,
clear of the new centreline support and both crossbars. Collar, collar gasket,
clearance reference, cut drawing and bore verification use the same datum and
explicit panel ID. The existing configurable 100 mm hose / 110 mm cutout is
retained as a placeholder, not a confirmed Nilfisk hose specification. Measure
the actual hose outside diameter, connector, dust-shoe interface and bend radius
before releasing the cut. The maximum modeled hose diameter also clears the
support layout at the tested parameter limits.

Support the hose independently; check slack and full machine travel. Disconnect
and support it before removing this panel. A split quick-removal hose fitting
is not modeled or selected. Roof members and panels are not a shelf.

## Validation boundary

The backend checks real panel gaps, support contacts, gasket bearing/seam
coverage and the offset opening, including minimum/maximum enclosure dimensions.
Supplier packs include `roof-layout.json`, this guide and ordinary panel/profile
schedules. Connection strength, panel retention, physical reach, sag, seals and
hose motion remain unresolved. The roof design task tracks those outstanding
details separately from the accepted six-panel layout.

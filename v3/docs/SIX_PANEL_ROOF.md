# Six-panel roof prototype

## Layout

The transport layout is two columns by three rows. Two full-width crossbars
and three short centreline members now use **horizontal 60×30 profiles**
(Reiman AST03006006), giving adjacent panels separate upward-facing slots.
The wider members stay 30 mm high; beam tops remain H+30 and panel undersides
H+32 in the gasket study. Perimeter left/right/rear rails remain 30×30 and the
front header remains upright 30×60. The complete frame therefore has six
30×60 profiles: the front header plus these five internal roof members.

Default enclosure: W=1674, D=1649, H=900, panel thickness 6 mm. Keep the current
wood material study; grade, flatness and stiffness require confirmation.
Panel-to-panel seams have 2 mm gaps centred on supporting beams.

| Parts | Quantity | Nominal cut, mm |
| --- | ---: | --- |
| Left/right front and rear panels | 4 | 866 × 578.667 × 6 |
| Left/right middle panels | 2 | 866 × 547.667 × 6 |
| Front/rear centreline members | 2 | 519.667 long, horizontal 60×30 |
| Middle centreline member | 1 | 489.667 long, horizontal 60×30 |

These are model dimensions, not rounding or fabrication-tolerance instructions.
The quotation includes six separate panel drawings/cut entries and the three
centre profile lengths and updated crossbar sections. Cuts recalculate with enclosure dimensions.

## Height and hose routing

The owner selected a 900 mm frame-height candidate, 160 mm above the earlier
740 mm design, for additional hose-routing space. Frame tops are at 930 mm;
panel undersides are at 932 mm and panel tops at 938 mm with the default gasket
and panel thickness. Crossbar undersides are at 900 mm; purchased support brackets stay
between 902 and 928 mm. The deeper front header has an 870 mm clear opening.

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

Six purchased **Reiman / Wolweiss CBR3030** brackets connect the three centre
members to the front, crossbars and rear. Each is on the right side of the
centre member, engaging its side slot and the adjoining beam's side slot.
The intact supplier STEP is transformed without trimming locating tabs.
The wider crossbars shorten the centre pieces to avoid any crossed extrusion.
Wolweiss catalogue page 168 specifies two M6×14 socket screws, two ISO 7089 M6
washers and two slot-8 M6 nuts per bracket. These replace the earlier M6×12
candidate; installed seating, engagement and tool access remain to validate.

Each panel uses **its own through-hole screws and OBO 3403092 washers**
(30 mm OD × 6.4 mm ID × 1.3 mm). No washer bears on two panels. The internal
support's two slot axes are 30 mm apart; each screw is 14 mm inside its panel's
edge at a 2 mm seam. All 7 mm wood holes are full bores inside rectangular
blanks: no edge notches, interlocking tabs or special metal plates are needed.
At a seam a washer projects 1 mm beyond its own panel edge, leaving 1 mm nominal
clearance to the neighboring wood; dimensional variation still needs checking.
The two rows are staggered by 24 mm along each shared support so washers do
not touch one another. Simply staggering screws on the former single-slot
30×30 supports could not have provided this independent mounting.

Default hardware: **84 individual panel fixings**, 14 per panel. Include
84 OBO washers, 96 slot nuts and 96 M6 screws (84 roof + 12 bracket), plus
12 ISO 7089 bracket washers. The greater hardware count and wider internal
members are the tradeoff for independent retention. Panel dimensions and
roof height are unchanged. Fixing pitch is at most 250 mm, with station
patterns offset ±12 mm from nominal 75 mm end setbacks. This pitch is a
study, not a panel-bending or gasket-pressure approval. Quantities recalculate
with enclosure size.

M6×16 roof screws are candidates for the default 6 mm wood stack: nominal
shank probes clear the slot floor, while M6×18/M6×20 hit it. Changing wood
thickness requires reselection. Bracket probes include the 1.6 mm ISO 7089
washer under an M6×14 screw. Nut threads, actual screw-head seating and
installation are not proved by a shank-clearance check. Screws and nuts are
scheduled rather than represented by invented supplier CAD.

Remove only a selected panel's own screws and washers, then lift vertically.
**All neighboring fixings stay installed.** Tests check an upward panel sweep
against neighboring washers. Remove left panels first to reach the right
side from the opening; actual reach against the wall remains to check. Retrieve
and reseat loose slot nuts. Disconnect/support the hose before lifting the
middle-left panel. This is tool-removable, not quick-release.

All roof metal parts are purchased complete or supplier-cut extrusions. Wood
boring and soft-gasket cutting remain necessary. See [supplier evidence and CAD
status](ROOF_CLAMP_SOURCING.md).

## Individual gasket loops

Candidate: [Rubber & Sponge 200-3-6-10-2](https://rubberandsponge.co.uk/product/3mm-thick-x-6mm-wide-adhesive-epdm-sponge-strip/),
6×3 mm adhesive closed-cell EPDM sponge, supplied in 10 m rolls. Delivery to
Portugal requires a supplier quote. Default net length is 16.088 m across 24
strips, before cutting waste. The proposed installed thickness remains 2 mm;
compression, adhesion and panel flatness require physical validation.

Each panel has a separate closed gasket loop. Straight strips occupy offsets
6–12 mm from their supporting slot axes, on the extrusion's flat lands. The
supplier STEP has flat lands approximately 4.9–13 mm from the slot centre;
this is why the earlier 15 mm central strip, and an 8 mm offset study, were
replaced. Each internal beam carries two separate gasket runs, each inward of its own
slot. Screws and 7 mm wood bores lie outside the loops, so they do not pierce
the seals. Cutting the
soft gasket to length and bonding/sealing its butt corners remain necessary.

At the four outer frame corners, the loops cross open upright end sections.
At beam butt joints, the gasket also bridges the adjoining member’s 2 mm
edge radius. These small unsupported areas require a physical sealing/support check;
no hidden filler or solid end cap is assumed. Tests establish full nominal
bearing along the other runs and expressly exclude the four post-end footprints
and 2 mm radiused butt-junction zones from that bearing claim. Continuous
gasket-stock coverage is checked through all butt joints; a missing strip or a corner notch fails. These checks do not
prove pressure distribution, leakage performance or end-section support.

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

The backend checks real panel gaps, support contacts, gasket-loop
coverage, straight-run bearing and the offset opening. Layout and hardware
quantities also have minimum/maximum enclosure-size regression cases.
Supplier packs include `roof-layout.json`, this guide and ordinary panel/profile
schedules. Connection strength, clamp force/washer bending, physical reach, sag, seals and
hose motion remain unresolved. The roof design task tracks those outstanding
details separately from the accepted six-panel layout.

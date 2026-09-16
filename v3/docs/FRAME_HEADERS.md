# Frame headers and guide adapters

The left and rear top members are AST03003004 30×30 profiles, square-cut.
The front member is an intact AST03006006 section rotated upright: 30 mm
front-to-back and 60 mm tall. All top surfaces remain at enclosure height +30.
The front clear opening is therefore height −30; its doors, hinges, frame
corner plates, closing strips and meeting boots follow that opening datum.
Default front opening: 710 mm. Roof crossbars now meet both side rails directly.
Left/rear fixed panels lap the full 30 mm top frame border. The former rear
corner notch and front left-header foam plug are removed.

## Bifold connection

Each guide module mounts beneath a 46 mm wide, 8 mm thick steel adapter:

- Two centre-row M5 countersunk holes attach the adapter to the single underside
  slot of the 30×30 profile. Fit the adapter before the guide; heads sit flush.
- Six M4 tapped holes on the original ±15 mm rows accept guide retention bolts.
  Model bores represent the 4 mm thread-major envelope, not finished tap-drill
  dimensions. Use the specified 3.3 mm tap drill and tap M4; confirm grade,
  engagement, locking and bolt lengths against the assembled stack.
- Steel sleeves and bridge washers preserve the metal clamping path through
  the PETG guide. The adapter's centre fixings and bolt preload must resist
  rotation; stiffness and connection capacity remain unvalidated.

The entire roller/carrier stack is 8 mm lower. Leaf tops are also 8 mm lower
so the stock-angle root clears the stile; default leaf height is 674 mm.
The guide cavity, print geometry and horizontal linkage remain unchanged.
The exterior head hood becomes 90 mm high with three 15 mm steel spacers to
the narrower header face. It retains 3 mm clearance above the leaf and the
existing angled-brush study. Select actual M6 fixings and brush assembly.

## Conditional beam assessment

Source: [Wolweiss catalogue, 30-series profile table](https://reiman.pt/pub/media/catalogue_pdfs/Wolweiss/Wolweiss.pdf), checked 2026-09-16.
AST03003004: 0.9 kg/m, I = 2.9 cm⁴ about either principal axis.
AST03006006: 1.6 kg/m, I = 5.3 / 19.9 cm⁴; use 19.9 cm⁴ for upright vertical bending.
These are profile properties, not connection capacities.

Assume E = 69,000 N/mm², simple end supports and an illustrative 100 N centre
load. This is a comparison load, not an approved roof or guide load.
For the default 1674 mm front span, δ = F L³ / (48 E I):

| Front section | Centre-load deflection | Self-weight deflection |
| --- | ---: | ---: |
| 30×30 | 4.884 mm | 0.451 mm |
| Upright 30×60 | 0.712 mm | 0.117 mm |

Self-weight uses δ = 5 w L⁴ / (384 E I), with w in N/mm. The upright section
is selected for the front, but roof loads and allowable movement must still
be established. This calculation excludes joint rotation, torsion and local
profile deformation, and does not establish strength or an allowable load.

For bare 30×30 guide headers under the same illustrative 100 N transverse load,
the default left 839.5 mm span gives 0.616 mm; rear 765 mm gives 0.466 mm.
These spans run between the modeled middle-post bearing centre and the rail end-face joint, 15 mm beyond the opening width.
The previous 0.5 mm **total** guide movement target is therefore unproven,
especially on the left. No composite stiffness is credited to adapter strips.
Measure guide forces throughout travel and validate the installed rail,
connections and adapter stiffness before manufacturing the enclosure.

The backend recalculates these screens when dimensions change. Supplier packs
include `header-layout.json` and this guide. All parts remain proposals pending
installation, structural and physical performance evidence.

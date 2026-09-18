# Hose routing: arrangement assessment

Design discussion, 2026-09-19. Original Shapeoko 5 Pro 4×4, Makita trim router,
standard Sweepy V2, Nilfisk AERO 21-21 PC. **No support hardware, hose adapter,
frame height or roof cutout is released by this study.**

## Recommendation for the next prototype

Investigate a **frame-supported XY sliding suspension**, with separately managed
XY slack, an attachment to the non-Z-moving X carriage, and a short flexible
section from that attachment to Sweepy. Use the existing middle-left roof entry
as the starting location, with a detachable duct held by the frame. This is a
conditional preference for the next clearance/force study, not a selected assembly.

A possible topology is two longitudinal guides carrying a light transverse bridge,
with a transverse trolley carrying the hose saddle. Manage the inlet-to-bridge
and bridge-to-trolley slack in separate broad loops with smooth retainers. The
hose must not become the travel stop or the sole means of pulling a sticking
bridge. A separate compliant follower connection to the X carriage needs a
measured force budget and overload/release strategy; its own sweep needs checking.
No motorized tracking is proposed. If this cannot be made sufficiently light,
low-friction and compact, reject it and assess the articulated boom alternative.

This arrangement costs more parts and headroom than a boom, but gives explicit
linear limits and separates the two axes. A single Y trolley with a dangling
hose does not accomplish that: it still leaves the entire X excursion and lateral
slack to the hose. Printed smooth saddles/retainers and mounting adapters are
possible; they need capture against falling, creep assessment and inspection.
Use purchased finished rail assemblies, brackets, screws and slot nuts; supplier-cut
extrusions support them. Do not make installation depend on drilling rails,
tapping extrusion ends or cutting metal on site.

Keep the vacuum and its external hose supported outside the frame, accessible
from the left. Do not use the 200–300 mm wall gap on the right as a moving-hose
bay or routine service area. The external hose's weight/pull must terminate on
frame-mounted strain relief before the roof duct. The moving assembly remains
below the roof panels, allowing their independent upward removal.

## What the current geometry actually establishes

Source: [core.py](../backend/enclosure/core.py),
[roof.py](../backend/enclosure/roof.py), and [six-panel roof](SIX_PANEL_ROOF.md).
X is right, Y rear, Z up; dimensions are millimetres from the model base.

| Quantity | Default model value | Interpretation |
| --- | --- | --- |
| Interior W × D | 1674 × 1649 | Enclosure parameters |
| Internal support underside / top | 900 / 930 | Five horizontal 60×30 members |
| Panel underside / top | 932 / 938 | Includes provisional compressed gasket |
| Front header underside | 870 | Lower obstacle during front access |
| Machine reference | 1600 × 1600 × 600 | Unconfirmed box, no XYZ kinematics |
| Machine reference X / Y limits | 37–1637 / 24.5–1624.5 | Centered footprint, **not axis travel** |
| Nominal gap above reference | 300 under supports; 332 in panel bays | Before suspension, hose, sag and margins |
| Roof entry centre | (403, 824.5) | Middle-left panel placeholder location |
| Middle bay clear plan size | 807 × 489.667 | Between frame/support faces, before brackets |

A loop travelling between bays must pass below the crossbars and centre supports;
it cannot use the extra 32 mm available inside one bay throughout its travel.
The largest plan distance from the entry to a corner of the provisional footprint
is `sqrt(1234² + 800²) = 1470.6 mm`. This is an illustrative reach scale, not a
hose length requirement or a substitute for measured axis endpoints. It shows
why a short fixed-radius arm or a static vertical hose is insufficient evidence.

For a vertical 180° loop with centreline bend radius R and rib outside diameter D,
the ideal hose envelope alone is `2R + D` high. Under the supports it needs
`2R + D + suspension_drop + clearance_allowance <= 900 - measured_obstacle_top`.
For illustration only, R=100 and D=40 consume 240 mm of the provisional 300 mm,
leaving just 60 mm for hardware and all margins. Neither dimension is a Nilfisk
specification. A horizontal loop trades height for plan sweep; its entire sweep
must clear frame members, other loops and cables. A two-axis rail stack further
reduces headroom. **900 mm is therefore unresolved, not demonstrated adequate.**

The current `hose-envelope` is a nonphysical straight box above the assumed
machine. It contains no bending, slack, connectors, clamps or travel. Existing
geometric verification cannot certify this new route.

## Support comparison

| Arrangement | Practical advantage | Main failure modes / decision |
| --- | --- | --- |
| Fixed hanger or spring/bungee suspension | Few parts, easy trial | Uncontrolled sideways sweep, varying pull, slack falling at near positions; unsuitable as the sole constraint |
| One Y rail and hanger | Predictable Y path, modest hardware | Does not guide X; lateral hose pull can cock the trolley; retain only if a separately constrained X loop is demonstrated |
| Two-link horizontal boom | Follows XY with fewer linear guides | Large swept arm area, hose twist at pivots, folded/straight singular positions, reversal lag; viable fallback with proper free-running joints and stops |
| XY sliding suspension | Separate travel limits and managed loops | Bridge mass, racking, stiction, stack height, loop storage and follower loads; preferred study subject, conditional on fit and drag |
| Cable carrier / gantry-mounted routing | Stronger control of hose shape | Stock corrugated vacuum hose is not established as suitable for repeated carrier bending; adds moving mass and often length; defer pending hose specification |

For a two-link boom, endpoint reach is bounded by `abs(L1-L2) <= r <= L1+L2`.
Allow reserve from both bounds, and check both elbow configurations, stops and
continuous sweeps. Reaching all four corners alone says nothing about crossing
near the pivot or a reversal that flips the elbow. A pivot is also not a fluid
swivel: hose torsion still needs an explicit path or a suitably rated swivel.

## Hardware and drawing shortlist

Sources checked 2026-09-19. Listings establish candidates, not stock, delivered
price, Portugal availability, installation fit or approval. No supplier contacted.

| Candidate | Evidence / CAD access | Assessment |
| --- | --- | --- |
| Reiman/Wolweiss AST03006006, CBR3030, BTN08M6 | [Profile](https://reiman.pt/en/ast03006006-aluminium-profile-30x60-6-slots/), [bracket](https://reiman.pt/pt/wlw-cbr3030-cbr3030-30x30-bracket/), [nut drawing](https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/btn.pdf). Existing intact `AST03006006.step`, `CBR3030.step` and `BTN.pdf` under `backend/enclosure/assets/`. | Preferred frame mounting family. Existing roof use does not establish capacity for a cantilever or moving bridge. New fastener lengths and slot occupancy need checking. |
| Rollon Compact Rail through Reiman | [Reiman catalogue](https://reiman.pt/pub/media/catalogue_pdfs/Rollon/Linear%20Line%20EN.pdf), [manufacturer drawings/CAD](https://my.rollon.com/pt/pt/product/compact-rail/), [English CAD portal](https://my.rollon.com/corp/en/product/compact-rail/). | Roller-guided alternative with master/follower options for parallel rails. Specify factory-finished lengths and holes. Size, inertia and starting force unresolved. Reiman PDF download failed; manufacturer portal identifies CAD download as requiring an account. No STEP obtained. |
| igus drylin W hybrid, WWH-10-40-10 study size | [Dimensioned catalogue, printed pp. 820–825](https://www.igus.eu/contentData/Product_Files/Download/pdf/07_02_GL7_2_EU_drylin_Hybrid_web.pdf), [vendor CAD portal](https://igus.partcommunity.com/3d-cad-models/?countryIso=GB&info=igus%2Fdrylin_lineargleitlager&languageIso=en). | PDF downloaded and reviewed. Table gives A=58, C=100, H2=34 mm and carriage mass 0.35 kg. H2 is a drawing datum, not the complete suspension depth. Bearing orientation determines rolling versus sliding load; inverted roof mounting cannot inherit upright performance. Matching rail, retention, end stops and CAD configuration pending. No STEP obtained. |
| Reiman GN 482 / GN 511.1 swivel clamp family | [Reiman product](https://reiman.pt/pt/gn-482-swivel-clamp-mountings/), [manufacturer clamping kit and configurator](https://www.elesa-ganter.com/en/www/Clamping-and-connecting-elements--Clamping-kits--GN5111). | Useful for fixed adjustable supports. Documentation describes clamping the articulated joint, not a freely cycling bearing. Do not select it as a boom pivot merely by loosening its screw. No configured STEP obtained. |
| PwnCNC Hose Boom Arm | [Manufacturer assembly description](https://pwncnc.com/collections/dust-collection/products/boom). | Practical boom precedent using three components and 3/4-inch trade-size EMT, approximately 26 mm OD. Tube is not included; offered hose attachments are not a measured Nilfisk fit. Securement and supplier-prepared tube lengths/holes would need resolution. No dimensioned assembly drawing or STEP obtained from the page. |

The inspected igus PDF has SHA-256
`b48f16eb78363c9bce0cc8c9a6bda5332a45959f690e2540a09cd07326cd9938`.
It was downloaded for research, not added as an active supplier asset. Before CAD
implementation, retrieve and archive the **selected** configuration, dimensions,
source and checksum. Do not present a catalogue illustration as vendor STEP.

## Hose interfaces and roof removal

Nilfisk's [catalogue](https://www.dev-site.nilfisk.com/media/vhllzu2q/nilfisk_produktkatalog_2024.pdf)
lists 107405599 as D32 × 2.5 m. This does not give rib OD, cuff geometry, usable
free length between rigid cuffs or dynamic minimum bend radius. Carbide's
[Sweepy V2 page](https://shop.carbide3d.com/products/sweepy-2-0-dust-boot)
lists a 2.5-inch hose interface and 2.25-inch/36 mm Festool adapters; those labels
do not establish Nilfisk cuff fit. Measure both mating parts, including tapers,
insertion depth, shoulders and retention. A printed reducer remains a candidate.

[Original S5 Sweepy Pro instructions](https://carbide3d.com/files/pdf/sweepy-pro-s5-instructions.pdf)
provide a useful X-carriage hose-support precedent with an approximately 230 mm
connector hose. They do not prove compatibility with this Makita/Sweepy V2 setup,
or establish the required Z-section length. Do not substitute the newer 5.1 kit.
[igus bend guidance](https://www.igus.com/company/energy-chains-select-bend-radius-cable-carrier-ca)
requires respecting hose bend limits and avoiding connector strain; there is no
justified generic multiple of D32 to apply here.

Propose a removable straight duct cartridge held by a split frame-mounted cradle
below the middle-left panel. An external hose clamp takes pull before the duct;
a detachable internal connector leads to the guided loops. A soft annular gasket
seals the wood penetration but carries no external hose load. Any flange larger
than the bore must be removable. Removal sequence: park/support the moving hose,
disconnect both hose ends, remove the cartridge and loose sealing pieces, then
release and lift only that panel. No fixed bracket may cross its upward removal
sweep. Connections and cradle release must be reachable from the left. Check
actual reach before calling this independently serviceable.

Separate these future model quantities: nominal flow bore, rib OD, rigid cuff
maximum diameter and length, adapter mating dimensions/insertion, duct barrel OD,
flange OD, mounting pattern, gasket dimensions and wood cutout. If only a straight
barrel passes through, cutout is barrel OD plus **diametral** assembly clearance,
with tolerances and gasket overlap checked separately. If a cuff must pass through,
its maximum envelope may govern instead. No reason exists to set the cutout to
32 mm, to assume a 36 mm fit, or to retain 110 mm as a fabrication dimension.

Keep a length budget for external run, roof transitions, guided XY loops, Z section
and fitting engagement. The stock 2500 mm cannot be allocated to both external
and internal runs independently. Assess each pose's minimum reach and maximum
stored slack. Additional hose/couplings affect extraction; nominal bore alone
cannot predict performance at the boot. Compare the completed route against the
original hose configuration using the same filter state, material and cutting job.

## Measurements and decisions needed

| Input | How to record it | What it resolves |
| --- | --- | --- |
| Highest moving obstacles | Base-to-top of Makita, cables and carriage at Z home; coordinate extents through XY | Real overhead clearance and rail-stack limit |
| Full XYZ endpoints and offsets | Actual configured travel, homing approach, overhang, BitSetter/tool-change locations, boot port at Z extremes | Continuous motion domain; stock size is not travel |
| Hose and cuffs | Rib OD, free length, weight, both cuffs' OD/ID/taper/insertion/shoulders; Sweepy and supplied adapter separately | Saddles, adapters, length allocation and hole |
| Bend behaviour | Manufacturer dynamic radius if available; measured no-kink trial shapes with vacuum on/off, including torsion | Candidate radius and loop storage; trial does not establish fatigue life |
| X-carriage attachment | Existing accessible hole/slot pattern, allowable fixing depth, keep-outs and support load limits | Independent strain relief without drilling machine metal |
| Vacuum placement | Inlet height and actual external route from left-side parking place | External length and roof connector load |
| Service space | Left reach, roof lift distance, tool access and boot removal positions | Panel and tool-change procedure |
| Design preference after measurement | Accept XY suspension complexity, or prefer a simpler boom; whether greater height or a different internal hose is acceptable if required | Next concrete CAD study |

## Verification and physical acceptance proposal

CAD can establish rigid part fit, supplier hole/slot alignment, modeled continuous
support sweeps, connector/tool access, panel extraction paths and conservative
hose-envelope clearance **if physical guides actually confine the hose to those
envelopes**. Include fasteners, bracket protrusions, the front header, router
cables, dust boot and loading access. Deduct measurement uncertainty, mounting
variation, deflection and hose-shape variation from nominal clearance. Unbounded
hose states and intervals remain unknown. Sampled animation is diagnostic only.

Before testing, agree numerical minimum clearance, minimum bend radius, allowable
carriage force/moment, permitted cuff movement and acceptable extraction loss.
These thresholds remain blank pending component limits and measurement; absence
of visible missed steps is not an allowable-force specification. Measure start,
running and reversal force at the carriage support, including vacuum-induced
hose shortening. Compare it to an agreed machine/load limit. Observe retention
at both Z extremes; clamps must not crush the corrugations.

Proposed commissioning sequence (counts are a repeatable screening protocol, not
an endurance certification):

1. Hand-check connector fit, panel removal, support capture and all service access.
2. At conservative jog speed, traverse the XY perimeter and both diagonals at Z
   low/mid/high; test combined XYZ moves and safe homing/tool-change sequences.
   Include max permitted stock/fixtures and boot settings in collision checks.
3. Repeat from at least three starting loop shapes with vacuum off and on.
   Stop at any contact, kink, unexpected twist, tension, slip or follower jam.
4. Only after clearance and force criteria pass, perform 100 back-and-forth cycles
   per axis plus 100 combined diagonal cycles at intended speed/acceleration,
   distributing trials across Z levels and both reversal directions. Repeat ten
   safe homing/tool-change sequences. Log poses, settings, forces and clearances.
5. Repeat removal/reconnection of the middle-left panel ten times; verify each of
   the other panels remains independently removable. Inspect cuffs, rib abrasion,
   fasteners and printed-part deformation before/after and after an extended real
   cutting session. Record its duration and material; do not infer service life.
6. Compare chip capture, leaks and measured extraction performance with the baseline.
   Any numerical extraction-loss limit still needs agreement before passing it.

Neither this proposal nor successful completion proves snag-free operation under
all conditions. Geometry evidence, operating test records, wear follow-up and
unresolved assumptions must remain separately visible in the task and exports.

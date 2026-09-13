# Validate and redesign the bifold doors

Current phase: retained-frame assembly design and sourcing. The user selected
this route on 2026-09-13. **Revision C's PETG guide prototype for the user's
Bambu A1 mini now supersedes the custom fabricated guide proposal.** Revision
B's hinge selection and planar linkage remain the basis; C reserves additional
headroom. Manufacturing release and integration into the active enclosure
remain pending. Earlier kits and revisions are retained as research history.

## Description

Replace the current bifold mechanism with a conventional, buildable assembly
for the left wall's rear half and the rear wall's right half. It must fit the
limited workshop space, close reliably, and contain wood particles without
preventing the enclosure's planned ventilation.

## Discussion

The current design has an unrealistic tall header seal, external guide
adapters, and a rear track that appears unsupported. These are unresolved
mechanical problems; passing the current model checks does not validate the
assembly. The user rejected this arrangement.

The proposed direction is a supported track beneath the structural header,
conventional pivots or hinges, an interleaf hinge, and a guided outer leaf.
The load-bearing hardware and the dust seals must have distinct roles.
Clearance for movement is necessary; any header cover or brush/lip must be
designed around the actual hardware rather than filling the running space
with a large compression gasket.

Compare ready-made systems for technical fit first and evaluate prices later.
Research leads include Henderson Bifold B10/2, Hettich WingLine S/L, and
Johnson 1700. These are candidates, not approved selections. Check original
installation drawings, mounting requirements, and availability in Portugal.
Do not assume a kit for wooden leaves fits a hollow aluminium leaf frame.
The earlier Reiman sliding-profile selection also needs checking: a sliding
profile alone does not establish a complete bifold mechanism.

The enclosure remains parametric for a Shapeoko 5 Pro 4×4. Nothing is bought.
The user wants to assemble supplier-prepared frames and panels, not fabricate
custom mechanisms. Printed parts were suggested as a possibility, not agreed
as load-bearing hardware. The animation fix merged in PR #13 is separate from
this mechanical redesign.

## Research — EU sourcing for Lisbon (2026-09-13)

### Fit envelope used for this screen

The current evaluated Shapeoko configuration has an inner width × height ×
depth of 1,674 × 740 × 1,649 mm. With the present 3 mm perimeter and
meeting clearances, and 27.75 mm head allowance, the two openings evaluate as
follows. These are **model outputs to re-check after the mechanism changes**,
not cut dimensions:

| Opening    | Nominal width | Current leaf widths | Current leaf height |
| ---------- | ------------: | ------------------: | ------------------: |
| left rear  |      824.5 mm |  396.25 / 419.25 mm |           709.25 mm |
| back right |        837 mm |    402.5 / 425.5 mm |           709.25 mm |

The present 30 × 30 aluminium-framed leaves are an important constraint.
Furniture bifold systems below are specified for wood panels, usually
19–25 mm thick; a leaf whose dimensions fit is not therefore compatible.

### Market screen

**Preferred route to quote and validate: Hettich Wing 77, two-leaf set 70986.** It is a free-moving folding-sliding system with a top runner and a
lower guide, rather than side-carcase mounting. That provides a conventional
supported header track and guided free leaf for the outward-folding arrangement.
The [official set listing](https://shop.hettich.com/de_DE/Faltt%C3%BCrsysteme/Faltt%C3%BCrsystem-Wing-77/Beschlagsets/Set-1-Wing-77%2C-1-Faltschiebet%C3%BCr-mit-2-Fl%C3%BCgeln/p/70986)
limits each of two timber leaves to 500 mm wide, 2,400 mm high and 25 kg, with
±5 mm height adjustment. Current leaf sizes are inside those limits. The
separate 3.2 m [lower guide profile 70985](https://shop.hettich.com/us_EN/Folding-door-systems/Wing-77-folding-door-system/Wing-77-Guide-profile%2C-aluminium%2C-Silver-anodised/p/70985)
and top runner must be cut and mounted per Hettich's drawing; this is not a
track-only purchase.

This candidate requires a redesign to supplier-prepared 19–25 mm
wood/composite overlay leaves and a rigid header and sill. The manufacturer
requires the top structure to deflect no more than 1.5 mm under the folded
door load, and the cited set is for a carcase width up to 800 mm: neither
current opening can be accepted without Hettich confirming the proposed
overlay/track layout. It is nevertheless the best fit to investigate because
it avoids relying on a side-mounted cabinet hinge. Hettich has a
[Portugal product route](https://shop.hettich.com/gr_PT/Sistemas-de-portas-de-fole/Sistema-Wing-77-para-portas-dobr%C3%A1veis/c/group743682361007)
and names [INTERFER in Lisboa](https://www.hettich.com/pt-pt/contacto) as the
local distributor. Directional EU web prices were €169.18 including VAT for
the exact 70986 set at [Profi-Store24](https://www.profi-store24.de/hettich-beschlagsets-wing-77-ht2336885397094.html)
and about €98 for older/different WingLine 77 variants at
[Bricotoo](https://www.bricotoo.com/kit-complet-wingline-77-p22390); neither
is a complete installed price and neither replaces a Lisbon quote.

**Quote-check alternative: Hettich WingLine L.** This is available through
[INTERFER Portugal](https://www.interfer.pt/wingline-l) and is a proven,
side-mounted furniture system with top runner and lower guide. It permits
two 250–600 mm leaves of up to 25 kg each, therefore fits the current leaf
envelope. The [manufacturer specification](https://www.hettich.com/fileadmin/Media_Center/Catalogue/Hettich_Product_Leaflet_WingLine_L_2023.pdf)
restricts it to 16–25 mm wood and requires the side carcase mounting that this
enclosure does not presently have. Use it only if the design adopts prepared
wood leaves plus robust side mounting panels; do not adapt it casually to the
30 mm extrusion frame. A low headline kit price is misleading because
profiles, central hinges, carcase hinges and opening/closing components are
separate.

**Closest aluminium-frame kit, but still incompatible: Häfele Slido F-Fold61
25A.** This is a real EU-market folding-sliding kit explicitly specified for
aluminium-frame doors, up to 25 kg per leaf (50 kg per pair), and its 450 mm
leaf-width limit fits the current geometry. Its [product specification](https://www.dekoras-company.com/storage/hafele/products/1739863930_1%28haefele_40936044_print%29.pdf)
also imposes two disqualifying requirements: a 16 mm door thickness and an
aluminium frame face wider than 50 mm. The existing 30 × 30 frame is only
30 mm wide. It is therefore evidence that compatible systems exist for
_purpose-designed_ aluminium furniture frames, but is not an off-the-shelf
solution for these frames. Do not use its width/weight ratings to approve an
adapter.

**Rejected candidates.** Henderson B10/2 is a technically conventional kit:
top track, top/bottom pivots, guide and hinges are supplied, with a 14 kg,
530 mm-wide timber-leaf limit ([manufacturer EU listing](https://henderson.eu/nl/bifold/)).
It is UK-sourced, so fails the EU-only sourcing requirement. Johnson 1700 is
US-sourced and similarly excluded. Häfele Slido Fold 25/35 VF is a possible
technical alternative (19–27 mm wood; 25/35 kg per pair), but current
Portugal stock, price and suitable prepared-leaf details were not confirmed;
do not select it before a PT quote and current installation drawing.

### DIY / 3D-print screen

Do not make a fully printed bifold mechanism. PETG and ASA are suitable for
replaceable fixtures but creep and wear make them unsuitable for pivots, hinge
knuckles, axles, wheel running surfaces and the track. Dust would accelerate
that wear. The currently modelled
[Wolweiss GSD082.3000KIT](https://reiman.pt/pub/media/catalogue_pdfs/Wolweiss/Wolweiss.pdf)
is a lightweight sliding-door PVC profile, not a complete rated bifold kit;
it supplies none of the required pivot, retention, stop or load data.

If no suitable commercial kit can be validated, the only reasonable fallback
is a hybrid conventional assembly:

- two or three real frame-to-primary hinges or a properly supported continuous
  hinge carry the leaf mass;
- three real 180° interleaf hinges join the leaves;
- a rigid, independently supported header track guides a captive metal/POM
  roller at the secondary free stile; it carries lateral guidance only;
- a positive closed stop and latch retain the leaves; brush or lip seals sit
  outside the guide's travel clearance.

Printed parts may be limited to a sacrificial follower housing, end stops,
seal carriers and drilling jigs. Use a metal pivot pin and a POM/Delrin wheel
or a rated roller, for example the locally available
[GN 753 19 mm M6 guide roller](https://reiman.pt/pt/gn-753-19-m6-zl-2-guide-rollers/),
rather than a printed rolling surface. The existing
[Elesa CFG.30/30 SH-6-C33 hinge](https://reiman.pt/en/cfg-30-30-sh-6-c33-hinges-for-profiles/)
is available from Reiman Portugal, but its published loads are for one hinge;
the number, spacing and fastening must be selected from the assembled leaf
mass, not inferred from that listing. A printed-guide prototype must be
tested with the actual leaves for captive retention, lateral loading, dust
cycling, fastener security and non-interference. Its failure must leave the
door supported by the real hinges.

### Decision from this research

The user has ruled out changing the existing aluminium frames. No complete,
EU-sourced, catalogue bifold kit found in this screen is specified for a
30 mm-wide aluminium extrusion frame with 4 mm inset panels. Wing 77 and
WingLine L require timber leaves; the nearest explicit aluminium-frame option,
Häfele F-Fold61 25A, requires a >50 mm frame face and 16 mm door thickness.
Accordingly, do not select any of them or design an unvalidated adapter.

The remaining viable path while retaining these frames is a conventional
assembly of rated 3030 hinges, a structurally supported top guide/roller,
closed stops and latches, with any printed component non-load-bearing. Before
changing the model, obtain a supplier drawing/rating for each hinge and guide,
calculate the actual leaf mass and prove the header/support, retention and
parking clearances.

### Feasibility of the retained-frame assembly

**It appears mechanically doable, but is not yet an approved design.** The
leaves are short (709.25 mm) and narrow (396–426 mm), so this is a much lighter
case than a building-door bifold. The needed load path can be made explicit
without changing the 30 × 30 aluminium frames:

| Function                               | Proposed bought component                                                                                                           | Rule for the design                                                                                                                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carry the complete pair's weight       | Three [Wolweiss GTH3030 aluminium profile hinges](https://wolweiss.com/en/produto/gth_en/) between enclosure frame and primary leaf | Fix through the 30 × 30 profiles with the specified M6 hardware/slot nuts. The manufacturer lists the 30/30 hinge and states the remaining references withstand up to 400 N; verify the exact rating and actual leaf mass before release.                            |
| Support the secondary leaf             | Three [Elesa CFG.30/30 SH-6-C33](https://www.elesa.com/siteassets/PDF/PDF_US/CFG..pdf) 180° profile hinges between leaves           | Do not rely on one hinge. The supplier publishes 300 N maximum working load in the 90° test for one 30/30 hinge; the hinge count and spacing must be accepted only after weighing a completed leaf.                                                                  |
| Keep the free stile on its path        | Rigid, independently supported aluminium guide channel under the structural header plus a captive POM/metal roller                  | The guide is lateral restraint only; it must not carry door mass. Use a rated roller such as the locally sold [GN 753 M6](https://reiman.pt/en/gn-753-19-m6-kv-2-guide-rollers/) in a metal carrier. The present GSD082 profile is not evidence of a suitable guide. |
| Retain the closed and parked positions | Metal closed stop, magnetic/mechanical latch and metal track end stops                                                              | Stops take operating impacts. Brush/lip seals attach beside the motion envelope, never in the roller path.                                                                                                                                                           |

Three frame hinges at roughly 120 mm from each end and one near mid-height,
and three interleaf hinges on the same pattern, are a credible starting layout.
The header guide requires a continuous supported rail above each opening; its
end stops and carrier must remain captive if a roller or printed cover fails.
This is feasible because a failed guide still leaves the leaves hanging from
the real hinges.

The gate before modelling it is a physical proof assembly of one opening:
weigh both finished leaves, install the actual hinges and metal guide carrier,
cycle it under dust, test lateral force at the free stile, and measure the
closed, moving and parked clearances. Only then encode the selected
components and their measured clearances in EnclosureV2.

## Assembly specification — revision A (2026-09-13)

### Design decision and sourcing status

Retain the 30 × 30 leaf extrusions and 4 mm inset polycarbonate. Use bought
hinges to support both leaves, with a separate metal top guide for horizontal
restraint. No bottom guide is proposed. Nothing has been ordered and no
supplier has been contacted. Product listings establish sourcing leads, not
confirmed Lisbon stock, delivery dates or acceptance of this assembly.

Reiman/Wolweiss is the first quotation route for the profile hardware and
prepared guide assembly. Wolweiss describes an
[integrated structures and linear-motion service](https://wolweiss.com/en/about-us/),
but acceptance of these particular fabricated parts still needs confirmation.
The user assembles prepared parts with hand tools; cutting, drilling, forming,
deburring and any tapping belong in the supplier scope. A supplier-prepared
guide is necessary for this proposal: a complete catalogue guide assembly
compatible with these hinge datums has not been established.

### Component schedule

Quantities cover both openings; divide discrete quantities by two for a
one-opening prototype. References are selected for quotation, with the release
conditions stated below.

| Function                | Reference / supplier route                                                                                                                 |                           Total | Mounting and release condition                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frame-to-primary hinges | [Wolweiss GTH3030](https://wolweiss.com/en/produto/gth_en/), via Reiman                                                                    |                               6 | Three per opening, external faces. Published accessory set per hinge: four ISO 4762 M6×14 screws, four ISO 7089 washers and four slot-8 M6 nuts. Obtain pivot drawing and directional load approval. |
| Interleaf hinges        | [Elesa CFG.30/30 SH-6-C33, 423911-C33](https://reiman.pt/pt/cfg-30-30-sh-6-c33-hinges-for-profiles/)                                       |                               6 | Three per pair on inside faces, using the +180° folding direction. Two M6 countersunk screws and slot nuts per hinge; screw length depends on actual slot stack.                                     |
| Guide wheel             | [Ganter GN 753.1-22-B5-ZL-1](https://live-katalog.ganternorm.com/pdf/ganter/en/753_1.pdf), request through Reiman                          |                               2 | Cylindrical 22 mm POM wheel, 5 mm bore, 7 mm width; vertical metal axle. Exact bore variant chosen to allow a separate steel keeper and spacer stack.                                                |
| Header support          | Wolweiss AST03006006, supplier cut/prepared                                                                                                |                         2 spans | Continuous 30 × 60 support tied to both structural opening boundaries; reuse a suitable existing member where possible. Lengths and end connections follow actual frame datums.                      |
| Guide rail              | Project BF-G01, supplier-prepared metal channel and bolted keeper strips                                                                   |                               2 | Preliminary cross-section below. This is a project drawing designation, not a supplier SKU or rated catalogue rail.                                                                                  |
| Follower bracket        | Project BF-G02, supplier-prepared metal bracket                                                                                            |                               2 | Mount to secondary free stile with two M6 slot nuts, preliminary 50 mm vertical screw spacing; wheel axle swivels with the leaf. Bracket offset follows hinge geometry.                              |
| Axle and keeper pack    | 5 mm steel shoulder axle, spacers, independent steel keeper, mechanically locked fastener                                                  |                          2 sets | Supplier to specify exact shoulder length/thread and bearing stack; clamp only the inner race. No printed retention or cantilever pin housing.                                                       |
| Closed catches          | Wolweiss GBL3030.KIT, [manufacturer catalogue, p. 147](https://wolweiss.com/wp-content/uploads/2019/03/Catalogo-final-online.pdf#page=147) |                               4 | Two 3030 double-ball catch kits per opening, high and low on free stile. Mounting accessories included according to catalogue; confirm closing-plane fit and pull force.                             |
| Parked catches          | GBL3030.KIT, quotation candidate                                                                                                           |                               2 | One per opening on a prepared stationary bracket. Verify strike alignment in actual parked pose; kit reference alone does not prove that orientation.                                                |
| Positive stops          | Supplier-prepared metal closure blocks and track end plates                                                                                | 4 closure blocks + 4 end plates | Two closure blocks and two rail end plates per opening. Stops contact metal carrier/door pads, never the wheel tyre, brush or hinge travel limit.                                                    |
| Dust brush sample       | [Mink STL 2108-K21](https://mink-buersten.com/wp-content/uploads/STL_2108_2110_D_GB_FR.pdf)                                                |              Quote sample first | 8 mm slot family, 10 mm PBT bristles. Verify fit in actual 8.2 mm Wolweiss slot and mounting envelope before ordering lengths.                                                                       |

Known frame-hinge fastener subtotal: **24 M6×14 socket screws, 24 M6 washers,
24 slot-8 M6 nuts**. Interleaf subtotal: **12 M6 countersunk screws and 12
slot-8 M6 nuts**, length unselected. Carrier subtotal: **4 M6 screws and 4
slot-8 M6 nuts**, length unselected. Header, rail, keeper, stop and catch
brackets need their own final fastener schedule; these subtotals are not a
complete purchase list. Match nut section to AST03003004, not merely “slot 8”.

The [Elesa drawing](https://www.elesa.com/siteassets/PDF/PDF_IT/CFG..pdf)
gives 35 mm between the two mounting-hole axes, a 54 × 36 mm overall envelope,
and a recommended 5 N·m fixing torque. Two adjacent 3030 centre slots with a
3 mm edge gap are only 33 mm apart. Consequently the current 3 mm meeting
gap cannot simply be reused with centred mounting: **use 5 mm as the initial
interleaf gap**, subject to supplier CAD and slot-insert fit. The rotation
description explicitly gives -100°/+180° from coplanar faces; the pictogram
uses different angle labels, so installation must follow the drawing and
actual swept geometry.

The small [GN 753-19-M6-ZL-2](https://www.elesa-ganter.es/siteassets/PDF/ES/GN%20753.pdf)
previously suggested has a 49 N radial rating. It is superseded here by
GN 753.1: the 22 mm size has a 400 N radial dynamic guide value, with covered
2Z bearings. Ganter's life conditions assume a clean, smooth running surface;
2Z is not a dust-tight seal. Axial loading is excluded from normal operation.

Pricing remains a quotation exercise. The indexed Reiman PT/EN Elesa pages
show conflicting VAT-inclusive prices (€7.56/€7.75 per hinge), so even that
subtotal is indicative. Request a complete prepared-assembly price, including
VAT, freight to Lisbon and preparation, before comparing cost. Do not carry
forward prices for rejected furniture kits as an assembly budget.

### Layout, pivots and motion

Each fixed hinge line is at the parking end: rear end of the left opening,
right end of the rear opening. In plan view, A is the fixed frame pivot,
B the interleaf pivot, and C the vertical free-stile guide axle. C travels
along the fixed header rail while A–B and B–C fold outward. The frame hinges
carry the whole pair; interleaf hinges transfer secondary-leaf weight to the
primary; horizontal guide forces reach the header and then its end supports.

Place hinge centres initially at z = 120, H/2, H−120 above each leaf bottom.
For the old 709.25 mm leaf, those are 120 / 354.625 / 589.25 mm. Align all
three axes with a jig; three misaligned hinges can bind. Supplier corner
joints must resist frame racking without relying on the polycarbonate as a
structural diaphragm. Reserve different extrusion faces for the panel liner,
hinges, guide bracket and seals; check local fastener overlap with corner
connectors.

Use this constraint for the revised geometry, with all lengths in mm:

```text
B = A + R(theta) p
C = B + R(phi) q
C.y = guideLineY
```

Here p is the closed primary pivot-to-pivot vector and q is the closed
interleaf-pivot-to-guide-axle vector, including mounting offsets. R is a
plan rotation, theta is primary angle, and phi is secondary absolute angle.
Track position is C.x; relative fold angle is phi−theta. Solve the branch
continuous from closure and check full profile, hinge and bracket solids.
Leaf widths alone are not linkage lengths.

For ideal zero-offset equal links of length L, C.x = 2L cos(theta),
C.y = 0, and outward knuckle projection = L sin(theta). Real 30 mm leaves
need finite stack thickness and must stop before collision or the linkage
singularity. Specify the parked stop from the first limiting clearance;
do not hard-code 90°/180° or copy the old 23 mm leaf-width difference, which
was derived for GLR3030 hardware.

With the new provisional 5 mm meeting gap and 3 mm jamb clearances, the
available combined leaf widths are 813.5 mm (left) and 826 mm (rear).
Equal nominal halves would be 406.75 and 413 mm respectively, but final
width allocation must solve the actual GTH/CFG/guide offsets. Retaining
3030 frames does not require retaining unpurchased cuts from the old model.

The user supplied **800 mm on the left and 450 mm on the right** on
2026-09-13 and subsequently confirmed these are outward clearances from the
closed enclosure face at the left-rear and back-right openings respectively.
The 450 mm measurement is behind the rear-wall opening.

These replace the earlier generic 500 mm planning reservation. The back-right
assembly must fit its full swept envelope inside **450 mm**, including hinges,
handle, carrier and tolerance allowances; the left limit is **800 mm**.
An ideal 413 mm rear half-leaf leaves only 37 mm to that limit before actual
pivot offsets, fittings and operating clearance. This is a preliminary
geometric screen, not proof of fit or usable hand clearance. Prioritise the
rear opening when solving the linkage and selecting handle placement.

The user also authorised an asymmetric rear layout and a somewhat smaller
rear door to accommodate the available space. Adopt **750 mm nominal rear
opening width** as the next design-study target, reducing the previous
837 mm opening by 87 mm. Keep the right parking jamb fixed and move the
opening's left boundary toward it, extending the fixed rear panel region.
The 87 mm is a change in opening allocation, not a panel cut dimension;
account for the boundary post and panel engagement in the final layout.
Keep the enclosure's overall dimensions and machine clearance unchanged.

At 750 mm, the provisional 3 + 5 + 3 mm closed gaps leave **739 mm** for
the two leaves, or **369.5 mm each** before hinge-offset allocation. This
provides 80.5 mm between the ideal half-leaf projection and the 450 mm
obstacle limit. Aim for a complete hardware sweep of **400 mm or less**,
leaving a nominal 50 mm reserve to the obstacle; verify actual hand access
and tolerance margins separately. This target is a design choice enabled
by the user's permission, not a proven fit or a user-specified dimension.

Here asymmetry primarily means the rear wall's fixed/opening split. Do not
make one leaf much shorter just to reduce its sweep: unequal effective
link lengths can prevent a compact fold on a straight guide. Solve the
pivot/guide geometry first and use only the leaf-width difference it needs.
Recalculate rear rail length, support position, mass, seals and parked access
for the reduced opening. Earlier 837 mm calculations remain a reference
screen, not final rear manufacturing dimensions.

Initially budget **120 mm of opening width** for parked hardware/stack:
target usable widths would be at least 704.5 mm left and **630 mm rear**
with the proposed 750 mm opening (previously 717 mm at 837 mm). These
are provisional reservations, not proven swept bounds. Whether simultaneous
opening is required remains unanswered; check both doors together in the
design study rather than assume an operating restriction. Include handles,
adjacent panels and rear electrical equipment in the collision check.
A hand-clearance allowance is additional to checking that solids merely
do not intersect.

### Supported guide and captive follower

BF-G01 preliminary section: downward-facing channel, **23 mm clear internal
width**, **24 mm clear internal height**, **3 mm walls**, and two removable
3 mm steel bottom keeper strips leaving a **10 mm longitudinal slot**.
Overall nominal width is 29 mm and height including strips is 30 mm.
These are design targets for supplier review, not a found catalogue section.
Supplier may propose an equivalent standard section and update the stack.

The 22 mm wheel runs against the vertical walls with nominal 1 mm diametral
clearance. Put a separate **20 mm diameter steel keeper** below the wheel,
inside the rail, on the metal axle; it bridges the 10 mm slot even if the POM
wheel fails. At maximum lateral float, keeper overlap must remain positive
on both sides. Keep the rotating outer race clear of spacers and keeper.
Provide at least **2 mm vertical float in each direction** in the normal
assembled stack, verified against the full axle drawing, sag and tolerances.
The keeper is emergency capture, not a thrust bearing or door suspension.

Both rail ends are positively closed by screwed metal plates. A removable
end provides assembly access; captured hardware cannot escape at either
end during use. A metal contact feature on BF-G02 takes the parked-stop
force without transmitting the impact through the POM running surface.
Retain the axle mechanically, with a supplier-specified locking method and
inspection marks; a printed cover has no retention function.

Attach rail continuously along the header with fastening stations initially
at no more than **150 mm centres**, outside the wheel path or fully flush.
End stations should be within 50 mm of each end; allow seven stations per
approximately 0.84 m rail for quotation. Rail length is derived from the
minimum/maximum C.x plus wheel radius, stops and assembly allowance, not
assumed equal to opening width. The header must reach structural posts at
both ends; a rear segment terminating at a panel edge is unacceptable.
If that boundary lacks a post, quote the missing structural post and joints.

Specify BF-G02 as a supplier-prepared **3 mm steel bracket**, with two
stile fixings and an axle platform; use formed returns/gussets if required
by the solved cantilever offset. Provide ±3 mm guide-line setting and ±2 mm
height setting through the metal mounting arrangement. These are requested
adjustment ranges, not properties of the catalogue hinges. The supplier
must check bracket bending, slot slip, rail lips, end plates and connections.

Allow **35 mm below the structural header** initially: 30 mm rail stack and
5 mm door-top clearance. At 740 mm opening height and 3 mm bottom gap that
would give 702 mm leaves, before any additional axle-stack requirement.
This supersedes the 27.75 mm GSD allowance for design studies only. Verify
that the carrier platform and shoulder fastener fit before releasing height.
Fit a removable cover on the dust side and provide vacuum-cleaning access.

### Mass and load screen

The [Wolweiss profile table, p. 25](https://wolweiss.com/wp-content/uploads/2019/03/Catalogo-final-online.pdf#page=25)
lists AST03003004 at 0.9 kg/m, and AST03006006 second moments of area
5.3 / 19.9 cm⁴. For an intentionally conservative leaf mass estimate, count
the complete outside perimeter as extrusion and the entire rectangular leaf
area as 4 mm polycarbonate, then add 0.5 kg for joints, hinges and fittings.
Use 1,200 kg/m³ polycarbonate density as a preliminary material value,
consistent with [Stabilit's technical data](https://www.stabilitsuisse.com/sites/default/files/stabilit_cat_systems_dc83-0003_en_11-2024_low.pdf).
Actual panel grade and finished fittings still need confirmation.

```text
m_leaf_kg = 0.9 × 2(W + H)/1000 + 4.8 × W × H/1,000,000 + 0.5
```

| Existing leaf envelope          | Estimated upper allowance (kg) |
| ------------------------------- | -----------------------------: |
| Left primary, 396.25 × 709.25   |                          3.839 |
| Left secondary, 419.25 × 709.25 |                          3.959 |
| Rear primary, 402.5 × 709.25    |                          3.871 |
| Rear secondary, 425.5 × 709.25  |                          3.991 |

Use **4 kg per leaf / 8 kg per pair** for the initial load screen, conditional
on the 0.5 kg fittings allowance. This is an estimate, not an actual measured
mass or a supplier capacity. Recalculate for final cuts and weigh the prototype.

For the old larger pair, the approximate gravity moment at the frame hinge
line is 4×9.81×(0.4025/2 + 0.4025 + 0.003 + 0.4255/2) = **32.16 N·m**.
With 469.25 mm outer-hinge spacing, the resisting hinge force couple is
about **68.5 N**, in addition to **78.5 N** total vertical weight. A preliminary
factor of two on gravity gives 64.3 N·m / 137 N couple / 157 N vertical;
this is a design allowance, not a standard or certification. Secondary-leaf
moment at the interleaf hinges is about 8.35 N·m before that allowance.

Wolweiss's GTH page describes a pair before stating the 400 N value for larger
references. Treat this conservatively as **400 N per pair pending clarification**;
do not claim 3×400 N capacity. The Elesa working values for one CFG.30/30 are
440 N axial, 1,850 N radial and 300 N in the 90° test. They are different load
cases, not additive capacities. These numbers justify further evaluation;
combined loading, fixing pull-out, joint slip and unequal hinge load sharing
still require supplier acceptance. Do not divide all forces equally by three.

For guide/header sizing use a provisional **100 N transverse force at the
guide**, independent of the gravity calculation. With a simply supported
837 mm AST03006006 span, weak-axis I = 53,000 mm⁴ and assumed aluminium
E = 69,000 N/mm², F L³/(48 E I) gives **0.334 mm** beam deflection. Adopt
**0.5 mm total lateral guide-line movement** as the initial target, including
connections. This beam-only calculation excludes joint rotation, rail and
bracket compliance, torsion and existing enclosure loads; it does not prove
the target. A 100 N hand force elsewhere on the door is not necessarily a
100 N guide reaction: calculate linkage leverage throughout travel, especially
near closure and parking, before accepting this load case.

### Stops, seals and assembly sequence

Set metal closed stops at top and bottom of the free stile to establish the
closed plane. The ball catches retain that position; they are not positive
locks or structural stops. Set catch force after measuring brush drag.
Provide a parked catch so the folded pair cannot drift across the access
path. Final selection needs catalogue force data and a pull test in the
actual installation. Keep any handle out of the folded interleaf space.

Use a small offset header cover to overlap the door top, with a brush at its
lower edge wiping the door face outside the rail envelope. The 35 mm hardware
space is covered by sheet/rail structure, not filled with a 35 mm gasket.
At jamb, sill and meeting edge use separate lightly contacting brush/lip
carriers. A 10 mm brush is not to be crushed into a 3 or 5 mm edge gap:
offset its carrier so only the tip wipes the mating face. Start with 0.5–1 mm
tip engagement for the sample, then adjust from measured drag and leakage.

Mink's 8 mm slot brush is a sample candidate, not confirmed for Wolweiss's
8.2 mm slot. Its catalogue lists 20 × 1 m packs; ask for individual samples
or supplier-cut lengths. Approximate seal path for two perimeters plus two
meeting edges is 7.58 m at the old dimensions, so allow approximately 8.5 m
before final carrier routing and cut optimisation. The meeting seal must
release as folding starts and avoid all three hinge bodies. The panel-edge
liner for a 4 mm panel in an 8.2 mm slot remains separately unselected.
Coordinate deliberate airflow with
[the ventilation task](../todo/right-side-airflow-and-filtration.md); brush
seals alone do not establish fine-dust filtration performance.

Assemble the rigid header and posts first, then the squared leaf frames and
properly retained panels. Hang the primary, add the secondary, align hinges,
then insert and capture the metal follower. Set guide clearance without
lifting the leaves onto the rail. Adjust closed/parked stops and catches
before fitting the dust cover and seals. Supplier work includes preparation
of all brackets, slots, end plates and spacers; user work is bolting and
adjustment. No load-bearing print is included in this revision.

### Supplier package and release evidence

Request one prototype opening and a separate two-opening total, with the
schedule above. Require current component drawings/CAD, directional hinge
ratings, extrusion mass and inertia, screw/nut references, permissible
torques, guide/bracket drawings, surface finishes, all cut lengths, fit
tolerances, catch forces and lead time. Ask the supplier to return the actual
A/B/C datums and axle stack, rather than approving a screenshot of the old
model. Do not substitute the old GSD082 track.

Before manufacturing release: solve full motion with these datums; check
fastener, panel and parked clearances at tolerance extremes; include both
openings and surrounding equipment. Build one prepared opening, weigh it,
measure sag and operating force, check capture with the wheel removed while
the leaves are supported, and cycle with representative dust. An initial
project test proposal is 500 full cycles with inspections every 100, followed
by repeated closed/parked retention checks. Agree applied test forces with
the supplier after the leverage calculation; cycle count alone is not a
service-life qualification. Record wear, loosening, guide-line movement and
remaining clearances, and revise any failing detail.

This revision provides a sourced design proposal and preliminary calculations.
It does not establish a complete orderable kit or validate the old rendered
mechanism. Active EnclosureV2 changes follow the supplier datums and physical
proof required above; all dimensions remain parametric in mm.

## Revision B — dimensioned motion study (2026-09-13)

### Current proposal

Use **Elesa CFG.30/30 SH-6-C33 at both hinge lines**, three hinges per line:
12 hinges for the two openings. Its 35 mm mounting-hole spacing permits
centred fixings across 3030 profiles with a **5 mm gap**. Apply that gap at
both jambs and the leaf meeting edge. Use the +180° direction on the inside
interleaf mounting and the outward opening direction at the external frame
hinges; verify installation against supplier solids before release.

This replaces GTH3030 in the quotation proposal. On the
[Wolweiss drawing, p. 138](https://wolweiss.com/wp-content/uploads/2019/03/Catalogo-final-online.pdf#page=138),
H1/H2 are each 15 mm, so its nominal mounting pattern between centred
3030 slots does not provide the proposed jamb gap. Resolving that with a
new adapter would add preparation. CFG already has a supplier STEP in the
repository and directional load data. Its moulded PA body and steel pin are
bought, rated hardware; this is not a printed hinge.

Revised hinge fasteners: **24 M6 countersunk screws and 24 compatible slot-8
M6 nuts**, plus supplied centring inserts, for all 12 hinges. The earlier
24 M6×14 socket screws and washers for GTH are removed from this proposal.
Countersunk screw lengths still depend on nut engagement and slot clearance.
The same guide wheel, prepared rail, captive metal axle/keeper and separate
stops remain proposed. Whole-pair loading now has to be checked against the
CFG axial/radial/angled values at the frame hinges as well as the interleaf
hinges; the GTH pair rating is no longer a release dependency.

### Reproducible results

The [domain study](../../src/domain/bifoldAssemblyStudy.ts) evaluates planar
30 mm leaf rectangles from the two hinge pivots and the guide line. The
[drawing](../../engineering/bifold-assembly/revision-b.svg) and
[numeric report](../../engineering/bifold-assembly/revision-b.json) are generated
with `node scripts/bifold-assembly-study.mjs`. They are engineering review
artifacts, not the application renderer or manufacturing exports.

| Dimension / result                                  |          Left rear |       Back right |
| --------------------------------------------------- | -----------------: | ---------------: |
| Nominal opening width                               |           824.5 mm |           750 mm |
| Primary / secondary leaf widths                     | 384.75 / 424.75 mm | 347.5 / 387.5 mm |
| Provisional leaf height                             |             702 mm |           702 mm |
| Primary parked angle                                |                88° |              88° |
| Relative fold at parking                            |            175.57° |          175.56° |
| Maximum sampled bare-leaf outward projection        |          395.02 mm |        357.80 mm |
| Projection with 15 mm fittings allowance            |          410.02 mm |        372.80 mm |
| Remaining space to supplied obstacle limit          |          389.98 mm |         77.20 mm |
| Parked usable width with same allowance             |          691.38 mm |        619.65 mm |
| Guide-centre x range across complete sampled motion |   102.50–807.52 mm |  99.73–733.33 mm |
| Minimum sampled leaf-to-leaf clearance              |               5 mm |             5 mm |

Coordinates use x from the fixed opening boundary across the aperture, y
outward from the closed exterior face. Frame pivot A = (2.5, 8), closed
interleaf pivot B = (primary width + 7.5, -38), and guide line y = -15.
The guide axle is centred over the secondary free stile, 15 mm from its free
edge. The 8 mm hinge mounting-plane offset comes from the existing CFG STEP
calibration in `src/rendering/manufacturerCad.ts`.

The 40 mm secondary-leaf width increase is an explicit linkage design choice,
not a catalogue dimension. It accommodates the opposing external frame and
internal interleaf pivot offsets while keeping the guide over the free stile.
At a forced 90° primary angle, this layout exceeds the interleaf hinge's
180° range. **Set the design-study parked stop at 88°**, pending the full
hardware clearance check. This gives a nearly parallel folded pair without
using the hinge itself as a stop.

An important rail detail: rear guide centre x is 730 mm at closure but reaches
733.33 mm during initial opening; the corresponding left values are 804.5
and 807.52 mm. Do not put the rail's far end stop at the closed guide centre.
For preliminary wheel clearance, a 22 mm roller and an additional 5 mm
end allowance require rail running space approximately x = 83.73–749.33 mm
rear and 86.50–823.52 mm left. These are running-space bounds, **not rail
cut lengths**: end plates and the carrier's separate stop feature still
need to be detailed. Closure is established by the door stops/catches.

The user is correct about the two openings occupying different corners.
Mapping the sampled, allowance-expanded leaf envelopes into the enclosure
plan leaves approximately **858 mm separation in X**. This covers arbitrary
combinations of the sampled opening angles because each envelope includes
the complete sampled sweep. Mutual collision is therefore not a current
design blocker; retain a routine check when real hardware is integrated.
No simultaneous-opening restriction is imposed by this study.

### Limits and next release work

The study samples every 0.25° (353 poses per opening). It checks rectangular
leaf separation and computes an envelope with an assumed 15 mm fittings
allowance; it does not check actual hinge, handle, seal, bracket or enclosure
solids. Results are not continuous-motion, structural, tolerance or hand-access
proof. The smaller rear opening meets the 400 mm study target; the previous
837 mm rear opening would give 416.26 mm with these same assumptions.

Changing the assumed hinge offset from 8 mm to 7 or 9 mm in a sensitivity
screen gives rear reserved sweeps of 372.68 / 373.47 mm respectively, but
changes parked access and fold angle. This is a sensitivity example, not a
complete manufacturing tolerance stack. Supplier machining drawings and
physical validation remain necessary for the actual assembly.

Prepared an [unsent supplier enquiry](../../engineering/bifold-assembly/supplier-enquiry.md)
with this revision's references, dimensions and remaining drawing/load
requirements. The production enclosure still uses the previous mechanism;
integrating the study before resolving the supplier geometry would falsely
present the old hardware selections and new dimensions as one verified design.

### Verification of the study

`npm test`: 44 files / 203 tests passed, including seven focused study tests
for closed gaps, guide-line closure, leaf separation, the 180° hinge limit,
initial guide overtravel, inadequate sweep allowance and invalid inputs.
`npm run check` passed after formatting this task. `npm run build` passed,
including asset URL verification; existing dependency externalisation and
large-bundle warnings remain. Regenerated both review artifacts and visually
inspected the SVG. These software checks do not validate the physical assembly.

## Revision C — PETG guide on Bambu A1 mini (2026-09-13)

The user agreed to investigate printed guide parts and identified their
printer as a Bambu A1 mini. Use PETG: Bambu lists it as ideal on the 180 mm
bed, whereas ASA is not recommended. Full design, print settings, component
references, failure modes and physical test steps are in the
[printed-guide prototype instructions](../../engineering/bifold-assembly/printed-guide/README.md).

The design uses a 46 mm-wide printed U-channel against the continuous 3060
header, plus separate printed retaining strips. Six M4 bolts per module
connect both body and strips directly to the header's steel slot nuts.
Printed keys locate adjacent bodies with a nominal 0.2 mm seam gap. The
complete rail has five modules per opening: 133.84 mm long at the rear and
147.74 mm at the left. Both fit the A1 mini with room for a 5 mm brim.

Generated seven prototype STL files, including **two 60 mm coupon bodies,
four matching retaining strips and two alignment keys as the first print**.
The remaining full-rail variants are for later prototype use after the coupon
passes. The [domain plan](../../src/domain/printedBifoldGuide.ts) derives module
lengths, mounting positions, keeper overlap and vertical stack; reproduce
the files with `node scripts/printed-bifold-guide.mjs`.

Keep the bought GN 753.1 roller. Proposed standard mounting parts are two
GN 753.2-4-5-3-AE-NI bushes, an M4×40 axle bolt, an 18 mm OD M6 large-series
keeper washer, a 4.3 bore × 8 OD × 10 metal spacer and a locknut/washer.
The manufacturer-catalogue spacer candidate is Essentra/Richco 311431040050;
small-quantity EU availability remains unconfirmed. No mechanism fabrication
order is required to print the rail fit sample.

The printed track stack is 29 mm; nominal vertical follower float is 2.5 mm
up / 2.9 mm down. Keeper overlap remains 2.3 mm per side after accounting
for roller side clearance and the washer's possible eccentricity. **These
are dimension checks, not strength ratings.** The M4 axle, carrier, PETG lips
and slot connections do not inherit the roller's 400 N catalogue capacity.

The keeper washer captures a failed wheel only while the printed lips remain
intact. It is not independent metal rail retention. If a print fails, the
bought frame/interleaf hinges still support the leaves, but the guide may
release and permit unintended swing. The user-selected printing route is
therefore a bench prototype subject to fit, wear, creep and strength checks.

Reserve **55 mm headroom**, giving **682 mm provisional leaf height** at the
current enclosure height. This supersedes the earlier 702 mm value. Revision
B's leaf widths, 88° parking stop and horizontal sweep remain unchanged.
The carrier's shelf and upright must clear rail mounting screw heads through
travel; no carrier STL or full-door installation release is provided yet.
End impacts still require a metal stop fixed to the header, with its contact
feature and location to be detailed. The earlier supplier enquiry is marked
superseded for custom guide fabrication.

Revision C verification: `npm test` passed 45 files / 207 tests;
`npm run check` and `npm run build` passed. All seven generated STLs have
positive CAD volume, fit the A1 mini with a 5 mm brim, and have zero
non-manifold edges or degenerate triangles in the mesh audit. The generator
formats its manifest so regeneration also passes the project format check.
No physical print, slicer preview, load test or door installation is claimed.

## Implementation plan

- [x] Agree on the mechanism route before changing geometry
  - [x] Screen ready-made systems; retained 3030 frames exclude the researched kits
  - [x] Record the user's choice of a conventional retained-frame assembly
  - [x] Resolve the wood/aluminium decision: retain aluminium frames and 4 mm panels
- [ ] Specify the complete assembly
  - [x] Produce revision A with exact catalogue candidates, supplier routes and preliminary component quantities
  - [x] Document the load path, guide cross-section proposal, mounting preparation and adjustment targets
  - [x] Calculate preliminary leaf masses, hinge moments and header beam deflection
  - [x] Produce revision B pivot-driven motion study, sampled leaf-clearance tests, plan/guide drawing and unsent supplier enquiry
  - [x] Develop revision C for the A1 mini: PETG modular rail, standard roller-stack candidates, printable fit coupons and full-length prototype variants
  - [ ] Print and measure the two-module coupon; record actual joint steps, roller drag, retention and clamp dwell results
  - [ ] Detail and verify the printed carrier and independent metal end-stop arrangement before full-door use
  - [ ] Obtain supplier drawings and acceptance of the guide/carrier, hinge loads, fasteners and connections
  - [ ] Resolve all cut dimensions and fastener lengths from the actual pivot/guide stack
  - [ ] Specify closed stops, latches, modest seals, and their clearances through the full movement
  - [ ] Confirm workshop access and usable opening with both leaves folded
  - [ ] Obtain complete prepared-assembly prices, VAT, delivery and lead times for Lisbon
  - [ ] Build and measure the one-opening proof assembly; record dust-cycle and retention evidence
- [ ] Implement and verify the agreed design in the active application under src/
  - [ ] Replace the floating track, external adapters, and unrealistic header seal in the domain model and rendering
  - [ ] Verify clearances, full motion, tolerance allowances, support, and seal engagement against the chosen hardware
  - [ ] Update supplier specifications, cuts, quantities, drawings, and assembly instructions
  - [ ] Run relevant tests, checks, and builds; record remaining physical checks without claiming they are proven

## Open questions / blockers

- [x] Which mechanism route? User chose the conventional assembly; the kit screen is closed for the retained frames.
- [x] Which leaf construction? Retain 3030 aluminium frames with 4 mm inset panels; no timber substitution.
- [x] Which components carry weight? Three frame hinges support each pair through M6 slot fixings; three interleaf hinges transfer secondary weight. Ratings and connection acceptance remain pending below.
- [x] Resolve the custom fabricated guide route for prototyping: user chose printed PETG guide investigation on the A1 mini; revision C provides rail fit samples instead of commissioning BF-G01 fabrication.
- [ ] Validate PETG rail/lip strength, creep and dust wear; select the carrier geometry, axle grade and justified applied loads. Catalogue roller capacity does not rate the printed assembly.
- [x] Resolve GTH3030 mounting-gap issue: revision B proposes CFG.30/30 at both hinge lines with 5 mm gaps.
- [ ] Confirm CFG.30/30 combined frame/interleaf loads, fixing engagement, supplier pivot installation and frame-joint rigidity.
- [ ] Confirm guide reaction throughout travel, keeper/axle stack, and total header/connection deflection.
- [x] Record supplied workshop clearances: user reports 800 mm left and 450 mm right.
- [x] Confirm the clearance datum: user confirmed 450 mm outward from the rear wall at the back-right opening.
- [x] May the rear opening be smaller/asymmetric? User authorised this; use a 750 mm opening as the next design-study target, with the right parking jamb retained.
- [ ] Prove full hardware travel and operating clearance within 450 mm rear and 800 mm left; sampled revision B rear sweep is 372.80 mm with 619.65 mm parked usable width, before supplier-solid/tolerance verification.
- [x] Address simultaneous opening: user expects separated corner locations; sampled envelope study confirms 858 mm mutual X separation with the provisional fittings allowances, so no operating restriction is proposed.
- [ ] Does Mink STL 2108-K21 fit the actual slot and wiping geometry; which panel-edge liner and meeting-edge carrier complete the sealing?
- [ ] Confirm catch forces, final hardware lengths, prepared-part costs and Lisbon delivery. No purchase or supplier contact has occurred.
- [x] Are printed parts permitted? User agreed to printed guide development; revision C uses printed rail bodies/retaining strips while bought hinges support the leaves. The printed carrier remains to be detailed and tested.

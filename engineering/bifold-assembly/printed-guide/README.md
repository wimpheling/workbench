# Printed bifold guide — revision C prototype

This replaces the custom fabricated rail proposal with PETG modules on a
continuous aluminium header. **Print the short test section first.** These
files are fit/wear prototypes, not released door hardware. The enclosure
application still displays the earlier mechanism.

The bought CFG hinges continue to support the complete doors. The printed
guide controls the free leaf's path. Its failure can release that guidance,
even though the hinges keep the leaves hanging.

## A1 mini print package

Bambu specifies a 180 × 180 × 180 build volume and lists PETG as ideal for the
[A1 mini](https://us.store.bambulab.com/products/a1-mini); ASA is not recommended.
Use unfilled PETG and the installed 0.4 mm nozzle as the baseline.

| First print                            | Quantity | File                                                     |
| -------------------------------------- | -------: | -------------------------------------------------------- |
| Short open-channel body, 60 × 46 × 25  |        2 | [coupon-body-60.stl](coupon-body-60.stl)                 |
| Removable retaining strip, 60 × 18 × 4 |        4 | [coupon-keeper-strip-60.stl](coupon-keeper-strip-60.stl) |
| Joint alignment key, 30 × 3 × 1.8      |        2 | [alignment-key.stl](alignment-key.stl)                   |

The bodies print with the large header-contact face on the bed and the
channel open upward. Strips and keys print flat. The small alignment-key
pockets in the bed face have 3.4 mm-wide bridge roofs; inspect these after
printing. No supports should be needed inside the rolling channel.

Starting slicer choices, **not a qualified strength specification**: 0.20 mm
layers, six walls, six top/bottom layers, 40% gyroid infill and a 5 mm brim
if needed for adhesion. Use the filament manufacturer's A1 mini-compatible
temperature, drying and volumetric-flow profile; do not override it with a
generic high-speed setting. Keep the Z seam on the outside wall, away from
the roller faces. Do not scale parts to correct fit: measure the channel
and change its dimension or printer compensation.

The assembled rail has square ends. Remove brim, strings and any elephant
foot; lightly break a sharp running-edge burr without rounding away the
channel's dimensional datum. Use a fingernail or straightedge to check for
a ridge at the joint. Target no more than 0.1 mm running-face step for the
first sample. That is an inspection target, not a demonstrated printer
tolerance. The nominal 0.2 mm seam gap must also be measured.

The two coupons, four strips and two keys have about **91.3 cm³ of CAD solid
volume** before slicer infill. Use Bambu Studio for actual filament mass and
print time; a full-solid CAD volume is not a filament-consumption prediction.

## How the track is built

Use the 60 mm-wide face of the 3060 header downward, with its two underside
slot rows 30 mm apart. Confirm that orientation and the actual profile
section before mounting. The printed body is 46 wide; the rolling channel
is 23 wide, with a 4 mm roof and 21 mm clear cavity. It touches the header
over its length; no printed section spans an unsupported opening.

Each body and its two retaining strips are bolted through to the header:
three longitudinal stations, two M4 bolts per station. Stations are 12 mm
from either end and at mid-length. There are **six direct header fixings per
module**, not printed threads or heat-set inserts. The strips close the
bottom except for a **10 mm slot** for the follower stem. Total track height
is 29 mm, excluding mounting screw heads and washers.

Specify slot-8 M4 steel nuts actually compatible with the Wolweiss extrusion,
M4 washers and nominal M4×35 socket screws. The 35 mm screw leaves about
5 mm engagement after 29 mm printed stack and a 1 mm washer; confirm nut
height, engagement and bottoming before ordering lengths. Printed PETG is
in this clamp stack: steel washers distribute pressure but do not eliminate
creep. Establish a torque on a sacrificial coupon, mark bolts, and inspect
for clamp loss after dwell. Do not reuse the hinge's 5 N·m torque here.

At each joint, two printed keys sit in shallow header-side pockets and bridge
the seam. The header traps the keys; they align modules but are not structural
connectors. Both modules have their own bolts. A 0.2 mm nominal gap allows
assembly and a small amount of movement; confirm the gap after temperature
changes. Do not glue all modules into a rigid long strip.

## Roller and retention stack

Use a bought **GN 753.1-22-B5-ZL-1** cylindrical POM roller. Its vertical axle
allows it to roll along either sidewall. Do not print a replacement wheel
for the functional test. The roller remains centred on the closed leaf
midplane and 15 mm in from the secondary free edge, preserving revision B's
planar linkage.

Proposed standard metal parts, per follower:

| Part                             | Quantity | Specification / source                                                                                                                                 |
| -------------------------------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Roller                           |        1 | GN 753.1-22-B5-ZL-1, 22 OD / 5 bore / 7 width                                                                                                          |
| Centring bush                    |        2 | [GN 753.2-4-5-3-AE-NI](https://www.reiman.pt/pub/media/technical_data/GANTER/datasheets/GN%20753.2.pdf), facing into opposite ends of the bearing bore |
| Axle bolt                        |        1 | M4×40 ISO 4762 steel, certified grade and combined-load capacity still to be selected                                                                  |
| Independent keeper washer        |        1 | M6 DIN 9021 / ISO 7093 large-series washer, nominal 6.4 bore × 18 OD × 1.6 thick                                                                       |
| Stem spacer                      |        1 | 4.3 bore × 8 OD × 10 long metal spacer; Essentra/Richco **311431040050**, nickel-plated brass, catalogue candidate                                     |
| Carrier underside washer and nut |   1 each | M4 large washer and M4 prevailing-torque locknut; measure actual dimensions                                                                            |

The [manufacturer spacer catalogue](https://essentracomponents.bynder.com/m/349a8daccce450c7/original/2569513-pdf.pdf)
lists 311431040050; [Nostromo in Estonia](https://nostromo.ee/catalog/metal-spacers/spacer-metal-series-311/)
is an EU listing route. Stock, small-quantity availability and Portugal
shipping have not been confirmed. This replaces an unspecified custom axle
spacer with a catalogue geometry, not a confirmed purchase.

The Ganter centring bushes adapt the 5 mm bearing bore to an M4 screw and
clamp the inner race. The outer race must remain free. From the header face,
the nominal stack is:

| Datum, positive downward                   |    Position |
| ------------------------------------------ | ----------: |
| Axle screw-head top / underside            |   6.5 / 9.5 |
| Roller centre                              |          15 |
| Separate keeper washer top / underside     | 20.5 / 22.1 |
| Track retaining strips top / underside     |     25 / 29 |
| Carrier shelf top / underside, provisional | 32.1 / 38.1 |
| Locknut underside                          |        44.1 |
| M4×40 screw tip                            |        49.5 |

Nominal vertical movement is **2.5 mm upward / 2.9 mm downward** before
contact. Verify both against actual components, print errors and leaf sag.
The 18 mm keeper washer overlaps the 10 mm throat by 4 mm per side when
centred. Allowing 0.5 mm roller side movement and 1.2 mm washer eccentricity
still leaves **2.3 mm nominal overlap**. This is a geometric check only.
The 8 mm spacer has 1 mm nominal clearance per side in the throat.

**The steel washer retains the axle if the POM wheel fails, but it still
depends on intact printed lips.** If a lip, carrier or module mounting fails,
the follower may escape. The metal hinges then support the leaves, but do
not preserve the guided path. No independent metal rail retention is claimed.

The roller's 400 N catalogue radial value is not the capacity of this
assembly. The M4 axle, spacer/clamp stack, PETG lips, carrier and header nuts
need their own checks. In particular the projecting M4 screw has a bending
load; its threaded-root section must not be treated as a 5 mm solid shaft.
The earlier 100 N guide load screen is **not** a test authorisation or a rating
for these prints.

## Full-length layout after the coupon

The generator includes full-rail prototype STLs for dimensional review, but
print them only after accepting the coupon fit and joint behaviour.

| Opening          | Rail running region | Bodies | Body length | Retaining strips | Alignment keys |
| ---------------- | ------------------- | -----: | ----------: | ---------------: | -------------: |
| Rear, 750 wide   | x = 80–750          |      5 |      133.84 |               10 |              8 |
| Left, 824.5 wide | x = 85–824.5        |      5 |      147.74 |               10 |              8 |

Both lengths include four 0.2 mm joints. Each opening uses 30 M4 header
fixings. The largest body plus 5 mm brim on both ends occupies 157.74 mm,
comfortably within the A1 mini's 180 mm bed. The plan reserves running space
beyond the initial guide overtravel identified in revision B.

Use metal end stops fixed directly to the header, such as suitably oriented
profile angle brackets, contacting a metal follower feature. Their exact
reference/position and that contact feature remain to be detailed. Printed
end covers may keep dust out but are not approved impact stops. The final
assembly also retains separate door closed stops and parked catches.

**The carrier has not been released as an STL.** Its 6 mm shelf and mounting
to the secondary stile need a bending/fastener check and a swept-clearance
check against the rail's screw heads. In particular a wide shelf or upright
can hit the two longitudinal rows of protruding mounting screws; do not
attach an arbitrary printed L bracket. The coupon tests the rail independently
of this unresolved part.

Reserve **55 mm headroom provisionally** for the printed rail and axle/carrier
stack. At 740 opening height and a 3 mm bottom gap, leaf height becomes
**682 mm**. This replaces revision B's provisional 702 mm height; widths,
88° parking angle and planar sweeps are unchanged. Do not cut new frames
until the carrier and stack are confirmed.

## Coupon assembly and acceptance

1. Measure printed channel width, slot width, body flatness and keeper-strip
   thickness. Reject lifted corners, delamination or missing walls.
2. Fit the two keys and mount the two bodies on a short piece of the actual
   3060 header, leaving the nominal 0.2 mm joint. Install all 12 M4 fixings
   through the retaining strips to compatible steel slot nuts.
3. Insert the real roller/bush/washer stack from an open end. Move it by hand
   through the joint while keeping it centred vertically. Check both running
   faces and the full side movement. The bearing must rotate without the
   washer rubbing the outer race or the stem snagging the throat.
4. Measure vertical float and washer overlap. Check capture gently with a
   metal keeper-only dummy stack after removing the roller: do not rely on
   the wheel as the only thing wider than the throat.
5. Perform 200 hand traversals, then another 200 with a small, representative
   quantity of collected workshop dust. Record peak pull force with a spring
   scale if available, joint catching, visible wear and fastener movement.
   These counts are project screening choices, not a life qualification.
6. Reinspect after at least 48 hours clamped at expected workshop temperature.
   Record clamp loss, indentation and dimensional change. A passing short
   dwell does not establish long-term creep performance.
7. Only after fit/wear observations, define lateral and retention test loads
   from the axle/carrier/rail calculation. Keep the test restrained on the
   bench; do not use a hanging door as the first strength test fixture.

Any ridge that catches the roller, binding bearing, lost retention overlap,
crack, persistent loosening or progressive wear requires a revision before
full-length use. Agree a numerical acceptable operating force and permanent
deflection limit after the first baseline measurement. No physical result
has yet been recorded.

## Reproduction and verification

Run `node scripts/printed-bifold-guide.mjs` from the project root with Node 24.
Dimensions and stack arithmetic are in `engineering/bifold-assembly/printedBifoldGuide.ts`;
the generator uses Replicad/OpenCascade to create the seven STL files and
[prototype-manifest.json](prototype-manifest.json). Parts have positive CAD
volume and fit the bed. Mesh checks and automated tests verify geometry,
not filament strength or physical function. No G-code or machine-specific
temperature commands are included.

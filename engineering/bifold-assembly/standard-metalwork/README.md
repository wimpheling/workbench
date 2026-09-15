# Standard metalwork investigation — 2026-09-14

**Superseded by [active stock-metal integration](../../../v3/docs/STANDARD_METALWORK.md).**
The following records the investigation: its 2 mm carrier mounting gap and
end-head clearance are corrected in the active implementation.

Standalone engineering study against active v3 revision `629b576e77187fd6`.
The live app and quotation BOM still contain the existing metalwork. This
investigation identifies alternatives; it does not silently replace them or
approve a load-bearing assembly. All three functions stay in metal.

## Findings

| Function | Preferred route | Preparation still needed |
| --- | --- | --- |
| Two roller carriers | Cut two 18 mm-wide slices from S275JR 80×40×6 unequal steel angle | Three drilled holes per slice, deburring/coating; root section and mounting stack confirmation |
| Four closing tabs | Cut four 60 mm lengths from 50×4 steel flat bar, retaining the current 60×50×4 shape | Two Ø6.5 holes on 30 mm pitch per tab, deburring/coating |
| Two rail retainer assemblies | Four 20×4 stock strips plus four 50 mm-wide slices of 30×20×4 steel angle as bolted end barriers | Cut strips, drill existing fixing pattern, saw an axle notch in each angle foot, drill two fixing holes per angle; longer end screws |

This replaces one-piece machining and welding with stock cutting, drilling
and a small saw-cut notch. It is not a zero-fabrication design. An ordinary
metalworking saw/drill setup or stock supplier preparation is still required.
A printed drilling jig may assist preparation; it does not carry a load.

## Sources checked

Prices are displayed evidence, not delivered quotations. No order or supplier
message has been sent. Unavailable prices/stock are left unresolved.

- [Masterferro unequal-angle catalogue](https://www.masterferro.pt/uploads/catalogo/ficheiros/1626027514_2769_TT2.5_cant.ab.desiguais.pdf): S275JR, 80×40×6 (5.410 kg/m) and 30×20×4 (1.460 kg/m), certified material listed in 6 m bars and sold by weight. Price, stock, short offcuts and minimum cutting length require a quote. Retained original PDF and hash.
- [Leroy Merlin / COMMENT FER 20×4 stainless flat, 1 m](https://www.leroymerlin.pt/produtos/barra-chata-inox-20-mm-esp-4-mm-comprimento-1-metro-88312658.html): €9.64 each; four lengths €38.56 before delivery. Page displayed online-only supply and 7 working days / €52 delivery. Grade was not established by this listing; do not assume 304 certification. [Moris 20×4 1.4301/1.4307](https://moris.eu/en/product/2010295/stainless-flat-bar-hot-rolled-20x4-1.4301-1.4307-l-6-m) offers a specified-grade alternative and custom cutting, with login/quote needed.
- [Leroy Merlin / COMMENT FER 50×4 steel flat, 0.5 m](https://www.leroymerlin.pt/produtos/barra-chata-aco-50mm-esp-4-mm-comprimento-0-5-metro-89948500.html): €3.91 displayed. One length yields four 60 mm tabs with cutting allowance. Delivery and steel grade unresolved.
- [Motedis LP30105SB square connector plate](https://www.motedis.com/en/Square-connector-plate-58x58x3-Lasercut-STEEL): alternate ready-made tab, 58×58×3 steel, four Ø6.5 holes at ±15 mm in both directions confirmed from genuine STEP. Page displayed 3–6 business days ex works, but price fields were placeholders; Portuguese delivery route/price unconfirmed. Vendor PDF and STEP downloaded directly from the product links and retained unchanged.
- [Motedis BR40STB steel angle](https://www.motedis.com/en/Steel-Connection-Angle-40-black-I-Type-slot-8): 40×40×40×5, M8 countersunk mounting. Page displayed €11.55 excluding VAT per ten and €13.87 including its selected 20% VAT; this is not a Portuguese delivered price. Genuine STEP downloaded unchanged. Rejected as a direct carrier replacement: 40 mm upright and one root hole do not reproduce the existing two M6 stations and axle height. An additional mounting plate would create another structural connection.
- [Motedis 74×40 bracket](https://www.motedis.com/en/Bracket-74x40-steel-black-galvanized): listed with 3–6 business days ex works; price placeholders and insufficient hole/section information on the inspected page. Lead only, not fitted CAD.

Files from Motedis use the public `https://www.motedis.com/shop/products_files/`
path with the exact filenames retained here. `asset-hashes.json` records SHA-256.
No stock shape is presented as vendor STEP. Masterferro angle roots, toe radii
and rolling tolerances are not defined by the retained size table.

## Carrier geometry and connection

The trial keeps the existing M4 axle location and shelf top at H−36.1 mm.
The 80 mm vertical leg ends at H−116.1 mm. Its attachment face is unchanged;
the steel wall is 6 mm rather than the current 8 mm aluminium wall. The M6
hole centres remain H−75 and H−105 mm, and the axle is 23 mm from the frame
attachment face. The 40 mm short leg needs no longitudinal trimming in the
nominal screen. Both holes sit on the same free-stile face slot, outside glazing.

An 18 mm slice retains the old upright width and hole edge distances. The
catalogue mass gives about 97 g per unperforated slice. This is not a capacity
calculation. Rolled root/toe radii, flat washer seats, squareness and actual
thread engagement must be checked. The M4 shelf stack retains its 6 mm
thickness, but the M6 root stack becomes 2 mm thinner: do not reuse the old
screw-length instruction automatically. Root screws/tools are not included
in this screen. Racking, axle bending and retained-load requirements remain open.

## Closing tabs

The preferred 50×4 stock route exactly reproduces the existing solid and
hole datums with simple saw/drill operations, so it does not require a new
thickness assumption. Choose certified stock/finish before procurement.

The LP30105SB alternative was screened using its intact genuine STEP, with
two holes on the jamb slot and the other two unused. Its frame contact face
stays at the existing datum. Its 3 mm thickness is a material tradeoff: for
an otherwise identical rectangular strip, bending stiffness scales as t³
and bending stress as 1/t². A 3 mm strip has 42% of the 4 mm strip stiffness
and 1.78 times its stress under the same load. These comparisons are not a
rating for the differently shaped actual plate. Do not select it merely
because its rigid geometry fits. Impact/pad and M6 engagement remain unvalidated.

## Bolted retainer geometry

Keep the 10 mm axle slot and 4 mm steel keeper thickness. Widen each strip
outward by 2 mm, moving its centre 1 mm outward: rows remain ±15 mm, inner
edges remain ±5 mm, overall width becomes 50 mm. The wider stock introduces
no nominal rigid clash in the screen. Flexible brush interactions remain.

Each 30×20×4 stock angle is cut 50 mm wide. Its vertical inner face matches
the old end barrier, with its top 3 mm below the header underside. Its foot
sits beneath the keeper strips, increasing the end clamp stack from 29 to
33 mm. A 10 mm-wide, 16 mm-deep notch in the foot opens from the free edge
toward the upright, maintaining the axle escape slot. Two Ø4.5 holes lie
12 mm from the outer end and ±15 mm from the rail centreline. Saw and drill
these features; no tapped holes or welds are proposed.

Shorten the keeper strips by 4 mm at EACH end to meet the angle uprights:
nominal left cuts 731.5 mm (two), rear 662 mm (two). Keep all hole world
datums unchanged; the first hole is therefore 8 mm from the new cut end.
The other 52 header fixing positions keep their current stack. Eight end
positions propose M4×40 in place of M4×35, subject to actual nuts/engagement.
The screen includes nominal Ø8×3 heads and Ø4×40 unthreaded shafts at those
eight positions. The head envelope leaves only 0.1 mm vertically above the
carrier shelf when their XY projections coincide. This is not an acceptable
claimed tolerance allowance: select a confirmed lower head or revise the
stack and verify tools/tolerances before integration. A print change alone
must not transfer the metal clamp load into PETG.

The rigid end-barrier replacement is an L-section with a notch, not a flat
bar held in friction by a single screw. Both mounting rows participate, but
bolt preload/slip, heel bending, hole bearing/tear-out, head support, slot-nut
engagement and backup impact loads still need validation. Rolled root radii
could affect seating at the strip ends and notch and are absent from the
nominal rectangular section used here. Mixed steel/stainless finishes and
contact with aluminium also need a suitable corrosion treatment.

Assembly remains staged: support the door independently; fit roller and
bushes, metal sleeves/bridge washers, separate keeper strips and bolted end
angles before completing the lower axle/carrier stack. Tool access and
removal order need the final fixing solids and actual tools. This study does
not claim full assembly access from static clearances.

## Digital evidence and limits

`screen.py` builds an isolated candidate copy of the current authoritative
model, uses genuine LP30105SB STEP, and checks candidates against the actual
assembly solids at 0, 0.1, 1, 5, 25, 50, 75 and 100% opening. Extrusions,
hinges, rollers, bushes, panels, gaskets and catches remain from the live
model. Carrier blocks are fused as a single angle for the probe. Every
candidate/rigid-component interaction is checked; flexible intersections
are reported separately, not turned into passes. No active collision policy
or exclusion has changed.

`screen-results.json` records zero rigid clashes at all eight poses, with
12 flexible intersections at most poses and 14 at 5% opening. These are
study intersections, not additions to or resolutions of the live report.
`capture-results.json` records a separate final-pose run: a 4 mm downward
washer displacement intersects each keeper by 46.317 mm³, and moving the
roller centre onto either end barrier intersects it by 389.587 mm³. These
are geometric capture witnesses, not drop/impact/tilt tests. All 11 existing
engineering tests pass; `git diff --check` passes. No active model/UI code
changed, so backend/frontend release checks and browser acceptance were not
rerun for this standalone investigation.

`screen-results.json` is the final screen; `initial-screen-results.json`
records the earlier stock-bar/plate/carrier screen before bolted end angles.
The results are nominal discrete-pose evidence, not full continuous motion,
tolerance, tooling, impact or strength validation. No new hardware is approved
for procurement and no current custom component is marked resolved in the app.

Run from the repository root:

```sh
uv run --project v3 python engineering/bifold-assembly/standard-metalwork/screen.py
npm run test:engineering
```

Next engineering work: confirm stock/root sections and sourced low-head end
screws, finish thread and tool envelopes, resolve the actual brush holder,
verify end/washer capture and continuous motion with tolerances, establish
loads and check the metal connections. Then integrate the chosen prototypes
into the active model, BOM, supplier cuts and browser with full regression.

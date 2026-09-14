# Standard leaf joints and closed retention — 2026-09-14

Latest intent — 2026-09-14: a **simple enclosure, not a hermetic seal**. Bottom gaps on both bifolds are intentional, not missing-seal failures. One original PETG swing lever and keeper across each folding joint now provides light manual retention; lift before opening. No magnets or bottom hardware return. See [swing-latch design](SWING_LATCHES.md) for mounting, prints, sourcing and remaining physical fit checks. This supersedes earlier absent-retention and mandatory-bottom-continuity statements below.


Current change — 2026-09-14: user requested removal from **both bifolds** of the bottom perimeter seals/backing and complete closed catches. The unsupported bottom rigid strips are removed with their backing. No GN4470 magnets, strikes, PETG holders or dedicated M5/M6 fixings remain in the active inventory, schedules or print exports. Vendor assets and prior sourcing studies are retained as history only. Both lower openings are now unsealed and closed-door retention is absent. Bottom containment obligations remain active; uncovered area must report failure. Four 88° travel stops and stock metalwork remain. No parked catches are reinstated.


Prototype integration, **not released for manufacture**. This replaces the
BF-CORNER-65 leaf plates and the unfitted GBL3030.KIT proposal. No parked
magnets, parked holders, parked fixings or hold-open requirement are restored.
The four existing PETG 88° travel stops remain.

## Source evidence

Pages checked 2026-09-14; displayed prices include tax, exclude freight, and
are neither reservations nor confirmations of delivery to Lisbon.

| Item | Quantity | Displayed unit / extension | Availability evidence |
| --- | ---: | --- | --- |
| [Wolweiss CJP3030L](https://reiman.pt/en/wlw-cjp3030l-cjp3030l-30x30-joining-plate-type-l/) | 16 | €5.40 / €86.40 | 1–4 under 48 h; above five on request; sixteen not confirmed |
| [Ganter GN4470-50-A1-L2-SR](https://reiman.pt/pt/gn-4470-50-a1-l2-sr-magnetic-catches-magnetic-surface-top-with-bore/) | 2 kits | €22.48 / €44.96 | 1–16 shown 3–4 days |
| [Wolweiss BPN08M6](https://reiman.pt/en/wlw-bpn08m6-bpn08m6-slot-8-m6-pre-assembly-nut/) | 88 proposed | €0.43 / €37.84 | Live listing 1–11604; dispatch cell blank; end-loaded nut |
| [GBL3030.KIT](https://reiman.pt/pt/wlw-gbl3030-kit-gbl3030-kit-double-ball-catch-for-structure-with-30x30-profiles/) | superseded | €11.86 | 1–5 under 48 h; mounting/strike CAD unavailable |

The selected plates and catches total **€131.36**, before fasteners, printing
and delivery. Kit inclusion of fixing screws is not assumed.

The unchanged [CJP drawing](https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/cjp.pdf)
is retained as `backend/enclosure/assets/CJP.pdf`, SHA-256
`ac8ca6b0d677eb5e7b692cef94940fb9f907d8987ab0f25d731bf38bf0edb9e0`.
It specifies zinc-plated steel, 88 mm arms, 26 mm width, 2 mm thickness,
five Ø6.5 holes on 30 mm centres. The model uses square corners instead of
undimensioned radii and is explicitly **drawing-based**, not vendor CAD.
The CJP3030L STEP was requested from the user; no substitute STEP is claimed.

The unchanged user-downloaded `4470-50-A1-L2-SR.step` is retained as
`GN_4470-50-A1-L2-SR.step`, SHA-256
`91157e617f3e06efe4bd0bc341e1fbb6b5911e64b60a272773b14ddd39e6fa7f`.
Both original solids are used without scaling or modification. This is a
separate closed-retention selection, not reuse of the removed C2/L3 parked
installation. Source bounds: magnet 50 × 10.5 × 12 mm; L2 strike 28 × 26 ×
12 mm. Source magnetic plane Y=5.5; magnet mounting back Y=-5;
strike foot Z=6. [Manufacturer description and installation guidance](https://www.ganternorm.com/en/products/3.9-Holding-with-magnets/Retaining-magnets-rectangular-shaped/GN-4470-Magnetic-catches-with-rubberized-magnetic-surface)
requires full-face contact for A1/A2. Nominal catalogue holding force is 30 N;
this is not a force-versus-gap curve or a rating for these adapters.

## Leaf joints

Sixteen bought CJP3030L plates replace the sixteen custom stainless plates.
Each attaches on the inward broad face with five proposed M6 slot fixings:
80 screws/nuts total. Proposed M6×10 ISO 7380 button-head screws (Ø10.5 × 3.3 mm head) with 1.6 mm washers
leave 1.6 mm nominal tip clearance to the exact slot floor; M6×12 would
penetrate that floor by 0.4 mm with this stack. Nut seating/engagement still
requires the requested BPN CAD. Plate limbs follow the stile and rail slot centres;
no connector occupies the Lexan/FSP08 glazing slot. Frame/panel cuts,
thermal reserve and gasket study geometry stay unchanged.

Only the lower/upper **interleaf** hinges move 25 mm toward mid-height,
from 90 to 115 mm from the leaf ends. Frame hinge stations remain unchanged
because moving those would interfere with retained printed travel stops.
The actual CFG STEP leaves and pins remain unmodified.

Assembly: preload the face-slot nuts before closing the frame ends; loosely
join stile/rails around the gasket/panel, square the frame, tighten the five
plate screws using inward-face access, then fit/adjust the interleaf hinges.
Do not use plate tightening to preload or immobilize the polycarbonate.
The [BPN drawing](https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/bpn.pdf)
is retained as BPN.pdf; stepped nut seating, actual screw length, engagement,
torque and joint rating remain unvalidated pending exact nut STEP/confirmation.
BPN08M6 STEP was requested. The model must not treat the slot number alone
as proof of compatibility. PETG does not replace any structural leaf joint.

## Closed retention

One A1/L2 kit per bifold is the prototype quantity: each guided pair has one
opening coordinate. The catch acts on the primary lower rail at 60% of its
pivot span, supported from the fixed bottom rail. On smaller openings the
station is limited to primary span minus 137.5 mm, keeping the 80 mm fixed
adapter at least 5 mm clear of the interleaf corner plate. At the nominal 30 N catalogue
force this gives 7.02 N·m on the left and 6.35 N·m on the rear, approximately
19 N equivalent resistance at the primary handle. Those are kinematic
calculations using the catalogue force, not measured holding/release ratings.
Draught, pressure, seal forces, racking and accidental loading have no confirmed
requirements or capacity evidence. One station is a prototype selection, not
proof that additional vertical restraint is unnecessary under every load.

A screened catch position at the guided free stile was rejected: its very
short effective lever arm gave poor resistance at the main handle even when
its rigid geometry cleared. It is not retained in the active model.

Each kit has a fixed-bottom-rail PETG adapter and a primary-lower-rail PETG
adapter, with two M6 root fixing positions each (eight total). Both roots
mount to inward broad faces, with holes on 40 / 38 mm horizontal centres at Z=-15
and Z=18 respectively. Fixed side bridges pass above the unmodified bottom
perimeter backing, outside the moving adapter. No sealing parts are cut away.
These adapters carry catch forces only; bought hinges carry the door weight.

Rotate source CAD 180° about X. At the dimension-dependent station described above, the magnet source origin is (X,70,39), and the strike origin is
(X,70,37.5). The 1.5 mm vertical offset is necessary: the vendor assembly pose
covers only about 155.89 of 167.79 mm² of magnetic face. The revised datum
covers the entire 167.79 mm², with ±0.5 mm vertical margin before coverage
starts reducing. This remains a tolerance concern, not manufacturing approval.

The L2 slots permit adjustment along the approach direction. The proposed
strike screws sit 3 mm from slot centre to leave room for the underside
spanner. Slide the strike until its full face just contacts the magnet at
closure, then lock the screws. Do not force interference to obtain preload.
Root nuts adjust along the rail; vertical alignment relies on the actual
profile/print stack and must be checked before use. The modeled catch is a
pull-release closure device operated with the existing handles, not a lock.

Four M5×20 magnet fixings and four M5×16 strike fixings are modeled as
**nominal metal geometry**, not vendor STEP: Ø8.5 × 5 heads, Ø10 washers,
8 mm AF × 5 nuts and unthreaded shafts. Eight M6×14 root screws are modeled too: fixed DIN 7991 countersunk heads
sit 1 mm proud, and moving socket heads use 1.6 mm metal washers. Nominal
shaft-tip clearance to the exact extrusion slot floor is 1.0 / 1.6 mm.
The BPN08M6 nuts remain schedule-only: their stepped seating and actual
thread engagement are not established. Proposed engagement assuming a
2.2 mm lip setback is about 4.8 / 4.2 mm, not a thread-strength approval.
M6×16 roots were rejected because their tips enter the actual slot floor.
Tighten fixed root screws **before installing the unchanged bottom stop and
backing strips**; their long driver path is blocked after those strips are
fitted. Reinstall both barriers. Service requires removing those strips.
Tighten moving roots with the door open before aligning the catch. Magnet drivers
approach from outside; strike drivers approach vertically from above.

Nominal access probes check Ø6 × 80 mm M5 driver routes and Ø18 × 3 mm
magnet spanner-head envelopes with the door closed, a Ø12 × 25 mm strike
nut socket envelope with the door 25% open, and Ø7 × 80 mm root-driver
routes with the bifold 25% open at the declared assembly stage. The fixed
magnet driver also requires the door open: the closed panel blocks it. The engaged fastener itself is omitted from
the spanner probe because its envelope has no wrench cutout; all other rigid
parts remain obstacles except the two bottom strips explicitly absent during
fixed-root installation. Final solid and motion tests include both strips. Actual tool and hand dimensions remain unspecified.

Both adapter STLs and revision-tagged quantity-two manifests are exported
under `printed-prototypes/BF-CLOSED-*-HOLDER`. STL contains only PETG, not
vendor hardware. Initial A1 mini settings: PETG, 0.2 mm layers, six walls,
50% infill; support and layer orientation require a trial. No strength,
creep or cycle approval follows from a watertight mesh.

## Evidence and remaining questions

Native checks exercise closed, 0.1%, 1%, 5%, 25%, 50%, 75% and 100% opening,
including early release; default verification also runs the existing continuous
motion-bound machinery. Unresolved intervals stay unknown. No physical pair
was excluded to obtain a pass. Flexible perimeter-brush overlap remains a
flexible-contact uncertainty, distinct from the unchanged slot-glazing capture.

Full-face coverage has an authoritative verification check plus deliberate
misalignment and missing-strike tests. Gasket/plate intersections and actual
hinge stations are tested. These are nominal geometry checks, not tolerance,
structural, magnetic-force or seal-performance certificates.

Remaining digital gaps: exact CJP and BPN CAD, final root fastener engagement,
adjustment travel and tool access under tolerances, continuous
motion intervals not resolved by the existing bounds, and retaining-load
requirements/adapter stress analysis. Do not mark these as completed merely
because the sourceable hardware is modeled.

Retailer-only questions: confirm sixteen CJP3030L availability/price including
shipping; BPN08M6 fit/engagement and screw lengths for this exact AST03003004;
plate joint rating and CFG loads at revised stations; actual catch force and
force-versus-gap data. No retailer has been contacted or order placed.

Physical work outside this task: PETG fit/strength/clamp-creep trials, full-face
contact and repeatable release, racking/retention load tests, sag/squareness,
dust/cycle tests and commissioning. Existing Lexan/FSP08 compound compatibility,
minimum panel engagement, guide/carrier and other enclosure uncertainties remain.

Root screw source lead, checked 2026-09-14: [DIN 7991 M6×14 A2](https://alleschrauben.de/Schrauben/Senkkopf/Senkkopfschrauben-DIN-7991/Senkkopfschrauben-M6x14-mit-Innensechskant-DIN-7991-Edelstahl-A2). Exact head dimensions, pack price, delivery and the socket-head counterpart still need confirmation. Different DIN/ISO head dimensions must not be silently interchanged in the printed countersink.

CIB08T was not selected for leaf corners: compatibility with this exact profile
and the glazing path was not established. Face plates keep the inner slots free.
The previously reported CJP3030L/interleaf-hinge interference is resolved by the
25 mm end-station change; frame-hinge stations cannot share that change because
of the retained travel stops.

The fixed adapter roots/screws overlap the provisional bottom brush envelope.
This is recorded as a flexible-contact uncertainty, not a collision exclusion
or proof that the actual brush holder can be installed there. Its real section,
attachment and any routing around the roots still require supplier evidence.
The slot-captured Lexan/FSP08 components have no plate/adapter penetration in
these checks; their existing compound and engagement uncertainties remain.

## Historical corner/catch-only artifact acceptance

The current stock-metal integration and its acceptance are recorded in
[STANDARD_METALWORK.md](STANDARD_METALWORK.md). Counts below describe the
earlier corner/catch-only revision, before carrier/retainer replacement.

Revision `629b576e77187fd6`: 476 modeled parts, 1,657 passing checks, zero
failures and 135 unknowns. Both magnetic faces have 167.785398 mm² required
and covered contact area. Eight additional brush-overlap unknowns plus the
catch-installation assumption explain the increase from the previous 126.
Continuous motion remains unknown overall; no unresolved interval was waived.

The live ZIP is saved under `v3/artifacts/hardware-screen/standard-hardware-quotation.zip`.
Its assembly STEP re-imports valid with 492 solids. Fixed/moving holder STLs
have 3,364 / 2,060 facets, every mesh edge shared twice, zero-based print beds,
80 × 43 × 94 / 60 × 24 × 28.5 mm bounds, and quantity-two manifests matching
the model/report revision. Browser acceptance passes in 5.0 minutes, including
the notes tab, removed parked hardware and request-free articulated motion.

Corner screw source: [Accu SSB-M6-10-10.9-Z](https://www.accu.co.uk/socket-button-screws/494859-SSB-M6-10-10-9-Z), with [RS ISO 7380 dimensions](https://assets.rs-online.com/image/upload/v1699676761/Datasheets/9b54e85d92abd4d6f7c1c48e8e3e41c0.pdf), checked 2026-09-14. Use the low button head, not a 6 mm-high socket cap head in the folded interleaf space. Pack pricing/delivery, supplied head and washer tolerances remain pending. Corner fixing stacks are schedule-only physical inventory, with separate nominal native clearance probes; the assembly STEP does not silently claim to include these 80 screws/washers or the slot nuts.

Validation: `npm test`, `npm run check` and `npm run build` pass (149 backend, 44 frontend and 11 root engineering tests). The full check preceded the final corner screw schedule refinement and addition of this document to the ZIP; those final changes were checked with native fixing-stack audits, live export inspection and browser acceptance. All 80 nominal button-head/washer/shaft stacks clear at closed, quarter, half, three-quarter and fully open poses; closed assembly shaft and driver routes also clear. Slot-nut engagement remains unvalidated. Audit script/results: `v3/artifacts/hardware-screen/corner-stack-audit.py` and `corner-stack-clearance.txt`.

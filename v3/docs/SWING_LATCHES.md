# Simple bifold swing latches — 2026-09-14

Current intent: a simple enclosure, not a hermetic enclosure. Both bottom strip stacks stay removed. Their nominal 3 mm lower gaps and the local meeting-wipe breaks around the latches are intentional openings, not missing-seal failures. Other fitted barriers and collisions remain checked. Chip escape in use remains an observation to make, not a demand to reinstate bottom seals.

One original printed swing lever on the primary leaf engages a printed open-top keeper on the other leaf of each bifold. This blocks the folding joint, which controls the guided pair's opening motion. Gravity seats the horizontal lever on the keeper ledge; the forward lip prevents folding. It does not pull the leaves against gaskets. Lift the lever 90° and hold clear while starting to fold; close both leaves fully before lowering it. The viewer assumes this manual release whenever opening is nonzero: it is not an automatic mechanism. Four separate 88° travel stops remain; no parked catches or magnets.

## Parts and mounting

For **both doors together**: two PETG levers, two PETG keepers, two M6×16 ISO 7380 pivot screws, four M6×14 ISO 7380 keeper screws, six 1.6 mm ISO 7089 M6 washers, six BPN08M6 slot nuts. The nominal model combines each screw and washer in one inventory row. Slot nuts are scheduled, not invented CAD. No custom metalwork or metal spacer is needed for this latch.

Each lever is 62×24×8 mm with a 6.5 mm pivot bore, 24 mm pivot boss and rounded finger end. Pivot and keeper use the exterior slots of the two meeting stiles, 35 mm apart. Pivot height is enclosure H/2 − 150 mm, below the handles, with over 20 mm nominal clearance to the primary handle when fully raised. Keeper is 20 mm wide with two 6.5 mm bores 25 mm apart below the latch, preventing rotation. Its open-top retaining lip has 0.4 mm nominal front clearance; the lever rests on its lower shelf. Some opening play is intentional. Native bisection finds first keeper obstruction at about 0.425° primary-leaf opening, approximately 2.9 mm (left) / 2.6 mm (rear) outward joint movement. This is a geometric estimate, before printed fit, bolt clearance and flexibility. All mounting stays off the panels and glazing slots. Leave a 121 mm break in the adhesive meeting wipe around the latch (68 mm below its pivot and 53 mm above). Cut the wipe into two pieces from the same stock kit. This keeps adhesive/foam out of the pivot, keeper and lifting path; the small unsealed meeting region is intentional.

Lever's 8 mm thickness + 1.6 mm washer + M6×16 gives 6.4 mm nominal penetration beyond the extrusion face; keeper's 6 mm root + 1.6 mm washer + M6×14 gives the same. Native collision and contact tests use the actual extrusion STEP. This establishes floor clearance, not actual nut thread engagement: the BPN08M6 internal section remains unconfirmed. Slide nuts in before closing the stile ends with frame joints/glazing.

Set the pivot screw for hand-turnable friction, not a hard clamp on PETG. Try the fit and screw resistance to loosening; PETG bearing wear/creep may require adjustment. The keeper slides vertically in the slot to align its shelf. Keep the 0.4 mm running gap free after printing; don't force a poorly fitting latch closed. A gentle hand-pull and repeated operation are the intended acceptance trial. This is light retention, not a security lock, slam restraint or structural door support.

## Printing and exports

Bambu A1 mini PETG trial: 0.2 mm layers, five walls, 50% infill. Lever broad face down; keeper side face down so its hook is printed in the bed plane. Supplied STLs have these orientations and sit on Z=0. Check 6.5 mm bores against real screws; ream if needed. Each STL/JSON manifest is quantity two and shares the assembly revision. Original CAD, not vendor geometry. The quotation pack also includes this note and the installed STEP/BOM/fixing schedule.

## Sourcing evidence checked 2026-09-14

- [Reiman BPN08M6](https://reiman.pt/pt/wlw-bpn08m6-bpn08m6-slot-8-m6-pre-assembly-nut/): indexed retailer page lists €0.35 net / €0.43 including tax each and quantity 1–12,404 dispatched under 48 hours. Six nuts = €2.58 including listed tax, before delivery. Direct fetch was unavailable; verify checkout availability. The product explicitly requires insertion from the extrusion end.
- [Motedis screw catalogue](https://www.motedis.com/it/Negozio-di-viti/Configuratore) and [M6×16 ISO 7380](https://www.motedis.co.uk/en/Screw-DIN-7380/M6x16): indexed catalogue offers M6×16 at €0.04 net. [Catalogue](https://www.motedis.com/hu/Test) also lists M6×14. Direct variant pages could not be fetched. Exact Portugal variant price, stock and delivery for both lengths and washers remain checkout questions; no total hardware price is claimed.
- [Swing latch example](https://www.printables.com/model/328374-swing-latch-for-cabinet-door) was a mechanism lead only; download page unavailable. No geometry copied or represented as vendor CAD. This latch is modeled for the actual 35 mm meeting-stile pitch.

The design avoids a proprietary catch kit and uses the same M6 slot-hardware family already required by the doors. Generic PETG is acceptable; a filament datasheet is not a rating for this printed latch.

## Digital evidence

Sixteen focused native tests pass: eight opening positions, six supported-size extremes, a 0–90° lever lift sampled every 5°, locked-versus-released obstruction, actual extrusion mounting contact, straight 80 mm tool approaches and print-manifest quantities. The locked obstruction is intentionally tested as a blocking contact; it is never excluded to pass an opening-motion collision check. Actual opening checks use the manually released lever. Frontend unit coverage checks release about the correct pivot before the leaf transform.

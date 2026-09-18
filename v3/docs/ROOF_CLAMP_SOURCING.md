# Independent roof panel fixings: supplier evidence

Research updated 2026-09-18. The owner cannot cut or drill metal. The previous
40×20×3 mm custom plate proposal is rejected, as are the custom roof support
straps and angle. Shared washer clamps were subsequently rejected in favor of
independent through-panel fixings. The five internal supports now have two
upward-facing slots. Only wood boring and soft-gasket cutting remain.

## Selected prototype components

| Component | Supplier evidence | CAD/model status |
| --- | --- | --- |
| Reiman / Wolweiss AST03006006 | [30×60 profile](https://reiman.pt/en/ast03006006-aluminium-profile-30x60-6-slots/), supplied cut to length. | Existing supplier STEP section, swept without scaling. Five internal members use the 60 mm face horizontally for two upward slots; outer frame height is unchanged. |
| OBO 3403092, WS M6 G30 G | [Portuguese manufacturer datasheet](https://www.obo.pt/datasheet/?file=WS_M6_G30_G-3403092-pt_PT.pdf); galvanized steel washer, 30 mm outside, 6.4 mm bore, 1.3 mm thick. [Bürklin retail listing](https://www.buerklin.com/en/p/obo-bettermann/nuts-washers-rings/3403092/46P2285/). | Datasheet retained locally. Annular solid reconstructed from published dimensions; supplier STEP not obtained. Used as a load-spreading washer for one panel only; wood bearing and tightening remain unvalidated. |
| Reiman / Wolweiss BTN08M6 | [Product](https://reiman.pt/pt/wlw-btn08m6-btn08m6-m6-slot-8-t-nut/), [BTN drawing](https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/btn.pdf). M6, slot 8, nickel-plated steel; insertable after frame assembly. | Drawing retained locally; CAD link requires login. Nuts are included in the hardware schedule, not represented by invented supplier STEP geometry. Nut rotation, engagement and repeated removal remain to check. |
| Reiman / Wolweiss CBR3030 | [Product](https://reiman.pt/pt/wlw-cbr3030-cbr3030-30x30-bracket/), [series-30 connector guide](https://reiman.pt/en/blog/technical-article/what-connectors-are-compatible-with-the-30-series-aluminium-profiles). Die-cast aluminium bracket for slot-8 profiles. | Existing `CBR3030.step` vendor asset used intact. Six plan-oriented brackets replace the custom support metalwork. CAD establishes nominal contact and absence of penetration; screw/tool access and capacity still need validation. |
| Stock M6 socket screws | Standard full-thread ISO 4762 / DIN 912 family. [Accu M6×16](https://accu-components.com/us/metric-cap-head-screws/386809-SSCF-M6-16-12-9-Z) example; bracket hardware follows the Wolweiss catalogue. Ask Reiman/local fastener retailer for the finally confirmed size and finish. | Scheduled only. M6×16 roof candidates require seating/engagement checks. Wolweiss catalogue page 168 specifies M6×14 plus ISO 7089 washers for CBR3030; installed fit remains to confirm. The 16 mm roof length is not valid for every configurable wood thickness. |
| Rubber & Sponge 200-3-6-10-2 | [6×3 mm adhesive EPDM sponge](https://rubberandsponge.co.uk/product/3mm-thick-x-6mm-wide-adhesive-epdm-sponge-strip/), 10 m rolls. Overseas delivery is by quotation. | Nominal compressed rectangular strips. The 2 mm installed thickness, adhesive and butt-corner sealing remain physical-validation items. |

Availability, shipping and final screw choices are not confirmed orders. No
supplier was contacted on the owner's behalf. The manufacturer's minimum
sale unit for the OBO washer is 100; distributor pack sizes may differ.

## Geometry and assembly

Each panel has its own screws into one of the two upward slots on a horizontal
60×30 internal member. Stock washers bear on only that panel. Fixing rows are
staggered along the beam; panel holes are entirely inside rectangular blanks.
The outer perimeter uses its original single-slot rails with one panel per
fixing. No neighboring fastener needs releasing to lift a panel.

Six gasket loops sit inward of the fixing rows. Post-end openings and radiused
beam butt joints remain explicit support/sealing studies. See [roof design,
quantities and removal procedure](SIX_PANEL_ROOF.md).

Wood bearing, gasket pressure, fixing pitch and physical access remain
unvalidated. The Wolweiss catalogue notes that insertable BTN nuts provide less
stability/tightening capability than preassembly nuts. Retrieve/reseat loose
nuts when removing screws. The support-bracket fastener schedule now follows
[Wolweiss catalogue page 168](https://wolweiss.com/wp-content/uploads/2019/03/Catalogo-final-online.pdf#page=168):
M6×14 socket screws with ISO 7089 M6 washers and slot-8 nuts.

## Alternatives reviewed

Reiman FMB mounting blocks and FMS085 strips did not establish a ready-made
shared top clamp for this 6 mm roof. The [MiniTec 20.1018 double-panel profile](https://www.minitecframing.com/Products/Panels_And_Attachment_Hardware/Panels_And_Attachment_Cat/20.1018_Double_Panel_Clamping_Profile.html)
has advertised STEP links, but download was unsuccessful; Wolweiss slot fit
and compression force remain unverified. It is not selected.

## Retained source files

Files are under `v3/backend/enclosure/assets/`; STEP exports distinguish vendor
brackets from dimension-derived washers. The source PDFs, bracket-fastener catalogue excerpt, intact bracket/profile STEP files and this note are
included in the quotation pack.

| File | SHA-256 |
| --- | --- |
| `OBO-3403092.pdf` | `20192cbba477e57e440d8501a5337b4d862965bf61ae96f9092570315d8ecf88` |
| `BTN.pdf` | `1b12fdc9fb86170b6507d23bff116dbfa5d1c64aaf046c70e59a90194b3c59ef` |
| `CBR3030.step` | `42d2a157d72d72eb3d369cf2a11d030ea9c56652630607b14b7046324e7742ae` |
| `AST03006006.step` | `0cfebe620936ed6b492a589f1108833c4ac02ab161661f422fe8fdfe330721c8` |
| `Wolweiss-bracket-fasteners.pdf` | `cf6d0e1adfb2a30e63a3ee8211450fc66237d393af8001408c48f96f62ec1c57` |

# Ready-to-assemble roof hardware

Research updated 2026-09-18. The owner cannot cut or drill metal. The previous
40×20×3 mm custom plate proposal is rejected, as are the custom roof support
straps and angle. The model now uses purchased hardware; only wood reliefs
and soft-gasket cutting remain.

## Selected prototype components

| Component | Supplier evidence | CAD/model status |
| --- | --- | --- |
| OBO 3403092, WS M6 G30 G | [Portuguese manufacturer datasheet](https://www.obo.pt/datasheet/?file=WS_M6_G30_G-3403092-pt_PT.pdf); galvanized steel washer, 30 mm outside, 6.4 mm bore, 1.3 mm thick. [Bürklin retail listing](https://www.buerklin.com/en/p/obo-bettermann/nuts-washers-rings/3403092/46P2285/). | Datasheet retained locally. Annular solid reconstructed from published dimensions; supplier STEP not obtained. Using it as a bridge clamp is our application study, not a manufacturer-rated clamp assembly. |
| Reiman / Wolweiss BTN08M6 | [Product](https://reiman.pt/pt/wlw-btn08m6-btn08m6-m6-slot-8-t-nut/), [BTN drawing](https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/btn.pdf). M6, slot 8, nickel-plated steel; insertable after frame assembly. | Drawing retained locally; CAD link requires login. Nuts are included in the hardware schedule, not represented by invented supplier STEP geometry. Nut rotation, engagement and repeated removal remain to check. |
| Reiman / Wolweiss CBR3030 | [Product](https://reiman.pt/pt/wlw-cbr3030-cbr3030-30x30-bracket/), [series-30 connector guide](https://reiman.pt/en/blog/technical-article/what-connectors-are-compatible-with-the-30-series-aluminium-profiles). Die-cast aluminium bracket for slot-8 profiles. | Existing `CBR3030.step` vendor asset used intact. Six plan-oriented brackets replace the custom support metalwork. CAD establishes nominal contact and absence of penetration; screw/tool access and capacity still need validation. |
| Stock M6 socket screws | Standard full-thread ISO 4762 / DIN 912 family. [Accu M6×16](https://accu-components.com/us/metric-cap-head-screws/386809-SSCF-M6-16-12-9-Z) and [M6×12](https://accu-components.com/us/metric-cap-head-screws/386807-SSCF-M6-12-12-9-Z) examples. Ask Reiman/local fastener retailer for the finally confirmed size and finish. | Scheduled only. M6×16 roof and M6×12 bracket candidates require seating/engagement checks before ordering. The 16 mm roof length is not valid for every configurable wood thickness. |
| Rubber & Sponge 200-3-6-10-2 | [6×3 mm adhesive EPDM sponge](https://rubberandsponge.co.uk/product/3mm-thick-x-6mm-wide-adhesive-epdm-sponge-strip/), 10 m rolls. Overseas delivery is by quotation. | Nominal compressed rectangular strips. The 2 mm installed thickness, adhesive and butt-corner sealing remain physical-validation items. |

Availability, shipping and final screw choices are not confirmed orders. No
supplier was contacted on the owner's behalf. The manufacturer's minimum
sale unit for the OBO washer is 100; distributor pack sizes may differ.

## Geometry and assembly

The washer bridges a 2 mm seam and locally enlarged 7 mm screw passage. It
bears on both wood panels and is pulled down by one slot fixing. Perimeter
washers use ordinary holes through the wood. No metal modification is required.
Six individual gasket loops sit beside the slots, with the screw axes outside
the seals. The four outer post ends and 2 mm radiused beam butt junctions remain explicit
support/sealing studies.
See [roof design, quantities and removal procedure](SIX_PANEL_ROOF.md).

This application is not load-rated. The 1.3 mm washer stiffness, wood bearing,
gasket pressure, maximum clamp pitch, nut stability and hand access require
validation. The Wolweiss catalogue notes that insertable BTN nuts provide less
stability/tightening capability than preassembly nuts. Remove/retrieve the nuts
carefully when releasing the circular washer clamps.

## Alternatives reviewed

Reiman FMB mounting blocks and FMS085 strips did not establish a ready-made
shared top clamp for this 6 mm roof. The [MiniTec 20.1018 double-panel profile](https://www.minitecframing.com/Products/Panels_And_Attachment_Hardware/Panels_And_Attachment_Cat/20.1018_Double_Panel_Clamping_Profile.html)
has advertised STEP links, but download was unsuccessful; Wolweiss slot fit
and compression force remain unverified. It is not selected.

## Retained source files

Files are under `v3/backend/enclosure/assets/`; STEP exports distinguish vendor
brackets from dimension-derived washers. The source PDFs, intact bracket STEP and this note are
included in the quotation pack.

| File | SHA-256 |
| --- | --- |
| `OBO-3403092.pdf` | `20192cbba477e57e440d8501a5337b4d862965bf61ae96f9092570315d8ecf88` |
| `BTN.pdf` | `1b12fdc9fb86170b6507d23bff116dbfa5d1c64aaf046c70e59a90194b3c59ef` |
| `CBR3030.step` | `42d2a157d72d72eb3d369cf2a11d030ea9c56652630607b14b7046324e7742ae` |

# Shared roof clamp sourcing

Research date: 2026-09-17. This is the supplier-research stage of the requested
roof-clamp integration. No clamp geometry or panel fixing cuts are released yet.

## Supplier evidence

| Candidate | Evidence and CAD status | Assessment |
| --- | --- | --- |
| Reiman / Wolweiss BTN08M6 | [Product](https://reiman.pt/pt/wlw-btn08m6-btn08m6-m6-slot-8-t-nut/), [dimensioned BTN drawing](https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/btn.pdf). M6, slot 8, nickel-plated steel; insertable after frame assembly. Drawing downloaded and inspected; CAD link requires account login, so no supplier STEP obtained. | Candidate anchor for a fabricated bridge plate. Verify against the actual extrusion section and check that nuts remain manageable during repeated removal. |
| Wolweiss FMB panel mounting block | [Manufacturer catalogue](https://wolweiss.com/wp-content/uploads/2019/03/Catalogo-final-online.pdf), printed page 125. | A panel mounting block, not evidence of a shared top clamp for our two adjacent roof panels. Not selected. |
| Reiman / Wolweiss FMS mounting strip | [Product](https://reiman.pt/en/wlw-fms-fms-panel-mounting-strip/). FMS085 is a slot-8 strip for 5 mm panels. | Different mounting arrangement and panel thickness from our 6 mm roof. Not selected. |
| MiniTec 20.1018 double panel clamping profile | [Manufacturer product and CAD links](https://www.minitecframing.com/Products/Panels_And_Attachment_Hardware/Panels_And_Attachment_Cat/20.1018_Double_Panel_Clamping_Profile.html). For 1–10 mm panels; anodized aluminium, M5×12 set screws, nominal 6 m stock. STEP link advertised, but download unsuccessful in this research. | Retains adjacent panels, but manufacturer notes limited gripping force. Wolweiss slot compatibility and gasket compression are unverified; not selected as a drop-in replacement. |

No suitable ready-made shared top bridge clamp was established in the Reiman
products reviewed. This is a search result, not a claim that none exists.
The Wolweiss catalogue notes reduced stability/tightening capability for
insertable BTN nuts compared with preassembly nuts; ease of insertion alone
does not establish suitability for repeated panel removal.

## Recommended design direction

Use a fabricated metal plate spanning the seam, with one central M6 fastener
into a Reiman slot-8 nut. A **40×20×3 mm plate with a 6.5 mm central bore** is
an initial design study, not a supplier product or validated specification.
Orient the 40 mm dimension across the seam to bear on both panels. Define
material, edge radii, bearing pads and fabrication drawing during integration.
Any STEP generated for this plate will be project-generated custom-part CAD.

Keep the six-panel layout and existing frame. Integration must resolve:

- Local clearance at the existing 2 mm seams: an M6 screw cannot pass through
  them. Paired edge reliefs are preferable to widening every seam, subject to
  machining and removal checks.
- A sealed screw passage. The current gasket occupies the same centreline;
  piercing it changes the sealing design and invalidates any assumption of
  uninterrupted gasket coverage at that station.
- Perimeter retention. Shared seam clamps alone are not a complete fastening
  arrangement for the outer panel edges.
- Clamp stations, nut access, bolt length, thread engagement and clearance
  from crossbar joints. Do not select a bolt length solely from panel thickness.
- Left-first removal with only 20–30 cm access at the right wall. Releasing a
  shared clamp also releases the neighboring panel edge; the removal sequence
  must account for this rather than claiming independent retention.
- Gasket compression, panel bending and bearing pressure. Clamp pitch remains
  a design variable until these are assessed.

The current roof model and quotation cuts still omit these fasteners and
reliefs. Existing roof coverage checks describe the unpierced gasket study;
they do not verify the proposed clamp/sealed-fastener arrangement.

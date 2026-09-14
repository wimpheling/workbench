# Bifold completion — digital design, not fabrication release

Work continues in `feat/printed-bifold-assembly`; v3 is the active application.
The user confirmed that GHD9008B and GBL3030.KIT STEP downloads are unavailable.
Do not replace genuine hinge/roller/bush CAD with approximations.

## Implemented mechanical details

Each 3030 leaf has four inward-face 65 × 65 × 4 mm stainless L plates,
30 mm legs and three Ø6.5 holes. Two fixings connect the stile and one the
rail; sixteen named stile/rail mating interfaces reference their plates.
These keep the inward-facing glazing slots clear. Plate strength, slot-nut
capacity and leaf racking remain unapproved. They are supplier-prepared
custom components, not bought parts with vendor STEP.

The roller carrier is a one-piece 6061-T6 metal design represented by an
upright and shelf sharing one procurement quantity. Internal root radii and
capacity need approval. Do not manufacture two separate pieces and bond them.
The axle and two M6 mounting datums are unchanged.

Each closing tab now has two vertically separated fixing holes, 30 mm pitch.
Two fixed parked-stop brackets per opening contact the primary stile at 88°
through replaceable 2 mm pads. These are operating stops, distinct from the
rail end bars that block roller overtravel. Impact capacity is unverified.
Bottom rigid brush backing ends at Z=2 mm, below the leaf bottom at Z=3 mm,
so the moving lower gusset does not clip it; bristle deflection remains unknown.

Guide-body sleeve holes now have deliberate 6.4 mm wide recesses into the
running channel instead of fragile 0.4 mm PETG webs. Connectivity and geometric
clearance can be checked digitally; roller bridging, dust wear and clamp creep
still require the excluded coupon/physical work.

## Bought handle and catch candidates

The meeting seal is now a 40 × 3 mm one-sided EPDM wipe-lip study, not a
membrane stretched between leaves. Three 20 × 2 mm clamp-bar segments attach
its root to each primary leaf. Segments avoid the two handle feet, which sit
over the 3 mm lip root; the primary handles move outward accordingly. The lip
contacts the secondary stile at closure and disengages when folded. Nominal
contact, clamp/handle clearance and full-open separation are tested. Lip
compound, preload, screw engagement, clamping flatness and wear remain pending.

[Wolweiss catalogue](https://reiman.pt/pub/media/catalogue_pdfs/Wolweiss/Wolweiss.pdf),
pages 130 and 147, is the dimensional source; no STEP was available to the user.

Four GHD9008B handles are drawing-based U-shaped solids: 90 mm fixing pitch,
18 mm foot diameter, 36 mm projection, Ø6.5 bores. The grip contour and recessed
screw seating are not dimensioned sufficiently and remain assumed. The model
must not be used to manufacture a copy or select final screw lengths.

Six GBL3030.KIT catches remain explicit procurement/installation requirements:
two closed catches and one parked catch per opening. The drawing establishes
the body envelope (17 × 18.5 × 60 mm), Ø4.5 holes and 48 mm pitch, but does not
prove adapter/strike placement on this folded assembly. They are intentionally
not inserted as falsely fitted boxes in the physical BOM. The UI lists them;
the quotation pack includes `bifold-completion.json` with quantities and gaps.
This is unfinished installation work, not a validated latch solution.

## Fasteners, spacers and load screening

The evaluated fixing schedule includes rail mounts, corner plates, handles,
carriers and operating stops. M6 × 12 through 4 mm plates and M6 × 16 through
8 mm carriers are candidates, not approved lengths: nut setback, usable thread
depth, head seating, washers and locking must be accounted for before release.
Hinge screws and the M4 axle/nut still require exact catalogue selection.

Keep the 23 mm rail compression sleeves and bridge washers metal: they bypass
PETG in the bolt preload path. The roller's clamped axial spacer/ring also
remains metal pending a justified alternative. Printed alignment keys and
non-clamped locating shims are acceptable design candidates; do not substitute
printed sleeves merely because they fit geometrically.

The UI reports a **partial** dead-load calculation from actual supplier
extrusion section area, panel volume, net plate volume, gross carrier envelopes
and catalogue handle mass. Assumed densities: aluminium 2700, polycarbonate
1200, stainless 8000 kg/m³. Gravity 9.81 m/s². Closed moments are the cantilever
bending component `mass × gravity × horizontal in-plane lever arm` at the
frame/interleaf hinge lines, not torque around their vertical opening axes.
Off-plane eccentricity is not included. Hinges, fasteners, catches,
seals, impact and guide reactions are excluded; this is neither total door
weight nor an upper bound for hinge selection.

## Retailer questions — collect now, do not send

- Confirm actual solid Lexan grade and compatible slot-8 gasket compound.
  FSP08 is PVC, not approved; nominal 3 mm engagement falls to about 1.12 mm
  in the current worst-case allowance. Supply minimum retention engagement,
  corner sealing and expansion/sliding requirements before cutting panels.
- Supply GHD9008B screw-seat dimensions and included fixing contents; supply
  GBL3030.KIT adapter/strike drawings, operating clearance and pull force.
- Confirm CFG.30/30 combined loading, permitted mounting arrangement, M6 slot
  nuts, screw grade/length, thread engagement, locking and tightening torque.
- Review carrier root radii/alloy, gusset rigidity, header connections, guide
  reactions, keeper welds, sleeves and bridge-washer bending/preload.
- Confirm the angled brush/root profile, bonded holder and corner returns;
  approve the one-sided meeting lip, clamping and free-edge preload. Rigid
  animation is not deformation evidence.

## Exterior head hood and angled brush study

Moving the former inner cover 6 mm farther inward was rejected because it
intersects roof beams/brackets. The replacement is an 82 mm high, 2 mm thick
hood directly on the exterior vertical face of the 3060 header. Its lower edge
is 3 mm above the leaf top. It needs no beam reliefs; its three M6 fixing holes
remain at header mid-height, above the protected head gap.

A nominal 3 × 14 mm holder is bonded to the hood's inward face, also above the
leaf. The **unselected angled-brush study** projects inward 20 mm and downward
12 mm, with a 12 mm root band. The modeled sloped bristle envelope connects the
holder to the closed leaf tops. It is not a solid rubber filler, vendor STEP,
or proof that a matching brush is sold. Its intersections with the carrier
remain unresolved flexible interactions; do not call these collision-free.

The non-planar head barrier has two measured sections: the exterior hood and
the inward wipe. Both retain overlap/cutting allowances; explicit contact-chain
checks connect hood, holder, brush and both leaves. Removing or raising the
brush, or disconnecting the holder, fails the corresponding tests. Passing
these nominal checks does not establish bristle density, actual attachment,
corner returns, wear or dust performance. The supplier must approve the
profile/adhesive or the study must be revised.

Fabrication, coupon printing, assembly measurements, cycling, dust testing and
commissioning are excluded from this software pass, not completed by it.

## Digital evidence at revision 12ad55cb055b475f

The live evaluation contains 450 parts: 1,577 passing checks, zero failures,
125 unknowns; status **incomplete**, not released for manufacture. The old
head-coverage failures are resolved as nominal geometry, not physical sealing.
Full motion still has unresolved interval intersections and flexible contacts;
the sampled rigid-clearance checks are not a blanket collision certificate.

Using `verification.swept_box` on all opening-prefixed parts over 128 angular
subintervals gives conservative nominal outward bounds of 407.34 mm left and
370.11 mm rear, from the agreed opening-face datums. Available spaces are
800 and 450 mm, leaving approximately 392.66 and 79.89 mm. These bounds include
the modeled handles, lip and clamp geometry but not unavailable catch geometry,
physical play, sag or unmodeled brush deflection. Retain those exclusions when
reviewing the eventual catch installation.

Browser acceptance passes against port 8000, including hardware inventories,
visible warnings, revised cuts and animation without per-frame CAD requests.
The exported quotation ZIP preserves six pending catches and 48 fixing rows.
Its assembly STEP re-imports as a valid shape with 446 solids. This validates
the digital export, not the physical suitability of the proposed components.

Final regression: `make -C v3 check` passes with 127 backend tests, 44 frontend
tests, lint/format, TypeScript and build. All 11 standalone engineering tests
also pass. Browser acceptance passes in 4.7 minutes. Changes remain in the
existing bifold worktree; supplier/fabrication approval is deliberately open.

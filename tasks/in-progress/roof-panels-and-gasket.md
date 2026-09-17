# Finalize roof panel divisions and gasket references

## Description

Implement the accepted lightweight roof as six separate panels in a 2×3 grid
for easier transport and handling. Finalize the roof gasket using a real product
reference and specify the vacuum-hose opening and its interface.

## Discussion

The owner chose six panels after comparing a 2×2 arrangement with the existing
roof structure. Keep both full-width crossbars and add three short front-to-back
30×30 members at the centreline. No extrusions cross at the same height.
Default panel cuts: four 866×578.667×6 and two 866×547.667×6 mm, with 2 mm seams.
The middle-left panel carries the offset hose opening; actual hose dimensions
and full-travel routing remain unconfirmed. The old 100 mm hose parameter is
explicitly a placeholder, not a Nilfisk specification.

New supports use underside steel joint straps and a front angle connecting
upper side slots above the front-door backing. These nominal connections still need fixing and
load approval. The current wood thickness remains a study. EMKA 1016-16
15×3 mm EPDM sponge is the proposed gasket; 2 mm installed height and a proposed
removable clamp arrangement are not physically validated.
See [roof design](../../v3/docs/SIX_PANEL_ROOF.md). Detailed product/physical
validation remains separate from the accepted layout, per the owner's two-axis
workflow. Do not equate an approved layout with released fabrication.

Implementation: [PR #21](https://github.com/wimpheling/workbench/pull/21).
Initial 740 mm validation: 208 backend tests passed; 45 frontend tests, TypeScript check and
production build passed; the six-panel browser test passed. Initial default
revision `53126a0f69ef8357` reports 1828 pass / 0 fail / 122 unknown. The quotation
ZIP was checked for six roof cuts and matching layout metadata. The front
connection clears the door backing and all tested door poses; all new roof
connectors clear rigid parts in the closed assembly. Physical performance
and the outstanding detailed design decisions below remain unresolved.

The owner subsequently selected 900 mm as the next frame-height candidate
(previously 740 mm) for a Makita router, standard Sweepy V2 and Nilfisk AERO
21-21 PC. Additional height is a design allowance, not verified hose clearance.
The proposed supported loop/router guide still needs detailed design and
travel testing; the final hose passage depends on actual outside/fitting sizes.

900 mm validation: the full backend run completed with 207 passes and two
stale test failures (former wall/roof dimensions and an artificial seal notch
at the previous roof height). After correcting these tests, `uv run pytest
--lf -q` passed both; the broader affected-test rerun passed 28 tests. All 209
backend cases are covered across those runs. Frontend: 45 tests, type check
and production build pass; two browser tests pass. Model `f5b091170e013fbc`
reports 1828 pass / 0 fail / 122 unknown, and its supplier ZIP was checked.
Taller polycarbonate cuts are 779.8 mm high with a 0.8024 mm conservative
minimum-engagement bound under the existing thermal assumptions. This is a
reduced margin, not approved retention; no production verifier threshold was
relaxed. Preview at `http://127.0.0.1:8019` now defaults to 900 mm.

## Implementation plan

- [ ] Integrate shared bridge clamps into the roof
  - [x] Research Reiman hardware, alternative panel retainers and drawing/STEP availability; record [supplier findings](../../v3/docs/ROOF_CLAMP_SOURCING.md)
  - [ ] Detail the proposed fabricated bridge plate, sourced slot nuts and fasteners
  - [ ] Model clamp stations, panel reliefs, sealed screw passages and perimeter retention
  - [ ] Verify removal access, geometry and updated sealing assumptions; update drawings and supplier pack

- [x] Agree on the roof layout and handling concept
  - [x] Select six compact panels while retaining both existing crossbars
  - [x] Define supported seams, three centre members and nominal joint connections
  - [x] Document left-first panel removal and the hose-panel disconnection requirement; actual reach remains to be checked
  - [x] Locate the provisional hose opening clear of supports and panel joints
- [x] Specify the nominal roof seal arrangement
  - [x] Identify EMKA 1016-16 as a real candidate; retain compression and compatibility as unvalidated
  - [x] Model perimeter strips, panel-seam strips and non-stacked butt junctions
  - [x] Update the offset hose collar, gasket and explicit panel/bore verification
- [x] Implement and verify the agreed roof in v3
  - [x] Update the parametric layout, support geometry, gasket checks and provisional hose clearance checks
  - [x] Update panel cuts, support machining, gasket lengths, candidate reference and assembly instructions
  - [x] Run relevant tests, checks and builds and record the results

- [x] Raise the default enclosure to the accepted 900 mm candidate
  - [x] Propagate taller frame, doors and panel cuts; update current dimension references
  - [x] Verify the taller assembly and update the local preview and PR

## Open questions / blockers

- [x] Which panel layout is preferred? Six panels in a 2×3 grid; compact pieces replace the rejected long/four-panel alternatives.
- [x] What are the initial material and support choices? Retain the current 6 mm wood study, both crossbars and three additional 30×30 members.
- [x] Where is the provisional hose opening? Middle-left panel, clear of the frame and seams.
- [ ] Select actual panel clamps, their positions and any edge relief; verify independent release and physical access from the front/left
- [ ] Confirm wood grade/thickness, panel and beam stiffness, strap/angle details, fasteners and joint capacity
- [ ] Confirm gasket compression, adhesive, clamp pitch, butt-junction preparation and physical sealing
- [ ] Measure actual hose/connector dimensions, independent support, bend radius, slack and full machine travel before releasing its cut; confirm the 900 mm height with supported-loop routing and reassess taller-door loads

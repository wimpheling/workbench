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

The owner requires metal parts to arrive ready to assemble: no metal cutting or
drilling. Six intact Reiman CBR3030 brackets now replace the earlier custom
straps/front angle. OBO 3403092 stock washers form the shared/perimeter clamps,
with Reiman BTN08M6 nuts and standard M6 screw candidates. Default layout is
25 shared and 34 perimeter clamps; 71 nuts/screws include the support brackets.
The 7 mm wood holes/edge reliefs are modeled. Fasteners are scheduled but their
solids, final lengths and installed engagement remain unvalidated.

The seal changed from a central 15×3 mm strip to six individual loops of
6×3 mm adhesive EPDM sponge (Rubber & Sponge 200-3-6-10-2), nominally compressed
to 2 mm. Screw axes stay outside the loops. Straight runs bear on the supplier
extrusion's flat lands; open corner-post ends and 2 mm radiused beam butt joints
remain explicit gasket-bridging studies. Clamp force, washer bending, wood
bearing, compression and physical reach remain unvalidated. Removal uses a
tool and releases neighboring edges at shared stations; this is not independent
quick-release retention. No custom metalwork is required for the roof hardware.
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

2026-09-18 stock-hardware validation: full `uv run pytest` completed with
208 passes and two failures in tests corrected during that run (the former
single-hole volume assertion and an empty-result CAD subtraction in the new
bearing test). Final roof/core/export rerun: **44 passed**, including a new
screw-bottoming regression. All 211 current backend cases are covered across
these runs. Frontend: 45 tests, TypeScript check and production build passed;
the updated roof browser test passed. Ruff and diff checks pass.

Default model `55fe8c8bf8e6036c`: 2068 pass / 0 fail / 122 unknown. The quotation
pack was regenerated and checked for hardware quantities, wood reliefs, source
PDFs and the intact bracket STEP. Nominal shank probes reject M6×20 roof screws
for hitting the slot floor; M6×16 roof and M6×12 bracket candidates clear it.
Actual nut engagement, head seating and tolerance stacks still need approval.
Local preview refreshed at `http://127.0.0.1:8019`.

## Implementation plan

- [ ] Integrate shared bridge clamps into the roof
  - [x] Research Reiman hardware, alternative panel retainers and drawing/STEP availability; record [supplier findings](../../v3/docs/ROOF_CLAMP_SOURCING.md)
  - [x] Replace the rejected custom plate with stock OBO washers, Reiman nuts and standard screw candidates; retain source drawings and CAD provenance
  - [x] Model shared/perimeter clamp stations and wood reliefs; route closed gasket loops beside the screw passages
  - [x] Replace custom roof support metalwork with six intact vendor-STEP CBR3030 brackets
  - [x] Verify geometry and updated sealing assumptions; update drawings, supplier pack and browser preview
  - [ ] Validate physical reach, removal sequence and installed screw/nut seating

- [x] Agree on the roof layout and handling concept
  - [x] Select six compact panels while retaining both existing crossbars
  - [x] Define supported seams, three centre members and nominal joint connections
  - [x] Document left-first panel removal and the hose-panel disconnection requirement; actual reach remains to be checked
  - [x] Locate the provisional hose opening clear of supports and panel joints
- [x] Specify the nominal roof seal arrangement
  - [x] Source 6×3 mm EPDM sponge for the offset loops; supersedes the earlier EMKA 1016-16 central-strip candidate
  - [x] Model six individual gasket loops and non-stacked butt junctions
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
- [x] Select stock clamp candidates, nominal stations and wood reliefs; shared washers release both adjacent edges
- [ ] Verify physical access from the front/left, neighboring-panel support and repeated nut handling
- [ ] Confirm wood grade/thickness, panel and beam stiffness, purchased bracket capacity, fasteners and joint capacity
- [ ] Confirm gasket compression, adhesive, clamp pitch, butt-junction preparation, bridging over post ends/radiused beam joints and physical sealing
- [ ] Measure actual hose/connector dimensions, independent support, bend radius, slack and full machine travel before releasing its cut; confirm the 900 mm height with supported-loop routing and reassess taller-door loads

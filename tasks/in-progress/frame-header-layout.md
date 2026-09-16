# Frame header layout

## Description

Use 30×30 left and rear top rails with square frame corners, adapt the bifold
guides to their single underside slots, and assess an upright 30×60 front beam
with its top flush with the roof frame.

## Discussion

Owner authorized this work after PR #18 was merged. The previous wide, flat
left/rear headers existed for guide bolt rows and required a corner notch.
The front has no middle post. Profile geometry must retain actual supplier
sections; beam screening cannot establish connection capacity or real loads.

Implemented an upright 3060 front member with its top flush at H+30; front
opening is H−30. Doors and front seals follow that opening. Square 3030
left/rear headers remove the corner notch. Roof crossbars meet their narrower
rails and fixed panels now lap the full top border.

Each guide module uses a 46×8 steel adapter: two central countersunk M5 slot
fixings, six M4 tapped outer holes. Guide/carrier and leaf tops drop 8 mm;
90 mm exterior hoods use 15 mm metal spacers. Nominal threads are represented
by major-diameter envelopes; manufacturing notes specify 3.3 mm tap drills.

The sourced conditional beam screen gives 0.712 mm versus 4.884 mm deflection
for upright 3060 versus 3030 at the front under an illustrative 100 N centre
load. Bare 3030 guide spans give 0.616 mm left / 0.466 mm rear: the previous
0.5 mm total-movement target is not demonstrated. Actual loads, connections,
adapter stiffness, anti-rotation and fasteners require physical validation.
See [frame header study](../../v3/docs/FRAME_HEADERS.md).

Validation: full `uv run pytest` completed with 198 passes and four stale
assertions (wipe height, two glazing cut checks, washer-to-header contact).
The corrected assertions pass targeted reruns; all 202 cases have passing
results against final assertions, rather than one repeated all-green full run.
Seven new header tests pass; frontend 45 tests, type checks, build and live
header browser test pass. Final default revision `4d6a6912ecdecfe9` reports
1,757 pass / 0 fail / 122 unknown. Quotation ZIP integrity and revision-linked
header assessment checked; Ruff and whitespace checks pass.

## Implementation plan

- [x] Replace left/rear headers and remove obsolete corner treatments
- [x] Adapt guide mounting and check motion and load-path geometry
- [x] Assess and model the upright front beam and affected door/seal clearances
- [x] Update supplier output, documentation, tests and preview
- [x] Run required checks and submit [PR #19](https://github.com/wimpheling/workbench/pull/19)

## Open questions / blockers

- [ ] Validate actual loads, connections, adapter fixings and stiffness before manufacture

# Hose routing and roof connection

## Description

Design the Nilfisk AERO 21-21 PC connection and a supported hose route for the
original Shapeoko 5 Pro 4×4, Makita router and standard Sweepy V2. Size the roof
opening from the selected interface and establish confidence against catching,
kinking and pulling throughout machine travel.

## Discussion

The owner requested this work in a separate branch/PR after merging roof PR #21.
Continue follow-up work in this PR until it closes. The roof layout is six
independently removable panels on a 900 mm candidate frame. The current
100 mm hose parameter and 110 mm cutout are placeholders; neither is a measured
Nilfisk dimension. The machine-height envelope is also provisional.

The owner operates from the left. The right side faces a wall with roughly
200–300 mm clearance. Purchased metal components and supplier-cut extrusions
are acceptable; owner-cut or owner-drilled metal is not. Printed adapters,
wood boring and soft-gasket cutting are feasible.

Research carried over from the discussion:

- Nilfisk lists a nominal D32 × 2500 mm hose, reference 107405599, for the
  AERO 21-21 PC in its [catalogue](https://www.qa-site.nilfisk.com/media/ajeeekz2/2024_nilfisk_katalog_anglictina.pdf?page=1%3Fpage%3D1).
  Nominal size does not establish rib outside diameter, cuff size or bend radius.
- [Sweepy V2](https://shop.carbide3d.com/products/sweepy-2-0-dust-boot)
  accepts a 2.5-inch hose and lists 2.25-inch and 36 mm Festool adapters.
  Nilfisk cuff compatibility remains unmeasured.
- [Carbide's Sweepy Pro instructions](https://carbide3d.com/hub/docs/sweepy-pro-s5-pro/)
  show an X-carriage support and a short flexible section. This is a routing
  precedent, not confirmation that its hardware fits the existing Sweepy V2.
- [igus bend-radius guidance](https://www.igus.com/company/energy-chains-select-bend-radius-cable-carrier-ca)
  emphasizes the hose manufacturer's minimum bend radius and avoiding strain
  at connections. Do not substitute a generic cable rule for a hose specification.

The proposed concept remains under discussion: an independently supported,
detachable roof fitting; a guided overhead loop to the moving carriage; and a
short flexible section accommodating Z movement. Compare a pivoting support
with a sliding hanger before selecting hardware. The removable wood panel
should not carry the external hose's pull. Check that added couplings and hose
length do not compromise extraction.

Confidence should distinguish rigid-support clearance, a specified hose movement
envelope, physical constraints that keep the hose inside that envelope, and
physical endurance/operation evidence. A static hose drawing or sampled animation
does not prove snag-free motion. Do not invent a numerical reliability percentage.

Proposed physical checks cover corners, diagonals, reversals, homing, tool changes
and full Z travel, first slowly and then at intended speeds with extraction
running. Observe sag, twist, kink, connector slip and carriage load; measure
clearance margins. Repeat with different starting hose shapes and inspect wear.
Define test counts and acceptance criteria before claiming validated performance.

## Implementation plan

- [x] Carry over the setup, sources, proposed concept and verification limits
- [ ] Confirm hose/cuff dimensions, usable length, bend radius and Sweepy interface
- [ ] Compare support arrangements within the actual machine/roof clearance
- [ ] Select retail support hardware and source drawings/STEP files
- [ ] Agree on support placement, mounting and roof connection
- [ ] Separate nominal hose bore, outside diameter and roof cutout in the model
- [ ] Implement the selected design, supplier schedule and assembly instructions
- [ ] Verify full-travel envelopes with explicit margins and unresolved assumptions
- [ ] Complete physical fit, motion and extraction checks before fabrication release

## Open questions / blockers

- [ ] What are the measured hose rib diameter, cuff geometry and minimum bend radius?
- [ ] Does the supplied Sweepy adapter fit the Nilfisk cuff, or is an adapter needed?
- [ ] Is the stock hose long and flexible enough for the selected route?
- [ ] Which support constrains motion without excessive carriage load or roof interference?
- [ ] Does 900 mm provide sufficient clearance at every machine position?
- [ ] What roof fitting and cutout size follow from the selected arrangement?
- [ ] What measurable acceptance criteria establish adequate practical confidence?

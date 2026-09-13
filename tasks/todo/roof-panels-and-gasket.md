# Finalize roof panel divisions and gasket references

## Description

Evaluate dividing the lightweight roof into four separate panels for easier
transport and handling. Finalize the roof gasket using a real product
reference and specify the vacuum-hose opening and its interface.

## Discussion

Four roof panels are a proposal, not a finalized layout. Panel divisions
must account for support, seams, removal, and the hose that follows the CNC
head. Keep the enclosure parametric and specify supplier-prepared parts
that the user can assemble.

## Implementation plan

- [ ] Agree on roof layout and handling requirements
  - [ ] Compare the existing layout with four panels, including transport dimensions and handling weight
  - [ ] Define seam locations, support members, fasteners, and panel removal order
  - [ ] Locate the hose opening and check hose travel against roof supports and panel joints
- [ ] Specify roof seals and preparation
  - [ ] Select a real gasket reference compatible with the frame, panels, and required compression
  - [ ] Detail perimeter seals, panel-to-panel seams, corners, and the hose penetration
- [ ] Implement and verify the agreed roof in v3
  - [ ] Update the parametric layout, support geometry, gasket checks, and hose clearance checks
  - [ ] Update panel cuts, machining, gasket lengths, supplier references, and assembly instructions
  - [ ] Run relevant tests, checks, and builds and record the results

## Open questions / blockers

- [ ] Are four panels the preferred arrangement, and what transport size limits should they meet?
- [ ] Which panels must be independently removable?
- [ ] What panel material, thickness, and intermediate supports are needed?
- [ ] Which exact gasket reference and joint details should be used?
- [ ] Where should the hose pass through, and how should its movement and penetration be accommodated?

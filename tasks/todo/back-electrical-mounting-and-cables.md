# Support the electrical block and STOP button and route cables

## Description

Design the back of the enclosure to support the electrical block and STOP
button, with a defined cable route and appropriate mounting and access.

## Discussion

The mounting arrangement must coexist with the rear right bifold door and
its folded position. Component dimensions, mass, connectors, and cable
requirements are not yet specified. Confirm where the STOP control can be
reached from the user's operating position before fixing its location.
This task covers mounting and routing; changes to electrical wiring or the
machine's stop system require an explicitly defined scope.

Coordinate with [the bifold task](../in-progress/bifold-door-mechanism.md) and
[the airflow task](right-side-airflow-and-filtration.md).

## Implementation plan

- [ ] Establish component and access requirements
  - [ ] Identify the exact electrical block and STOP control, dimensions, mass, mounting points, and manufacturer requirements
  - [ ] Agree on locations with operating access, service access, and door movement accounted for
- [ ] Design mounting and cable routing
  - [ ] Specify brackets or backing panels and their load path to the structural frame
  - [ ] Define cable entry and exit points, connectors, bends, slack, and separation from moving parts
  - [ ] Specify cable supports, protected penetrations, strain relief, and dust-sealing components
- [ ] Implement and verify the arrangement in v3
  - [ ] Add component envelopes, mounting preparation, routes, and access clearances
  - [ ] Check door motion, cable interference, mounting support, and reachability
  - [ ] Update supplier specifications and installation instructions
  - [ ] Run relevant tests, checks, and builds and record the results

## Open questions / blockers

- [ ] Which electrical block and STOP button will be used, and what are their mounting requirements?
- [ ] Can the proposed STOP location be readily reached from the operating position?
- [ ] Which cables, connectors, lengths, and entry/exit destinations must be accommodated?
- [ ] Which equipment should be inside versus outside the enclosure?
- [ ] Does the agreed installation require electrical changes beyond mounting and routing?

# EnclosureV2 door-clearance checklist

## Purpose and scope

Define door clearances from the selected hardware, assembly method, and actual
observations rather than treating a uniform gap as a design default.

This is a hobby enclosure. The practical containment goal is to keep ordinary
visible chips and dust inside during use and door operation. It does **not**
claim an airtight enclosure, a quantified particle-leakage rate, or industrial
safety certification.

Vendor cutting outsources the cut; it does not make the delivered length or end
squareness tolerance-free. Saw kerf is not itself a door-clearance term once
the vendor supplies finished lengths. Frame squareness, connectors, hinges,
and the door itself still introduce variation.

## Current baseline

- [x] All dimensions use millimetres internally.
- [x] Inner width, height, and depth are stakeholder variables.
- [x] Door side, top, bottom, and centre gaps are stakeholder variables.
- [x] Current provisional values are 3 mm at each outer edge, 3 mm top and
      bottom, and a 3 mm centre seam.
- [x] Closed centre seam requires at least 1 mm under the current fit policy.
- [x] The sampled door-motion solid check requires 2 mm minimum clearance.
- [ ] The 3 mm defaults are supported by selected hinge, seal, or assembly
      evidence. They must not be treated as final values.
- [ ] Label the four gap values as provisional overrides until selected hardware
      and measured/specified assembly evidence can calculate and lock them.

## Functional requirements to agree

- [ ] Doors open and close without rubbing in normal use.
- [ ] Doors still operate after normal frame/hinge adjustment and minor
      misalignment.
- [ ] Closed doors do not leave a direct, unnecessarily large route for chips
      to escape.
- [ ] Doors can be removed, adjusted, and cleaned with ordinary hobby tools.
- [ ] Decide whether a simple gasket, brush seal, or overlapping/labyrinth edge
      is wanted. A small free gap alone is not a containment feature.
- [ ] Record the intended door style: inset, overlay, or partially overlapping.
- [ ] Record door-edge construction, material, thickness, and flatness.
- [ ] Decide the meeting-stile treatment: plain seam or overlapping astragal.
- [ ] Select the seal type and location, if any.
- [ ] Define hard closed stops and the latch, catch, or magnet that holds each
      door against them. The closed geometry must not be defined by hinge
      position alone.

## Hardware and construction evidence

- [ ] Select the actual hinge product.
- [ ] Record hinge pivot axis, mounting offsets, adjustment range, stated
      clearance requirements, and opening range.
- [ ] Record hinge count, fastener method, and any slotted-hole or shim
      adjustment range.
- [ ] Model the hinge body and mounting hardware as a keep-out volume.
- [ ] Record the vendor's stated finished cut-length and end-squareness
      tolerances, plus any relevant extrusion straightness specification.
- [ ] Record connector/joint type and its expected positional play.
- [ ] Choose the door-frame construction and verify its squareness after
      assembly.
- [ ] Record door mass and hinge spacing; measure free-corner drop under the
      actual door weight rather than only inspecting for visible sag.
- [ ] Retest the assembled frame and door alignment after connector tightening,
      moving, and levelling the enclosure.

## Clearance model to implement

- [ ] Replace the single provisional edge-gap assumption with a per-interface
      calculation: each leaf's outer hinge edge, top, bottom, meeting stile,
      and swept hardware/handle keep-outs. Do not duplicate the meeting stile
      as both a latch-side gap and centre seam.
- [ ] For each interface, record hard-part residual clearance, intentional seal
      contact/compression, and overlap or line-of-sight coverage separately.
- [ ] Define allowed hard-stop, hinge, gasket, and brush contacts explicitly;
      collision validation must not reject intentional soft contact.
- [ ] Calculate nominal hard gap from the required worst-case residual operating
      clearance + gap-closing tolerance/deflection budget + documented residual
      safety allowance. Treat hinge sweep as geometric validation, not always
      an additive scalar.
- [ ] Record safety allowance per interface, or document why one shared margin
      is valid. Avoid double-counting assembly variation.
- [ ] Keep seal engagement/overlap separate from free gap. A seal can bridge a
      gap; it must not be represented as zero clearance.
- [ ] Make the evaluated model report the source terms and resulting nominal gap
      for every door interface.

## Validation and physical try-out

- [ ] Validate the closed state against every frame/door interface, not only the
      centre seam.
- [ ] Check the full opening range against frame, opposite door, hinge hardware,
      and any latch/handle.
- [ ] Validate hard-part clearance separately from allowed gasket/brush and
      hard-stop contact.
- [ ] Build or mock up one representative hinge-and-frame corner before fixing
      the final values.
- [ ] Measure actual gaps at hinge, latch, top, bottom, and centre seam.
- [ ] Test opening/closing after repeated cycles and after tightening the frame
      connectors.
- [ ] Run a practical chip test with the intended extraction arrangement; note
      obvious escape paths rather than trying to certify leakage.
- [ ] Adjust the model from measurements, then regenerate the doors and
      validation report.

## Decision record

- [ ] Hinge selected:
- [ ] Door style selected:
- [ ] Seal/overlap approach selected:
- [ ] Closed stop and latch/catch selected:
- [ ] Vendor cut tolerance recorded:
- [ ] Assembly variation allowance:
- [ ] Hinge-side hard gap / safety rationale / evidence-date:
- [ ] Top hard gap / seal compression / evidence-date:
- [ ] Bottom hard gap / seal compression / evidence-date:
- [ ] Meeting-stile hard gap / overlap or seal / evidence-date:
- [ ] Hardware keep-out clearance / evidence-date:

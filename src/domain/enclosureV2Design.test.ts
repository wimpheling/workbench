import { describe, expect, it } from "vitest";
import {
  allEnclosureV2DesignSpecs,
  defaultEnclosureV2DesignInput,
  designInputFromExistingEnclosureDimensions,
  enclosureV2DesignSpecs,
  enclosureV2DoorFrameProfile,
  enclosureV2StartingStructuralProfileAssignments,
  evaluateMainStructuralEnvelopeMm,
  evaluatePracticalFrontAccessEnvelopeMm,
  evaluateSymmetricInsetDoorDimensionsMm,
  validateEnclosureV2DesignInput,
} from "./enclosureV2Design";

const design = defaultEnclosureV2DesignInput({
  innerClearWidthMm: 1200,
  innerClearHeightMm: 800,
  innerClearDepthMm: 600,
});

describe("EnclosureV2 design contract", () => {
  it("uses explicit millimetre clear-space names and derives symmetric inset leaves", () => {
    expect(evaluateSymmetricInsetDoorDimensionsMm(design)).toEqual({
      frontOpeningClearWidthMm: 1140,
      frontOpeningClearHeightMm: 770,
      leafWidthMm: 565.5,
      leafHeightMm: 764,
    });
  });

  it("rejects invalid requirements and impossible derived door leaves", () => {
    expect(() =>
      validateEnclosureV2DesignInput({
        ...design,
        innerClearWidthMm: Number.NaN,
      }),
    ).toThrow(/innerClearWidthMm.*finite and positive/i);
    expect(() =>
      evaluateSymmetricInsetDoorDimensionsMm({
        ...design,
        frontDoorCentreGapMm: 1200,
      }),
    ).toThrow(/derived front door leaf width.*finite and positive/i);
    expect(() =>
      validateEnclosureV2DesignInput({
        ...design,
        requiredFrontAccessEnvelopeMm: {
          widthMm: 500,
          heightMm: 400,
          thicknessMm: 0,
        },
      }),
    ).toThrow(/thicknessMm.*finite and positive/i);
  });

  it("adapts existing dimensions as clear requirements without importing placement", () => {
    expect(
      designInputFromExistingEnclosureDimensions({
        width: 1674,
        height: 740,
        depth: 1649,
      }),
    ).toMatchObject({
      innerClearWidthMm: 1674,
      innerClearHeightMm: 740,
      innerClearDepthMm: 1649,
      frontDoorSideClearanceMm: 3,
    });
  });

  it("derives a conservative board envelope from 3030 frames and hinge keep-out", () => {
    expect(evaluatePracticalFrontAccessEnvelopeMm(design)).toMatchObject({
      widthMm: 1064,
      heightMm: 770,
      thicknessMm: 600,
      fullyOpenDoorAngleDeg: 90,
      leftSideObstructionMm: 38,
      rightSideObstructionMm: 38,
      bottomObstructionMm: 0,
      topObstructionMm: 0,
      obstructionAssumptionsMm: {
        fullyOpenDoorFrameSideIntrusionMm: 30,
        hingeSideKeepOutMm: 5,
      },
    });
  });

  it("derives the main structural envelope from the clear cavity and 30 mm frame offset", () => {
    expect(evaluateMainStructuralEnvelopeMm(design)).toEqual({
      min: { x: -30, y: -30, z: -630 },
      max: { x: 1230, y: 830, z: 30 },
    });
  });

  it("contains stable, grouped human-readable specifications", () => {
    expect(enclosureV2DesignSpecs.system.map((spec) => spec.id)).toContain("SYS-001");
    expect(enclosureV2DesignSpecs.access.map((spec) => spec.id)).toContain("ACCESS-001");
    expect(new Set(allEnclosureV2DesignSpecs.map((spec) => spec.id)).size).toBe(
      allEnclosureV2DesignSpecs.length,
    );
    expect(allEnclosureV2DesignSpecs.every((spec) => spec.statement.length > 0)).toBe(true);
  });

  it("records the confirmed mixed starting profile allocation without treating placement as authority", () => {
    expect(enclosureV2StartingStructuralProfileAssignments).toHaveLength(16);
    expect(
      enclosureV2StartingStructuralProfileAssignments.filter((entry) => entry.profile === "3030"),
    ).toHaveLength(10);
    expect(
      enclosureV2StartingStructuralProfileAssignments.filter((entry) => entry.profile === "3060"),
    ).toHaveLength(6);
    expect(enclosureV2DoorFrameProfile).toBe("3030");
    expect(
      enclosureV2DesignSpecs.topology.find((spec) => spec.id === "TOPO-004")?.statement,
    ).toMatch(/placements are not authoritative/i);
  });
});

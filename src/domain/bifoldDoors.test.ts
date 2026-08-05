import { describe, expect, it } from "vitest";
import {
  evaluateBiFoldDoorPlan,
  makeBiFoldDoorPlan,
  validateBiFoldDoorPlanInput,
  type BiFoldDoorPlanInput,
} from "./bifoldDoors";

const input: BiFoldDoorPlanInput = {
  leftRearAccess: {
    face: "left",
    parkingDirection: "toward-back",
    dimensions: {
      openingWidthMm: 400,
      openingHeightMm: 700,
      primaryLeafWidthMm: 190,
      secondaryLeafWidthMm: 190,
      frameFaceDepthMm: 30,
      insetPanelThicknessMm: 4,
      closedPerimeterClearanceMm: 3,
      closedLeafMeetingClearanceMm: 3,
    },
    poses: {
      closedPrimaryLeafAngleDeg: 0,
      closedSecondaryLeafRelativeAngleDeg: 0,
      openPrimaryLeafAngleDeg: 90,
      openSecondaryLeafRelativeAngleDeg: 180,
      parkedPrimaryLeafAngleDeg: 90,
      parkedSecondaryLeafRelativeAngleDeg: 180,
    },
    keepOut: {
      exteriorPrimaryLeafSweepProjectionMm: 200,
      exteriorSecondaryLeafSweepProjectionMm: 200,
      exteriorFrameHingeProjectionMm: 20,
      exteriorInterLeafHingeProjectionMm: 20,
      parkedStackProjectionMm: 60,
      parkingDirectionClearLengthMm: 400,
      interiorClearanceMm: 0,
    },
  },
  backRightAccess: {
    face: "back",
    parkingDirection: "toward-right",
    dimensions: {
      openingWidthMm: 600,
      openingHeightMm: 700,
      primaryLeafWidthMm: 290,
      secondaryLeafWidthMm: 290,
      frameFaceDepthMm: 30,
      insetPanelThicknessMm: 4,
      closedPerimeterClearanceMm: 3,
      closedLeafMeetingClearanceMm: 3,
    },
    poses: {
      closedPrimaryLeafAngleDeg: 0,
      closedSecondaryLeafRelativeAngleDeg: 0,
      openPrimaryLeafAngleDeg: 90,
      openSecondaryLeafRelativeAngleDeg: 180,
      parkedPrimaryLeafAngleDeg: 90,
      parkedSecondaryLeafRelativeAngleDeg: 180,
    },
    keepOut: {
      exteriorPrimaryLeafSweepProjectionMm: 300,
      exteriorSecondaryLeafSweepProjectionMm: 300,
      exteriorFrameHingeProjectionMm: 20,
      exteriorInterLeafHingeProjectionMm: 20,
      parkedStackProjectionMm: 60,
      parkingDirectionClearLengthMm: 600,
      interiorClearanceMm: 0,
    },
  },
};

describe("bi-fold access-door requirements", () => {
  it("defines the agreed outward-folding topology without selecting hardware", () => {
    const plan = makeBiFoldDoorPlan(input);

    expect(plan).toMatchObject({ status: "requirements-only" });
    expect(plan.openings).toEqual([
      expect.objectContaining({
        id: "left-rear-access",
        face: "left",
        openingDirection: "outward",
        parkingDirection: "toward-back",
        leaves: [
          expect.objectContaining({
            id: "left-rear-access-primary",
            role: "primary",
          }),
          expect.objectContaining({
            id: "left-rear-access-secondary",
            role: "secondary",
          }),
        ],
      }),
      expect.objectContaining({
        id: "back-right-access",
        face: "back",
        openingDirection: "outward",
        parkingDirection: "toward-right",
        leaves: [
          expect.objectContaining({
            id: "back-right-access-primary",
            role: "primary",
          }),
          expect.objectContaining({
            id: "back-right-access-secondary",
            role: "secondary",
          }),
        ],
      }),
    ]);

    for (const opening of plan.openings) {
      expect(opening.hinges).toEqual([
        expect.objectContaining({
          kind: "frame-to-primary",
          hardwareSelection: "unselected",
        }),
        expect.objectContaining({
          kind: "primary-to-secondary",
          hardwareSelection: "unselected",
        }),
      ]);
    }
  });

  it("retains named pose and keep-out inputs for later CAD-based motion proof", () => {
    const [leftRear] = makeBiFoldDoorPlan(input).openings;

    expect(leftRear.poses).toEqual([
      {
        state: "closed",
        primaryLeafAngleDeg: 0,
        secondaryLeafRelativeAngleDeg: 0,
      },
      {
        state: "open",
        primaryLeafAngleDeg: 90,
        secondaryLeafRelativeAngleDeg: 180,
      },
      {
        state: "parked",
        primaryLeafAngleDeg: 90,
        secondaryLeafRelativeAngleDeg: 180,
      },
    ]);
    expect(leftRear.keepOut).toEqual(input.leftRearAccess.keepOut);
  });

  it("rejects a closed leaf pair that exceeds its opening after named clearances", () => {
    expect(() =>
      validateBiFoldDoorPlanInput({
        ...input,
        leftRearAccess: {
          ...input.leftRearAccess,
          dimensions: {
            ...input.leftRearAccess.dimensions,
            openingWidthMm: 300,
          },
        },
      }),
    ).toThrow(/exceed openingWidthMm/i);
  });

  it("locks the two agreed faces and parking directions into the requirements boundary", () => {
    expect(() =>
      validateBiFoldDoorPlanInput({
        ...input,
        leftRearAccess: {
          ...input.leftRearAccess,
          parkingDirection: "toward-right",
        },
      }),
    ).toThrow(/must park toward the back/i);
  });
});

describe("evaluated bi-fold door plan", () => {
  it("derives full-height half-face openings, equal leaves, inset panels, and named poses", () => {
    const plan = evaluateBiFoldDoorPlan({
      innerClearWidthMm: 1674,
      innerClearHeightMm: 740,
      innerClearDepthMm: 1649,
      perimeterClearanceMm: 3,
      meetingClearanceMm: 3,
      frameFaceDepthMm: 30,
      insetPanelThicknessMm: 4,
      exteriorFrameOffsetMm: 30,
    });
    const [left, back] = plan.openings;

    expect(plan.status).toBe("evaluated-provisional-interleaf-hardware");
    expect(left).toMatchObject({
      id: "left-rear-access",
      openingWidthMm: 824.5,
      openingHeightMm: 734,
      framePivotMm: { x: -30, y: 3, z: -1679 },
      outwardAngleSign: -1,
      parkingDirection: "toward-back",
    });
    expect(back).toMatchObject({
      id: "back-right-access",
      openingWidthMm: 837,
      openingHeightMm: 734,
      framePivotMm: { x: 1704, y: 3, z: -1679 },
      outwardAngleSign: -1,
      parkingDirection: "toward-right",
    });
    for (const opening of plan.openings) {
      expect(opening.leaves[0].nominalWidthMm).toBe(opening.leaves[1].nominalWidthMm);
      expect(opening.leaves.every((leaf) => leaf.frameFitStatus === "fits")).toBe(true);
      expect(
        opening.leaves.every(
          (leaf) => leaf.insetPanel.installation === "inset-in-door-frame-slots",
        ),
      ).toBe(true);
      expect(opening.frameHinge).toMatchObject({
        hardwareSelection: "wolweiss-glr3030",
        geometryStatus: "supplier-step",
      });
      expect(opening.interLeafHinge).toMatchObject({
        hardwareSelection: "unselected",
        collisionProofStatus: "not-available-without-selected-hardware",
      });
    }
  });
});

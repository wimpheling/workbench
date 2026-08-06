import { describe, expect, it } from "vitest";
import {
  evaluateBiFoldDoorPlan,
  guidedBiFoldPose,
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
      openSecondaryLeafRelativeAngleDeg: -180,
      parkedPrimaryLeafAngleDeg: 90,
      parkedSecondaryLeafRelativeAngleDeg: -180,
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
      openSecondaryLeafRelativeAngleDeg: -180,
      parkedPrimaryLeafAngleDeg: 90,
      parkedSecondaryLeafRelativeAngleDeg: -180,
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
        secondaryLeafRelativeAngleDeg: -180,
      },
      {
        state: "parked",
        primaryLeafAngleDeg: 90,
        secondaryLeafRelativeAngleDeg: -180,
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
  it("derives full-height half-face openings, hinge-offset leaves, inset panels, and named poses", () => {
    const plan = evaluateBiFoldDoorPlan({
      innerClearWidthMm: 1674,
      innerClearHeightMm: 740,
      innerClearDepthMm: 1649,
      perimeterClearanceMm: 3,
      meetingClearanceMm: 3,
      frameFaceDepthMm: 30,
      insetPanelThicknessMm: 4,
      exteriorFrameOffsetMm: 30,
      topGuideHeadroomMm: 30,
    });
    const [left, back] = plan.openings;

    expect(plan.status).toBe("evaluated-guided-bifold-hardware");
    expect(left).toMatchObject({
      id: "left-rear-access",
      openingWidthMm: 824.5,
      openingHeightMm: 704,
      framePivotMm: { x: -30, y: 3, z: -1679 },
      outwardAngleSign: -1,
      parkingDirection: "toward-back",
    });
    expect(back).toMatchObject({
      id: "back-right-access",
      openingWidthMm: 837,
      openingHeightMm: 704,
      framePivotMm: { x: 1704, y: 3, z: -1679 },
      outwardAngleSign: -1,
      parkingDirection: "toward-right",
    });
    for (const opening of plan.openings) {
      expect(opening.leaves[1].nominalWidthMm - opening.leaves[0].nominalWidthMm).toBe(23);
      expect(opening.leaves.every((leaf) => leaf.frameFitStatus === "fits")).toBe(true);
      expect(
        opening.leaves.every(
          (leaf) => leaf.insetPanel.installation === "inset-in-door-frame-slots",
        ),
      ).toBe(true);
      expect(opening.frameHinge).toMatchObject({
        hardwareSelection: "wolweiss-glr3030",
        geometryStatus: "supplier-step",
        mountingSide: "external-visible",
        pivotOffsetFromLeafMidplaneMm: 23,
        pivotToMountingPlaneMm: 8,
        boundaryOffsetFromOpeningOriginMm: 30,
      });
      expect(opening.interLeafHinge).toMatchObject({
        hardwareSelection: "elesa-cfg-30-30-sh-6-c33",
        geometryStatus: "supplier-step",
        openingAngleDeg: 180,
        mountingSide: "inside-door-faces",
        pivotOffsetFromLeafMidplaneMm: -23,
        pivotToMountingPlaneMm: 8,
        slotAllocation: expect.objectContaining({
          status: "inside-hinge-separated-from-inset-panel-channel",
          panelFace: "face-a",
          hingeFace: "face-b",
        }),
      });
      expect(opening.guide).toMatchObject({
        trackSelection: "wolweiss-gsd082-3000kit",
        trackInstallation: "underside-slot-of-top-frame-rail",
        headroomMm: 30,
        doorTopRunningClearanceMm: 5.25,
        trackGeometryStatus: "supplier-step",
        shoeSelection: "printed-replaceable-guide-shoe",
        carriageRetention: "opposed-keeper-captive-in-gsd-channel",
        rollerOffsetFromLeafMidplaneMm: 0,
        kinematicsStatus: "datum-driven-free-stile-track-constrained",
      });
    }
  });

  it("solves the guided fold from the real inside-mounted CFG pivot offset", () => {
    const primaryWidthMm = 300;
    const secondaryWidthMm = 323;
    const framePivotOffsetMm = 23;
    const pivotOffsetMm = -23;
    for (let angleDeg = 0; angleDeg <= 90; angleDeg += 1) {
      const pose = guidedBiFoldPose(
        primaryWidthMm,
        secondaryWidthMm,
        0,
        framePivotOffsetMm,
        pivotOffsetMm,
        0,
        angleDeg,
      );
      const primaryAngleRad = (angleDeg * Math.PI) / 180;
      const secondaryWorldAngleRad =
        ((angleDeg + pose.secondaryLeafRelativeAngleDeg) * Math.PI) / 180;
      const hingeDepthMm =
        framePivotOffsetMm +
        primaryWidthMm * Math.sin(primaryAngleRad) +
        (pivotOffsetMm - framePivotOffsetMm) * Math.cos(primaryAngleRad);
      const rollerDepthMm =
        hingeDepthMm +
        secondaryWidthMm * Math.sin(secondaryWorldAngleRad) -
        pivotOffsetMm * Math.cos(secondaryWorldAngleRad);
      expect(rollerDepthMm).toBeCloseTo(0, 8);
    }
    const parked = guidedBiFoldPose(
      primaryWidthMm,
      secondaryWidthMm,
      0,
      framePivotOffsetMm,
      pivotOffsetMm,
      0,
      90,
    );
    expect(parked.secondaryLeafRelativeAngleDeg).toBeCloseTo(-180, 8);
  });
});

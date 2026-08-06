import { partId } from "./ids";
import {
  makeBiFoldInterLeafSlotAllocation,
  type BiFoldInterLeafSlotAllocation,
} from "./slotAllocation";

/**
 * Installation dimensions derived from the selected GSD082.3000KIT section.
 * Keeping these beside the hardware selection makes the remaining door-head
 * clearance explicit, rather than rendering the whole track as empty space.
 */
export const biFoldGuideInstallationVariablesMm = Object.freeze({
  gsd082SectionHeightMm: 24.75,
  doorTopRunningClearanceMm: 3,
});

/**
 * The two additional access openings agreed for the enclosure.  They are
 * deliberately independent of EnclosureV2 until the multi-face frame layout
 * is evaluated.
 */
export type BiFoldDoorOpeningId = "left-rear-access" | "back-right-access";

export type BiFoldDoorLeafId =
  | "left-rear-access-primary"
  | "left-rear-access-secondary"
  | "back-right-access-primary"
  | "back-right-access-secondary";

export type BiFoldDoorFace = "left" | "back";
export type BiFoldParkingDirection = "toward-back" | "toward-right";
export type BiFoldLeafRole = "primary" | "secondary";

/**
 * These are requirements, rather than selected catalogue parts.  A later
 * hardware selection must prove that a real hinge satisfies each requirement.
 */
export type BiFoldHingeRequirement = Readonly<{
  id: `${BiFoldDoorOpeningId}.${"frame-to-primary" | "primary-to-secondary"}`;
  openingId: BiFoldDoorOpeningId;
  kind: "frame-to-primary" | "primary-to-secondary";
  axis: "vertical";
  openingDirection: "outward";
  hardwareSelection: "unselected";
  requiresInsetPanelClearance: true;
}>;

export type BiFoldDoorLeaf = Readonly<{
  id: BiFoldDoorLeafId;
  openingId: BiFoldDoorOpeningId;
  role: BiFoldLeafRole;
  nominalWidthMm: number;
  nominalHeightMm: number;
  frameFaceDepthMm: number;
  insetPanelThicknessMm: number;
}>;

/** Every scalar used to define a side/back bi-fold opening is an explicit input. */
export type BiFoldDoorDimensionsInputMm = Readonly<{
  openingWidthMm: number;
  openingHeightMm: number;
  primaryLeafWidthMm: number;
  secondaryLeafWidthMm: number;
  frameFaceDepthMm: number;
  insetPanelThicknessMm: number;
  closedPerimeterClearanceMm: number;
  closedLeafMeetingClearanceMm: number;
}>;

/**
 * Angles are face-local: a later pose evaluator assigns their world-space
 * sign from the opening face and its outward normal.
 */
export type BiFoldDoorPoseRequirements = Readonly<{
  closedPrimaryLeafAngleDeg: number;
  closedSecondaryLeafRelativeAngleDeg: number;
  openPrimaryLeafAngleDeg: number;
  openSecondaryLeafRelativeAngleDeg: number;
  parkedPrimaryLeafAngleDeg: number;
  parkedSecondaryLeafRelativeAngleDeg: number;
}>;

/**
 * Conservative volumes reserved outside the enclosure.  These are inputs
 * until selected hinge STEP models and exact panel geometry can derive them.
 */
export type BiFoldDoorKeepOutInputMm = Readonly<{
  exteriorPrimaryLeafSweepProjectionMm: number;
  exteriorSecondaryLeafSweepProjectionMm: number;
  exteriorFrameHingeProjectionMm: number;
  exteriorInterLeafHingeProjectionMm: number;
  parkedStackProjectionMm: number;
  parkingDirectionClearLengthMm: number;
  interiorClearanceMm: number;
}>;

export type BiFoldDoorOpeningInput = Readonly<{
  face: BiFoldDoorFace;
  parkingDirection: BiFoldParkingDirection;
  dimensions: BiFoldDoorDimensionsInputMm;
  poses: BiFoldDoorPoseRequirements;
  keepOut: BiFoldDoorKeepOutInputMm;
}>;

export type BiFoldDoorPlanInput = Readonly<{
  leftRearAccess: BiFoldDoorOpeningInput;
  backRightAccess: BiFoldDoorOpeningInput;
}>;

export type BiFoldDoorPose = Readonly<{
  state: "closed" | "open" | "parked";
  primaryLeafAngleDeg: number;
  secondaryLeafRelativeAngleDeg: number;
}>;

export type BiFoldDoorOpening = Readonly<{
  id: BiFoldDoorOpeningId;
  face: BiFoldDoorFace;
  openingDirection: "outward";
  parkingDirection: BiFoldParkingDirection;
  dimensions: BiFoldDoorDimensionsInputMm;
  leaves: readonly [BiFoldDoorLeaf, BiFoldDoorLeaf];
  hinges: readonly [BiFoldHingeRequirement, BiFoldHingeRequirement];
  poses: readonly [BiFoldDoorPose, BiFoldDoorPose, BiFoldDoorPose];
  keepOut: BiFoldDoorKeepOutInputMm;
}>;

export type BiFoldDoorPlan = Readonly<{
  status: "requirements-only";
  openings: readonly [BiFoldDoorOpening, BiFoldDoorOpening];
}>;

/**
 * World-space, evaluated access opening data. Both hinge interfaces and the
 * guide track are selected supplier parts; the printed follower remains a
 * project-owned part derived from their calibrated datums.
 */
export type EvaluatedBiFoldDoorFrameHinge = Readonly<{
  kind: "frame-to-primary";
  hardwareSelection: "wolweiss-glr3030";
  geometryStatus: "supplier-step";
  installationStatus: "pose-evaluated";
  mountingSide: "external-visible";
  pivotToMountingPlaneMm: number;
  /** Positive from the closed leaf centre-plane toward the exterior. */
  pivotOffsetFromLeafMidplaneMm: number;
  /** From the legacy opening-corner datum to the post/leaf boundary. */
  boundaryOffsetFromOpeningOriginMm: number;
}>;

export type EvaluatedBiFoldDoorInterLeafHinge = Readonly<{
  kind: "primary-to-secondary";
  /** Elesa CFG.30/30: a genuine two-leaf hinge for 30 mm profiles. */
  hardwareSelection: "elesa-cfg-30-30-sh-6-c33";
  openingAngleDeg: 180;
  geometryStatus: "supplier-step";
  installationStatus: "selected-m6-slot-nut";
  mountingSide: "inside-door-faces";
  /** Signed from the leaf centre-plane toward the enclosure interior. */
  pivotOffsetFromLeafMidplaneMm: number;
  pivotToMountingPlaneMm: number;
  slotAllocation: BiFoldInterLeafSlotAllocation;
  collisionProofStatus: "component-cad-pending-installation-clearance-proof";
}>;

/**
 * The GSD is the stationary top track. The printed shoe is deliberately a
 * low-load, replaceable guide—not a weight-bearing door suspension.
 */
export type EvaluatedBiFoldDoorGuide = Readonly<{
  trackSelection: "wolweiss-gsd082-3000kit";
  trackInstallation: "underside-slot-of-top-frame-rail";
  trackLengthMm: 3000;
  /** Reserved vertical stack below the upper frame rail for track and roller. */
  headroomMm: number;
  /** The deliberate gap between the door top and the underside of the track. */
  doorTopRunningClearanceMm: number;
  trackGeometryStatus: "supplier-step";
  shoeSelection: "printed-replaceable-guide-shoe";
  shoeMaterial: "petg-or-asa";
  shoeInstallation: "secondary-free-stile-two-m6-slot-nuts";
  /**
   * The printed body is mechanically retained by opposed keepers in the GSD
   * channel.  It is a captive follower, not merely a roller touching a rail.
   */
  carriageRetention: "opposed-keeper-captive-in-gsd-channel";
  loadRole: "lateral-guidance-only";
  /** Transverse guide-line datum relative to the frame-hinge axis. */
  guideLineOffsetMm: 0;
  /** The printed follower centres the roller on the closed leaf mid-plane. */
  rollerOffsetFromLeafMidplaneMm: 0;
  kinematicsStatus: "datum-driven-free-stile-track-constrained";
}>;

export type EvaluatedBiFoldDoorLeaf = Readonly<{
  id: BiFoldDoorLeafId;
  role: BiFoldLeafRole;
  nominalWidthMm: number;
  nominalHeightMm: number;
  frameProfile: "profile:aluminium-3030";
  frameFaceDepthMm: number;
  frameFitStatus: "fits" | "incompatible-opening-too-small";
  insetPanel: Readonly<{
    installation: "inset-in-door-frame-slots";
    thicknessMm: number;
    cutWidthMm: number;
    cutHeightMm: number;
  }>;
}>;

export type EvaluatedBiFoldDoorOpening = Readonly<{
  id: BiFoldDoorOpeningId;
  face: BiFoldDoorFace;
  parkingDirection: BiFoldParkingDirection;
  openingWidthMm: number;
  openingHeightMm: number;
  /** The world-space pivot on the outer edge of the opening. */
  framePivotMm: Readonly<{ x: number; y: number; z: number }>;
  /** One positive value moves the primary leaf outward for this face. */
  outwardAngleSign: 1 | -1;
  leaves: readonly [EvaluatedBiFoldDoorLeaf, EvaluatedBiFoldDoorLeaf];
  poses: readonly [BiFoldDoorPose, BiFoldDoorPose, BiFoldDoorPose];
  frameHinge: EvaluatedBiFoldDoorFrameHinge;
  interLeafHinge: EvaluatedBiFoldDoorInterLeafHinge;
  guide: EvaluatedBiFoldDoorGuide;
}>;

export type EvaluatedBiFoldDoorPlan = Readonly<{
  status: "evaluated-guided-bifold-hardware";
  openings: readonly [EvaluatedBiFoldDoorOpening, EvaluatedBiFoldDoorOpening];
}>;

export type BiFoldDoorEvaluationInputMm = Readonly<{
  innerClearWidthMm: number;
  innerClearHeightMm: number;
  innerClearDepthMm: number;
  perimeterClearanceMm: number;
  meetingClearanceMm: number;
  frameFaceDepthMm: number;
  insetPanelThicknessMm: number;
  /** Exterior offset of the closed door-frame mid-plane from each face. */
  exteriorFrameOffsetMm: number;
  topGuideHeadroomMm: number;
}>;

const assertFiniteNonNegative = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${name} must be finite and non-negative; received ${value}`);
};

const assertFinitePositive = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be finite and positive; received ${value}`);
};

const assertDimensions = (
  openingId: BiFoldDoorOpeningId,
  dimensions: BiFoldDoorDimensionsInputMm,
) => {
  assertFinitePositive(`${openingId}.openingWidthMm`, dimensions.openingWidthMm);
  assertFinitePositive(`${openingId}.openingHeightMm`, dimensions.openingHeightMm);
  assertFinitePositive(`${openingId}.primaryLeafWidthMm`, dimensions.primaryLeafWidthMm);
  assertFinitePositive(`${openingId}.secondaryLeafWidthMm`, dimensions.secondaryLeafWidthMm);
  assertFinitePositive(`${openingId}.frameFaceDepthMm`, dimensions.frameFaceDepthMm);
  assertFinitePositive(`${openingId}.insetPanelThicknessMm`, dimensions.insetPanelThicknessMm);
  assertFiniteNonNegative(
    `${openingId}.closedPerimeterClearanceMm`,
    dimensions.closedPerimeterClearanceMm,
  );
  assertFiniteNonNegative(
    `${openingId}.closedLeafMeetingClearanceMm`,
    dimensions.closedLeafMeetingClearanceMm,
  );

  const closedWidthMm =
    dimensions.primaryLeafWidthMm +
    dimensions.secondaryLeafWidthMm +
    dimensions.closedPerimeterClearanceMm * 2 +
    dimensions.closedLeafMeetingClearanceMm;
  if (closedWidthMm > dimensions.openingWidthMm)
    throw new Error(
      `${openingId} leaves and named closed clearances exceed openingWidthMm; received ${closedWidthMm} > ${dimensions.openingWidthMm}`,
    );
};

const assertFinitePose = (openingId: BiFoldDoorOpeningId, poses: BiFoldDoorPoseRequirements) => {
  for (const [name, angleDeg] of Object.entries(poses))
    if (!Number.isFinite(angleDeg))
      throw new Error(`${openingId}.${name} must be finite; received ${angleDeg}`);
};

const assertKeepOut = (openingId: BiFoldDoorOpeningId, keepOut: BiFoldDoorKeepOutInputMm) => {
  for (const [name, valueMm] of Object.entries(keepOut))
    assertFiniteNonNegative(`${openingId}.${name}`, valueMm);
};

const openingEntries = (
  input: BiFoldDoorPlanInput,
): readonly [
  readonly [BiFoldDoorOpeningId, BiFoldDoorOpeningInput],
  readonly [BiFoldDoorOpeningId, BiFoldDoorOpeningInput],
] => [
  ["left-rear-access", input.leftRearAccess],
  ["back-right-access", input.backRightAccess],
];

/** Validates that requirements describe physically placeable closed leaves. */
export const validateBiFoldDoorPlanInput = (input: BiFoldDoorPlanInput): void => {
  for (const [openingId, opening] of openingEntries(input)) {
    assertDimensions(openingId, opening.dimensions);
    assertFinitePose(openingId, opening.poses);
    assertKeepOut(openingId, opening.keepOut);
  }

  if (input.leftRearAccess.face !== "left")
    throw new Error("left-rear-access must be assigned to the left face");
  if (input.leftRearAccess.parkingDirection !== "toward-back")
    throw new Error("left-rear-access must park toward the back");
  if (input.backRightAccess.face !== "back")
    throw new Error("back-right-access must be assigned to the back face");
  if (input.backRightAccess.parkingDirection !== "toward-right")
    throw new Error("back-right-access must park toward the right");
};

const makeOpening = (id: BiFoldDoorOpeningId, input: BiFoldDoorOpeningInput): BiFoldDoorOpening => {
  const primaryId = `${id}-primary` as BiFoldDoorLeafId;
  const secondaryId = `${id}-secondary` as BiFoldDoorLeafId;
  const leaf = (
    role: BiFoldLeafRole,
    leafId: BiFoldDoorLeafId,
    nominalWidthMm: number,
  ): BiFoldDoorLeaf =>
    Object.freeze({
      id: leafId,
      openingId: id,
      role,
      nominalWidthMm,
      nominalHeightMm: input.dimensions.openingHeightMm,
      frameFaceDepthMm: input.dimensions.frameFaceDepthMm,
      insetPanelThicknessMm: input.dimensions.insetPanelThicknessMm,
    });

  return Object.freeze({
    id,
    face: input.face,
    openingDirection: "outward",
    parkingDirection: input.parkingDirection,
    dimensions: Object.freeze({ ...input.dimensions }),
    leaves: Object.freeze([
      leaf("primary", primaryId, input.dimensions.primaryLeafWidthMm),
      leaf("secondary", secondaryId, input.dimensions.secondaryLeafWidthMm),
    ]) as BiFoldDoorOpening["leaves"],
    hinges: Object.freeze([
      Object.freeze({
        id: `${id}.frame-to-primary`,
        openingId: id,
        kind: "frame-to-primary",
        axis: "vertical",
        openingDirection: "outward",
        hardwareSelection: "unselected",
        requiresInsetPanelClearance: true,
      }),
      Object.freeze({
        id: `${id}.primary-to-secondary`,
        openingId: id,
        kind: "primary-to-secondary",
        axis: "vertical",
        openingDirection: "outward",
        hardwareSelection: "unselected",
        requiresInsetPanelClearance: true,
      }),
    ]) as BiFoldDoorOpening["hinges"],
    poses: Object.freeze([
      Object.freeze({
        state: "closed",
        primaryLeafAngleDeg: input.poses.closedPrimaryLeafAngleDeg,
        secondaryLeafRelativeAngleDeg: input.poses.closedSecondaryLeafRelativeAngleDeg,
      }),
      Object.freeze({
        state: "open",
        primaryLeafAngleDeg: input.poses.openPrimaryLeafAngleDeg,
        secondaryLeafRelativeAngleDeg: input.poses.openSecondaryLeafRelativeAngleDeg,
      }),
      Object.freeze({
        state: "parked",
        primaryLeafAngleDeg: input.poses.parkedPrimaryLeafAngleDeg,
        secondaryLeafRelativeAngleDeg: input.poses.parkedSecondaryLeafRelativeAngleDeg,
      }),
    ]) as BiFoldDoorOpening["poses"],
    keepOut: Object.freeze({ ...input.keepOut }),
  });
};

/**
 * Captures agreed topology only. It intentionally selects neither hinges nor
 * dimensions, and it performs no world-space geometry calculation.
 */
export const makeBiFoldDoorPlan = (input: BiFoldDoorPlanInput): BiFoldDoorPlan => {
  validateBiFoldDoorPlanInput(input);
  return Object.freeze({
    status: "requirements-only",
    openings: Object.freeze([
      makeOpening("left-rear-access", input.leftRearAccess),
      makeOpening("back-right-access", input.backRightAccess),
    ]) as BiFoldDoorPlan["openings"],
  });
};

/**
 * Solves the two-link closure against the guide line C=(s,d). The print-on
 * guide arm is designed to put its roller centre on d=0, the hinge-axis plane.
 */
export const guidedBiFoldPose = (
  primaryLeafWidthMm: number,
  secondaryLeafWidthMm: number,
  guideLineOffsetMm: number,
  framePivotOffsetFromLeafMidplaneMm: number,
  interLeafPivotOffsetMm: number,
  guideRollerOffsetFromLeafMidplaneMm: number,
  primaryLeafAngleDeg: number,
): BiFoldDoorPose => {
  const theta = (primaryLeafAngleDeg * Math.PI) / 180;
  const hingeDepth =
    framePivotOffsetFromLeafMidplaneMm +
    primaryLeafWidthMm * Math.sin(theta) +
    (interLeafPivotOffsetMm - framePivotOffsetFromLeafMidplaneMm) * Math.cos(theta);
  const rollerDepthFromPivotMm = guideRollerOffsetFromLeafMidplaneMm - interLeafPivotOffsetMm;
  const targetDepthMm = guideLineOffsetMm - hingeDepth;
  const linkageRadiusMm = Math.hypot(secondaryLeafWidthMm, rollerDepthFromPivotMm);
  if (Math.abs(targetDepthMm) > linkageRadiusMm + 1e-6)
    throw new Error("Guide line is unreachable for the requested bi-fold pose");

  const phaseRad = Math.atan2(rollerDepthFromPivotMm, secondaryLeafWidthMm);
  const normalizedTarget = Math.max(-1, Math.min(1, targetDepthMm / linkageRadiusMm));
  // This branch is continuous from the closed installation, where both leaf
  // centre-planes are collinear and the roller is already on the guide line.
  const secondaryWorldAngle = Math.asin(normalizedTarget) - phaseRad;
  return Object.freeze({
    state: primaryLeafAngleDeg === 0 ? "closed" : "open",
    primaryLeafAngleDeg,
    secondaryLeafRelativeAngleDeg: (secondaryWorldAngle * 180) / Math.PI - primaryLeafAngleDeg,
  });
};

const evaluatedPoses = (
  primaryLeafWidthMm: number,
  secondaryLeafWidthMm: number,
  framePivotOffsetFromLeafMidplaneMm: number,
  interLeafPivotOffsetMm: number,
): readonly [BiFoldDoorPose, BiFoldDoorPose, BiFoldDoorPose] =>
  Object.freeze([
    Object.freeze({
      state: "closed",
      primaryLeafAngleDeg: 0,
      secondaryLeafRelativeAngleDeg: 0,
    }),
    Object.freeze({
      ...guidedBiFoldPose(
        primaryLeafWidthMm,
        secondaryLeafWidthMm,
        0,
        framePivotOffsetFromLeafMidplaneMm,
        interLeafPivotOffsetMm,
        0,
        90,
      ),
    }),
    Object.freeze({
      ...guidedBiFoldPose(
        primaryLeafWidthMm,
        secondaryLeafWidthMm,
        0,
        framePivotOffsetFromLeafMidplaneMm,
        interLeafPivotOffsetMm,
        0,
        90,
      ),
      state: "parked",
    }),
  ]);

const evaluatedLeaf = (
  id: BiFoldDoorLeafId,
  role: BiFoldLeafRole,
  widthMm: number,
  heightMm: number,
  frameFaceDepthMm: number,
  insetPanelThicknessMm: number,
): EvaluatedBiFoldDoorLeaf => {
  const frameOpeningWidthMm = widthMm - frameFaceDepthMm * 2;
  const frameOpeningHeightMm = heightMm - frameFaceDepthMm * 2;
  return Object.freeze({
    id,
    role,
    nominalWidthMm: widthMm,
    nominalHeightMm: heightMm,
    frameProfile: "profile:aluminium-3030",
    frameFaceDepthMm,
    frameFitStatus:
      frameOpeningWidthMm > 0 && frameOpeningHeightMm > 0
        ? "fits"
        : "incompatible-opening-too-small",
    insetPanel: Object.freeze({
      installation: "inset-in-door-frame-slots",
      thicknessMm: insetPanelThicknessMm,
      // A selected retainer is still required, so no unproven slot-engagement
      // allowance is added to this visual/evaluated panel cut.
      cutWidthMm: Math.max(0, frameOpeningWidthMm),
      cutHeightMm: Math.max(0, frameOpeningHeightMm),
    }),
  });
};

const validatedEvaluationInput = (input: BiFoldDoorEvaluationInputMm): void => {
  for (const [name, value] of Object.entries(input)) assertFinitePositive(name, value);
};

/**
 * Evaluates the agreed full-height, half-face openings from the stakeholder's
 * clear enclosure dimensions. The leaf pair shares the opening after the
 * explicitly named perimeter and meeting clearances.
 */
export const evaluateBiFoldDoorPlan = (
  input: BiFoldDoorEvaluationInputMm,
): EvaluatedBiFoldDoorPlan => {
  validatedEvaluationInput(input);
  const opening = (
    id: BiFoldDoorOpeningId,
    face: BiFoldDoorFace,
    parkingDirection: BiFoldParkingDirection,
    openingWidthMm: number,
    framePivotMm: Readonly<{ x: number; y: number; z: number }>,
    outwardAngleSign: 1 | -1,
  ): EvaluatedBiFoldDoorOpening => {
    const minimumGuideHeadroomMm =
      biFoldGuideInstallationVariablesMm.gsd082SectionHeightMm +
      biFoldGuideInstallationVariablesMm.doorTopRunningClearanceMm;
    if (input.topGuideHeadroomMm < minimumGuideHeadroomMm)
      throw new Error(
        `topGuideHeadroomMm must reserve ${minimumGuideHeadroomMm} mm for the selected GSD082 track and door running clearance`,
      );
    const openingHeightMm =
      input.innerClearHeightMm - input.perimeterClearanceMm * 2 - input.topGuideHeadroomMm;
    const usableWidthMm =
      openingWidthMm - input.perimeterClearanceMm * 2 - input.meetingClearanceMm;
    if (openingHeightMm <= 0 || usableWidthMm <= 0)
      throw new Error(`${id} has no usable opening after named clearances`);
    const glrPivotToMountingPlaneMm = 8;
    const framePivotOffsetFromLeafMidplaneMm =
      input.frameFaceDepthMm / 2 + glrPivotToMountingPlaneMm;
    const primaryWidthMm = (usableWidthMm - framePivotOffsetFromLeafMidplaneMm) / 2;
    const secondaryWidthMm = usableWidthMm - primaryWidthMm;
    if (primaryWidthMm <= 0)
      throw new Error(`${id} is too narrow for the selected external frame-hinge offset`);
    const cfgPivotToMountingPlaneMm = 8;
    const interLeafPivotOffsetMm = -(input.frameFaceDepthMm / 2 + cfgPivotToMountingPlaneMm);
    return Object.freeze({
      id,
      face,
      parkingDirection,
      openingWidthMm,
      openingHeightMm,
      framePivotMm: Object.freeze({ ...framePivotMm }),
      outwardAngleSign,
      leaves: Object.freeze([
        evaluatedLeaf(
          `${id}-primary` as BiFoldDoorLeafId,
          "primary",
          primaryWidthMm,
          openingHeightMm,
          input.frameFaceDepthMm,
          input.insetPanelThicknessMm,
        ),
        evaluatedLeaf(
          `${id}-secondary` as BiFoldDoorLeafId,
          "secondary",
          secondaryWidthMm,
          openingHeightMm,
          input.frameFaceDepthMm,
          input.insetPanelThicknessMm,
        ),
      ]) as EvaluatedBiFoldDoorOpening["leaves"],
      poses: evaluatedPoses(
        primaryWidthMm,
        secondaryWidthMm,
        framePivotOffsetFromLeafMidplaneMm,
        interLeafPivotOffsetMm,
      ) as EvaluatedBiFoldDoorOpening["poses"],
      frameHinge: Object.freeze({
        kind: "frame-to-primary",
        hardwareSelection: "wolweiss-glr3030",
        geometryStatus: "supplier-step",
        installationStatus: "pose-evaluated",
        mountingSide: "external-visible",
        pivotToMountingPlaneMm: glrPivotToMountingPlaneMm,
        pivotOffsetFromLeafMidplaneMm: framePivotOffsetFromLeafMidplaneMm,
        boundaryOffsetFromOpeningOriginMm: input.frameFaceDepthMm,
      }),
      interLeafHinge: Object.freeze({
        kind: "primary-to-secondary",
        hardwareSelection: "elesa-cfg-30-30-sh-6-c33",
        openingAngleDeg: 180,
        geometryStatus: "supplier-step",
        installationStatus: "selected-m6-slot-nut",
        mountingSide: "inside-door-faces",
        pivotOffsetFromLeafMidplaneMm: interLeafPivotOffsetMm,
        pivotToMountingPlaneMm: cfgPivotToMountingPlaneMm,
        slotAllocation: makeBiFoldInterLeafSlotAllocation(
          id,
          partId(`${id}-primary-free-upright`),
          partId(`${id}-secondary-hinge-upright`),
        ),
        collisionProofStatus: "component-cad-pending-installation-clearance-proof",
      }),
      guide: Object.freeze({
        trackSelection: "wolweiss-gsd082-3000kit",
        trackInstallation: "underside-slot-of-top-frame-rail",
        trackLengthMm: 3000,
        headroomMm: input.topGuideHeadroomMm,
        doorTopRunningClearanceMm:
          input.topGuideHeadroomMm - biFoldGuideInstallationVariablesMm.gsd082SectionHeightMm,
        trackGeometryStatus: "supplier-step",
        shoeSelection: "printed-replaceable-guide-shoe",
        shoeMaterial: "petg-or-asa",
        shoeInstallation: "secondary-free-stile-two-m6-slot-nuts",
        carriageRetention: "opposed-keeper-captive-in-gsd-channel",
        loadRole: "lateral-guidance-only",
        guideLineOffsetMm: 0,
        rollerOffsetFromLeafMidplaneMm: 0,
        kinematicsStatus: "datum-driven-free-stile-track-constrained",
      }),
    });
  };

  const leftWidthMm = input.innerClearDepthMm / 2;
  const backWidthMm = input.innerClearWidthMm / 2;
  return Object.freeze({
    status: "evaluated-guided-bifold-hardware",
    openings: Object.freeze([
      // The left-rear opening is hinged from the rear-left corner and closes
      // forward over the rear half of the left face.
      opening(
        "left-rear-access",
        "left",
        "toward-back",
        leftWidthMm,
        {
          x: -input.exteriorFrameOffsetMm,
          y: input.perimeterClearanceMm,
          z: -input.innerClearDepthMm - input.exteriorFrameOffsetMm,
        },
        -1,
      ),
      // The back opening starts at the right edge and runs leftward.
      opening(
        "back-right-access",
        "back",
        "toward-right",
        backWidthMm,
        {
          x: input.innerClearWidthMm + input.exteriorFrameOffsetMm,
          y: input.perimeterClearanceMm,
          z: -input.innerClearDepthMm - input.exteriorFrameOffsetMm,
        },
        -1,
      ),
    ]) as EvaluatedBiFoldDoorPlan["openings"],
  });
};

export const biFoldDoorPose = (
  opening: EvaluatedBiFoldDoorOpening,
  state: BiFoldDoorPose["state"],
): BiFoldDoorPose => {
  const pose = opening.poses.find((candidate) => candidate.state === state);
  if (!pose) throw new Error(`Unknown ${opening.id} bi-fold pose: ${state}`);
  return pose;
};

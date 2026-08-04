import type { EnclosureModel } from "./enclosureV2";
import {
  evaluateGeometricConstraints,
  type GeometricConstraint,
  type GeometricConstraintEvaluation,
  type GeometricPoint,
} from "./geometricConstraints";

const MM_TOLERANCE = 1e-6;
const entity = (id: string, description: string) => ({ id, description });

type ExpectedMember = Readonly<{ center: GeometricPoint; lengthMm: number }>;

const expectedMembers = (model: EnclosureModel): Readonly<Record<string, ExpectedMember>> => {
  const { widthMm: width, heightMm: height, depthMm: depth } = model.innerClearDimensionsMm;
  return {
    "part:left-bottom-rail": { center: { x: -15, y: -15, z: -depth / 2 }, lengthMm: depth },
    "part:left-top-rail": { center: { x: -15, y: height + 15, z: -depth / 2 }, lengthMm: depth },
    "part:right-bottom-rail": {
      center: { x: width + 15, y: -15, z: -depth / 2 },
      lengthMm: depth,
    },
    "part:right-top-rail": {
      center: { x: width + 15, y: height + 15, z: -depth / 2 },
      lengthMm: depth,
    },
    "part:side-middle-left": {
      center: { x: -15, y: height / 2, z: -depth / 2 },
      lengthMm: height,
    },
    "part:side-middle-right": {
      center: { x: width + 15, y: height / 2, z: -depth / 2 },
      lengthMm: height,
    },
    "part:front-bottom-rail": {
      center: { x: width / 2, y: -15, z: 15 },
      lengthMm: width + 60,
    },
    "part:front-top": {
      center: { x: width / 2, y: height + 30, z: 15 },
      lengthMm: width + 60,
    },
    "part:front-left-post": {
      center: { x: -30, y: height / 2, z: 15 },
      lengthMm: height,
    },
    "part:front-right-post": {
      center: { x: width + 30, y: height / 2, z: 15 },
      lengthMm: height,
    },
    "part:back-left-post": {
      center: { x: -15, y: height / 2, z: -depth - 15 },
      lengthMm: height,
    },
    "part:back-right-post": {
      center: { x: width + 15, y: height / 2, z: -depth - 15 },
      lengthMm: height,
    },
    "part:back-middle-support": {
      center: { x: width / 2, y: height / 2, z: -depth - 15 },
      lengthMm: height,
    },
    "part:back-bottom-rail": {
      center: { x: width / 2, y: -15, z: -depth - 15 },
      lengthMm: width + 60,
    },
    "part:back-top-rail": {
      center: { x: width / 2, y: height + 15, z: -depth - 15 },
      lengthMm: width + 60,
    },
    "part:top-back-tie": {
      center: { x: width / 2, y: height + 15, z: -depth / 2 },
      lengthMm: depth,
    },
  };
};

/** Builds executable constraints traced to the approved human-readable design brief. */
export const buildEnclosureV2DesignConstraints = (
  model: EnclosureModel,
): readonly GeometricConstraint[] => {
  const constraints: GeometricConstraint[] = [];
  for (const member of model.members) {
    const expected = expectedMembers(model)[member.id];
    if (!expected) continue;
    const memberEntity = [entity(member.id, `Structural member ${member.id}`)];
    constraints.push({
      kind: "point-coincidence",
      id: `FRAME-006.${member.id}.center`,
      description: "The member centre is fixed by the evaluated clear-volume boundaries.",
      entities: memberEntity,
      tolerance: MM_TOLERANCE,
      first: member.transform.position,
      second: expected.center,
    });
    constraints.push({
      kind: "scalar-equality",
      id: `PROFILE-003.${member.id}.cut-length`,
      description: "The member cut length equals the span between its constrained end faces.",
      entities: memberEntity,
      tolerance: MM_TOLERANCE,
      actual: member.length,
      expected: expected.lengthMm,
    });
  }

  const [leftDoor, rightDoor] = model.doors ?? [];
  if (leftDoor && rightDoor) {
    const doorEntities = [
      entity(leftDoor.id, "Left inset door leaf"),
      entity(rightDoor.id, "Right inset door leaf"),
    ];
    constraints.push(
      {
        kind: "scalar-equality",
        id: "DOOR-006.equal-leaf-width",
        description: "The two inset door leaves have equal outside widths.",
        entities: doorEntities,
        tolerance: MM_TOLERANCE,
        actual: leftDoor.nominalWidth,
        expected: rightDoor.nominalWidth,
      },
      {
        kind: "scalar-equality",
        id: "DOOR-006.equal-leaf-height",
        description: "The two inset door leaves have equal outside heights.",
        entities: doorEntities,
        tolerance: MM_TOLERANCE,
        actual: leftDoor.nominalHeight,
        expected: rightDoor.nominalHeight,
      },
      {
        kind: "scalar-equality",
        id: "DOOR-006.partition-front-opening",
        description: "Door leaves and declared gaps exactly partition the clear front width.",
        entities: doorEntities,
        tolerance: MM_TOLERANCE,
        actual:
          leftDoor.nominalWidth +
          rightDoor.nominalWidth +
          model.designInput.frontDoorSideClearanceMm * 2 +
          model.designInput.frontDoorCentreGapMm,
        expected: model.innerClearDimensionsMm.widthMm,
      },
    );
  }
  return constraints;
};

export const evaluateEnclosureV2DesignConstraints = (
  model: EnclosureModel,
): readonly GeometricConstraintEvaluation[] =>
  evaluateGeometricConstraints(buildEnclosureV2DesignConstraints(model));

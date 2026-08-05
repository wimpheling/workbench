import type { Dimensions } from "./units";
import type { NominalBounds } from "./nominalBounds";

/**
 * The declarative design brief for the next EnclosureV2 evaluator.
 *
 * These inputs name empty, usable space. They deliberately do not encode the
 * historical renderer's anchor coordinates or member placements.
 */
export type EnclosureV2DesignInput = Readonly<{
  innerClearWidthMm: number;
  innerClearHeightMm: number;
  innerClearDepthMm: number;
  frontDoorSideClearanceMm: number;
  frontDoorTopClearanceMm: number;
  frontDoorBottomClearanceMm: number;
  frontDoorCentreGapMm: number;
  requiredFrontAccessEnvelopeMm?: RequiredFrontAccessEnvelopeMm;
}>;

export type RequiredFrontAccessEnvelopeMm = Readonly<{
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
}>;

/**
 * Conservative occupied bands around the front opening with both inset leaves
 * open to 90 degrees. These are design assumptions, not renderer offsets.
 * Replace the hinge allowance after selecting actual hinge hardware.
 */
export type FrontAccessObstructionAssumptionsMm = Readonly<{
  fullyOpenDoorFrameSideIntrusionMm: number;
  hingeSideKeepOutMm: number;
  internalDepthKeepOutMm: number;
}>;

/**
 * A conservative rectangular prism that can pass face-on and axis-aligned
 * through the front while both leaves are fully open.
 */
export type EvaluatedPracticalFrontAccessEnvelopeMm = RequiredFrontAccessEnvelopeMm &
  Readonly<{
    fullyOpenDoorAngleDeg: 90;
    leftSideObstructionMm: number;
    rightSideObstructionMm: number;
    bottomObstructionMm: number;
    topObstructionMm: number;
    obstructionAssumptionsMm: FrontAccessObstructionAssumptionsMm;
  }>;

export type EnclosureV2DesignDimensions = Readonly<{
  innerClearWidthMm: number;
  innerClearHeightMm: number;
  innerClearDepthMm: number;
}>;

export type EvaluatedInsetDoorDimensionsMm = Readonly<{
  frontOpeningClearWidthMm: number;
  frontOpeningClearHeightMm: number;
  leafWidthMm: number;
  leafHeightMm: number;
}>;

/**
 * The front frame has 3060 posts with their 60 mm dimension across X and a
 * 3060 top member with its 60 mm dimension across Y. Their inside faces
 * define the usable front opening.
 */
export const frontFrameOpeningReductionMm = Object.freeze({
  widthMm: 60,
  heightMm: 30,
});

/** The 30-series frame extends this far beyond each clear-cavity boundary. */
export const mainStructuralEnvelopeOffsetMm = 30;

export const evaluateMainStructuralEnvelopeMm = (input: EnclosureV2DesignInput): NominalBounds => {
  validateEnclosureV2DesignInput(input);
  return Object.freeze({
    min: Object.freeze({
      x: -mainStructuralEnvelopeOffsetMm,
      y: -mainStructuralEnvelopeOffsetMm,
      z: -input.innerClearDepthMm - mainStructuralEnvelopeOffsetMm,
    }),
    max: Object.freeze({
      x: input.innerClearWidthMm + mainStructuralEnvelopeOffsetMm,
      y: input.innerClearHeightMm + mainStructuralEnvelopeOffsetMm,
      z: mainStructuralEnvelopeOffsetMm,
    }),
  });
};

export const defaultEnclosureV2DoorClearancesMm = Object.freeze({
  frontDoorSideClearanceMm: 3,
  frontDoorTopClearanceMm: 3,
  frontDoorBottomClearanceMm: 3,
  frontDoorCentreGapMm: 3,
});

export const defaultFrontAccessObstructionAssumptionsMm = Object.freeze({
  // At 90 degrees the hinge-side stile conservatively reserves one profile width.
  fullyOpenDoorFrameSideIntrusionMm: 30,
  // Provisional hardware allowance until a physical hinge is selected.
  hingeSideKeepOutMm: 5,
  // No internal access hardware is modelled yet.
  internalDepthKeepOutMm: 0,
} satisfies FrontAccessObstructionAssumptionsMm);

export const defaultEnclosureV2DesignInput = (
  dimensions: EnclosureV2DesignDimensions,
): EnclosureV2DesignInput => ({
  ...dimensions,
  ...defaultEnclosureV2DoorClearancesMm,
});

const assertFinitePositive = (name: string, value: number) => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be finite and positive; received ${value}`);
};

/** Validates design requirements before any geometry is evaluated. */
export const validateEnclosureV2DesignInput = (input: EnclosureV2DesignInput): void => {
  assertFinitePositive("innerClearWidthMm", input.innerClearWidthMm);
  assertFinitePositive("innerClearHeightMm", input.innerClearHeightMm);
  assertFinitePositive("innerClearDepthMm", input.innerClearDepthMm);
  assertFinitePositive("frontDoorSideClearanceMm", input.frontDoorSideClearanceMm);
  assertFinitePositive("frontDoorTopClearanceMm", input.frontDoorTopClearanceMm);
  assertFinitePositive("frontDoorBottomClearanceMm", input.frontDoorBottomClearanceMm);
  assertFinitePositive("frontDoorCentreGapMm", input.frontDoorCentreGapMm);

  const envelope = input.requiredFrontAccessEnvelopeMm;
  if (!envelope) return;
  assertFinitePositive("requiredFrontAccessEnvelopeMm.widthMm", envelope.widthMm);
  assertFinitePositive("requiredFrontAccessEnvelopeMm.heightMm", envelope.heightMm);
  assertFinitePositive("requiredFrontAccessEnvelopeMm.thicknessMm", envelope.thicknessMm);
};

/**
 * Inset leaves share the structurally bounded front opening symmetrically.
 * The 3060 front posts take 30 mm from each side of the clear width and the
 * top 3060 rail takes 30 mm from the clear height.
 */
export const evaluateSymmetricInsetDoorDimensionsMm = (
  input: EnclosureV2DesignInput,
): EvaluatedInsetDoorDimensionsMm => {
  validateEnclosureV2DesignInput(input);
  const frontOpeningClearWidthMm = input.innerClearWidthMm - frontFrameOpeningReductionMm.widthMm;
  const frontOpeningClearHeightMm =
    input.innerClearHeightMm - frontFrameOpeningReductionMm.heightMm;
  const leafWidthMm =
    (frontOpeningClearWidthMm - input.frontDoorSideClearanceMm * 2 - input.frontDoorCentreGapMm) /
    2;
  const leafHeightMm =
    frontOpeningClearHeightMm - input.frontDoorTopClearanceMm - input.frontDoorBottomClearanceMm;
  assertFinitePositive("derived front door leaf width", leafWidthMm);
  assertFinitePositive("derived front door leaf height", leafHeightMm);
  return {
    frontOpeningClearWidthMm,
    frontOpeningClearHeightMm,
    leafWidthMm,
    leafHeightMm,
  };
};

const assertFiniteNonNegative = (name: string, value: number) => {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${name} must be finite and non-negative; received ${value}`);
};

const validateFrontAccessObstructionAssumptionsMm = (
  assumptions: FrontAccessObstructionAssumptionsMm,
): void => {
  assertFinitePositive(
    "fullyOpenDoorFrameSideIntrusionMm",
    assumptions.fullyOpenDoorFrameSideIntrusionMm,
  );
  assertFiniteNonNegative("hingeSideKeepOutMm", assumptions.hingeSideKeepOutMm);
  assertFiniteNonNegative("internalDepthKeepOutMm", assumptions.internalDepthKeepOutMm);
};

/**
 * Evaluates the board-access envelope from the evaluated front opening, the
 * 3030 door frame, and the explicitly provisional hinge allowance. The result
 * uses the largest central rectangle left by the two 90-degree door leaves.
 * Their horizontal rails lie outside that central strip, so they do not reduce
 * its usable height.
 */
export const evaluatePracticalFrontAccessEnvelopeMm = (
  input: EnclosureV2DesignInput,
  assumptions: FrontAccessObstructionAssumptionsMm = defaultFrontAccessObstructionAssumptionsMm,
): EvaluatedPracticalFrontAccessEnvelopeMm => {
  const opening = evaluateSymmetricInsetDoorDimensionsMm(input);
  validateFrontAccessObstructionAssumptionsMm(assumptions);
  const leftSideObstructionMm =
    input.frontDoorSideClearanceMm +
    assumptions.fullyOpenDoorFrameSideIntrusionMm +
    assumptions.hingeSideKeepOutMm;
  const rightSideObstructionMm = leftSideObstructionMm;
  const bottomObstructionMm = 0;
  const topObstructionMm = 0;
  const widthMm = Math.max(
    0,
    opening.frontOpeningClearWidthMm - leftSideObstructionMm - rightSideObstructionMm,
  );
  const heightMm = Math.max(
    0,
    opening.frontOpeningClearHeightMm - bottomObstructionMm - topObstructionMm,
  );
  const thicknessMm = input.innerClearDepthMm - assumptions.internalDepthKeepOutMm;
  assertFiniteNonNegative("derived practical front access width", widthMm);
  assertFiniteNonNegative("derived practical front access height", heightMm);
  assertFinitePositive("derived practical front access thickness", thicknessMm);
  return Object.freeze({
    widthMm,
    heightMm,
    thicknessMm,
    fullyOpenDoorAngleDeg: 90,
    leftSideObstructionMm,
    rightSideObstructionMm,
    bottomObstructionMm,
    topObstructionMm,
    obstructionAssumptionsMm: Object.freeze({ ...assumptions }),
  });
};

type ExistingEnclosureDimensions =
  | Readonly<{ width: number; height: number; depth: number }>
  | Dimensions;

/**
 * Compatibility bridge only: existing V2 dimensions are interpreted as clear
 * dimensions in millimetres. It imports no legacy placements or offsets.
 */
export const designInputFromExistingEnclosureDimensions = (
  dimensions: ExistingEnclosureDimensions,
  overrides: Partial<Omit<EnclosureV2DesignInput, keyof EnclosureV2DesignDimensions>> = {},
): EnclosureV2DesignInput => {
  const clearDimensions =
    "width" in dimensions
      ? {
          innerClearWidthMm: dimensions.width,
          innerClearHeightMm: dimensions.height,
          innerClearDepthMm: dimensions.depth,
        }
      : {
          innerClearWidthMm: dimensions.x,
          innerClearHeightMm: dimensions.y,
          innerClearDepthMm: dimensions.z,
        };
  return { ...defaultEnclosureV2DesignInput(clearDimensions), ...overrides };
};

export type EnclosureV2DesignSpecGroup =
  | "system"
  | "dimensions"
  | "frame"
  | "envelope"
  | "topology"
  | "profiles"
  | "joints"
  | "opening"
  | "doors"
  | "hinges"
  | "access"
  | "solve"
  | "check";

export type EnclosureV2DesignSpec = Readonly<{
  id: string;
  group: EnclosureV2DesignSpecGroup;
  statement: string;
}>;

const specs = <Group extends EnclosureV2DesignSpecGroup>(
  group: Group,
  entries: readonly (readonly [id: string, statement: string])[],
): readonly EnclosureV2DesignSpec[] => entries.map(([id, statement]) => ({ id, group, statement }));

/** Human-readable specifications that future constraints and checks trace to. */
export const enclosureV2DesignSpecs = Object.freeze({
  system: specs("system", [
    ["SYS-001", "All linear dimensions are expressed internally in millimetres."],
    [
      "SYS-002",
      "The enclosure uses a right-handed frame: X left-to-right, Y bottom-to-top, Z back-to-front.",
    ],
    ["SYS-003", "The front is the maximum-Z side."],
    [
      "SYS-004",
      "A domain part's local origin is its geometric centre unless its specification explicitly defines another origin, such as a hinge axis.",
    ],
    [
      "SYS-005",
      "A rendering solid must preserve its domain part's origin, dimensions, and orientation.",
    ],
  ]),
  dimensions: specs("dimensions", [
    [
      "DIM-001",
      "innerClearWidthMm is the unobstructed distance between the left and right structural boundaries of the internal volume.",
    ],
    [
      "DIM-002",
      "innerClearHeightMm is the unobstructed distance between the bottom and top structural boundaries of the internal volume.",
    ],
    [
      "DIM-003",
      "innerClearDepthMm is the unobstructed distance between the rear and front structural boundaries of the internal volume.",
    ],
    [
      "DIM-004",
      "Clear dimensions describe empty usable space; profiles may enter it only when a later explicit feature says so.",
    ],
    ["DIM-005", "All requested clear dimensions are finite and strictly positive."],
    ["DIM-006", "Exterior dimensions are evaluated results, not aliases for clear dimensions."],
  ]),
  frame: specs("frame", [
    [
      "FRAME-001",
      "The structural frame forms a rectangular box around the requested clear internal volume.",
    ],
    [
      "FRAME-002",
      "The structural frame uses an explicit mix of 3030 and 3060 aluminium extrusion.",
    ],
    [
      "FRAME-003",
      "A member profile is an explicit design decision and is not inferred from its direction.",
    ],
    ["FRAME-004", "A 3060 member has an explicitly declared 60 mm section-axis direction."],
    [
      "FRAME-005",
      "Horizontal boundary members are continuous full-length members; vertical posts fit between their top and bottom counterparts where their joint specifies that relationship.",
    ],
    [
      "FRAME-009",
      "The front 3060 post axes lie on the left and right clear-volume boundary planes, and the front top 3060 axis lies on the top clear-volume boundary plane; all three members remain within the main structural box.",
    ],
    ["FRAME-006", "Every structural member is fully constrained in position and orientation."],
    [
      "FRAME-007",
      "Changing a clear dimension preserves declared connections and profile orientations.",
    ],
    ["FRAME-008", "No renderer-only translation or rotation may repair a structural connection."],
  ]),
  envelope: specs("envelope", [
    [
      "BOUND-001",
      "Every structural member and closed door leaf lies entirely within the main structural envelope.",
    ],
    [
      "BOUND-002",
      "The main structural envelope extends 30 mm beyond every clear-cavity boundary plane.",
    ],
  ]),
  topology: specs("topology", [
    [
      "TOPO-001",
      "The bottom and top boundaries each contain front, rear, left, and right perimeter members.",
    ],
    [
      "TOPO-002",
      "The frame has four corner posts and declared middle supports that increase stiffness.",
    ],
    ["TOPO-003", "No middle post crosses the usable front-door opening."],
    [
      "TOPO-004",
      "The confirmed legacy profile assignment is a starting profile allocation only; its hand-entered placements are not authoritative.",
    ],
  ]),
  profiles: specs("profiles", [
    [
      "PROFILE-001",
      "A member's longitudinal axis passes through the geometric centre of its profile.",
    ],
    ["PROFILE-002", "Member endpoints are the centres of manufactured cut end faces."],
    ["PROFILE-003", "The distance between endpoints equals cut length."],
    [
      "PROFILE-004",
      "A 3030 profile has a 30 mm by 30 mm section; a 3060 profile has 30 mm and 60 mm named section axes.",
    ],
    [
      "PROFILE-005",
      "A front-facing broad 3060 face has its normal toward positive Z; this does not make the 60 mm section dimension run along Z.",
    ],
    [
      "PROFILE-006",
      "Profile orientation is validated using transformed face normals and world-space bounds.",
    ],
  ]),
  joints: specs("joints", [
    [
      "JOINT-001",
      "Every physical structural connection is represented as an explicit joint between named members.",
    ],
    [
      "JOINT-002",
      "A butt joint identifies its terminating member, supporting member, mating faces, and expected contact area.",
    ],
    [
      "JOINT-003",
      "A valid butt joint has coincident mating planes and overlapping mating areas within its assembly tolerance.",
    ],
    ["JOINT-004", "Intentional face contact is not a collision."],
    ["JOINT-005", "Volume intersection outside an explicitly permitted joint region is invalid."],
    [
      "JOINT-006",
      "Fasteners and brackets may later refine a joint without changing its nominal structural geometry.",
    ],
  ]),
  opening: specs("opening", [
    [
      "OPENING-001",
      "The front opening is bounded by the inner faces of its left and right front posts and the facing surfaces of its bottom and top members.",
    ],
    ["OPENING-002", "No structural member crosses the front opening."],
    [
      "OPENING-003",
      "frontOpeningClearWidthMm and frontOpeningClearHeightMm are derived from the evaluated boundary faces.",
    ],
    [
      "OPENING-004",
      "The front 3060 frame deliberately reduces the front opening to innerClearWidthMm minus 60 mm by innerClearHeightMm minus 30 mm.",
    ],
  ]),
  doors: specs("doors", [
    ["DOOR-001", "The front is closed by two symmetrical inset door leaves."],
    ["DOOR-002", "Door frames use 3030 aluminium extrusion."],
    [
      "DOOR-003",
      "Each leaf is a rigid assembly with two vertical frame members, two horizontal frame members, and an inset panel.",
    ],
    [
      "DOOR-004",
      "Closed leaves occupy the front opening and their front faces are flush with the structural frame's front face.",
    ],
    ["DOOR-005", "Closed leaves do not overlap the structural frame."],
    [
      "DOOR-006",
      "Leaf dimensions derive from the front opening and the explicit side, top, bottom, and centre clearances.",
    ],
    [
      "DOOR-007",
      "Door clearances are measured between actual solid boundaries rather than object origins.",
    ],
    ["DOOR-008", "Panel size and engagement are derived from explicit frame-slot relationships."],
  ]),
  hinges: specs("hinges", [
    [
      "HINGE-001",
      "Each leaf has one explicit vertical hinge axis, defined relative to its outer side and front face.",
    ],
    ["HINGE-002", "The hinge arrangements are mirror images; both leaves open outward."],
    ["HINGE-003", "Closed is 0 degrees and the initial fully-open state is 90 degrees."],
    [
      "HINGE-004",
      "Hinge-axis offsets are explicit design or hardware parameters, never implicit door-centre offsets.",
    ],
    [
      "HINGE-005",
      "Door motion keeps its hinge axis fixed and stays clear of the frame and the other leaf throughout the supported range.",
    ],
  ]),
  access: specs("access", [
    [
      "ACCESS-001",
      "An optional requiredFrontAccessEnvelopeMm describes a board as a width, height, and thickness rectangular prism.",
    ],
    ["ACCESS-002", "Practical access is evaluated with both leaves fully open."],
    [
      "ACCESS-003",
      "Usable access dimensions derive from evaluated door-frame and hinge obstruction assumptions; later handles and stops must join those assumptions.",
    ],
    [
      "ACCESS-004",
      "The initial fit rule requires the board to pass face-on and axis-aligned through the front opening.",
    ],
    [
      "ACCESS-005",
      "An unmet required access envelope invalidates the design; validation may not silently enlarge or displace geometry.",
    ],
  ]),
  solve: specs("solve", [
    ["SOLVE-001", "All generated parts must be fully constrained."],
    [
      "SOLVE-002",
      "A failed constraint reports its affected entities plus measured and expected values.",
    ],
    [
      "SOLVE-003",
      "Conflicting constraints report an over-constrained result rather than selecting one silently.",
    ],
    ["SOLVE-004", "Unresolved degrees of freedom report an under-constrained result."],
    ["SOLVE-005", "Identical parameters evaluate deterministically."],
    ["SOLVE-006", "The rendering adapter neither solves nor modifies the design solution."],
  ]),
  check: specs("check", [
    [
      "CHECK-001",
      "Post-solve validation confirms that evaluated internal clear volume matches the requested dimensions.",
    ],
    [
      "CHECK-002",
      "Post-solve validation confirms intended joints, profile orientation, finite positive cut lengths, and no unintended intersections.",
    ],
    [
      "CHECK-003",
      "Post-solve validation confirms closed-door clearances and collision-free supported door motion.",
    ],
    ["CHECK-004", "Post-solve validation confirms any required practical access envelope."],
    ["CHECK-005", "Renderer and solid bounds agree with the evaluated domain parts."],
    [
      "CHECK-006",
      "Manufacturing outputs derive from the same evaluated parts used for rendering and validation.",
    ],
  ]),
} satisfies Readonly<Record<EnclosureV2DesignSpecGroup, readonly EnclosureV2DesignSpec[]>>);

export const allEnclosureV2DesignSpecs = Object.freeze(
  Object.values(enclosureV2DesignSpecs).flat(),
);

export type EnclosureV2StartingProfileAssignment = Readonly<{
  memberId: string;
  profile: "3030" | "3060";
}>;

/**
 * Confirmed legacy profile allocation. It is useful design intent, but its
 * manually positioned historical member coordinates must not constrain V2.
 */
export const enclosureV2StartingStructuralProfileAssignments = Object.freeze([
  { memberId: "left-bottom-rail", profile: "3030" },
  { memberId: "left-top-rail", profile: "3030" },
  { memberId: "right-bottom-rail", profile: "3030" },
  { memberId: "right-top-rail", profile: "3030" },
  { memberId: "front-bottom-rail", profile: "3030" },
  { memberId: "back-left-post", profile: "3030" },
  { memberId: "back-right-post", profile: "3030" },
  { memberId: "back-bottom-rail", profile: "3030" },
  { memberId: "back-top-rail", profile: "3030" },
  { memberId: "top-back-tie", profile: "3030" },
  { memberId: "side-middle-left", profile: "3060" },
  { memberId: "side-middle-right", profile: "3060" },
  { memberId: "front-top", profile: "3060" },
  { memberId: "front-left-post", profile: "3060" },
  { memberId: "front-right-post", profile: "3060" },
  { memberId: "back-middle-support", profile: "3060" },
] as const satisfies readonly EnclosureV2StartingProfileAssignment[]);

export const enclosureV2DoorFrameProfile = "3030" as const;

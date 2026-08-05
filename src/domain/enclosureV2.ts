import {
  atAnchor,
  anchor,
  betweenAnchors,
  orientedAlong,
  type Anchor,
  type AnchorReference,
  type OrientationSpec,
} from "./anchors";
import { frameId, partId, profileId } from "./ids";
import type { ProfileId } from "./ids";
import type { Point3, Transform } from "./frames";
import type { Dimensions } from "./units";
import type { NominalBounds } from "./nominalBounds";
import { buttJoint, type Connection } from "./connections";
import {
  designInputFromExistingEnclosureDimensions,
  evaluateMainStructuralEnvelopeMm,
  evaluatePracticalFrontAccessEnvelopeMm,
  evaluateSymmetricInsetDoorDimensionsMm,
  frontFrameOpeningReductionMm,
  type EvaluatedPracticalFrontAccessEnvelopeMm,
  type EnclosureV2DesignInput,
} from "./enclosureV2Design";

export type EnclosureDimensions =
  | Dimensions
  | { width: number; height: number; depth: number }
  | EnclosureV2DesignInput;
export type FrameMember = {
  id: ReturnType<typeof partId>;
  profile: ProfileId;
  from: AnchorReference;
  to: AnchorReference;
  length: number;
  orientation?: OrientationSpec;
  transform: Transform;
};
export type EnclosureModel = {
  frame: { id: ReturnType<typeof frameId>; transform: Transform };
  anchors: Readonly<Record<string, Anchor>>;
  members: readonly FrameMember[];
  /** Explicit nominal structural connections; this is design topology, not rendering data. */
  connections: readonly Connection[];
  designInput: EnclosureV2DesignInput;
  innerClearDimensionsMm: {
    widthMm: number;
    heightMm: number;
    depthMm: number;
  };
  mainStructuralEnvelopeMm: NominalBounds;
  frontOpeningClearDimensionsMm: { widthMm: number; heightMm: number };
  /** Conservative face-on, axis-aligned board envelope with both doors open 90 degrees. */
  practicalFrontAccessEnvelopeMm: EvaluatedPracticalFrontAccessEnvelopeMm;
  /** @deprecated Use innerClearDimensionsMm. */
  dimensions?: { x: number; y: number; z: number };
  doorSeamClearance?: number;
  doors?: readonly DoorRecord[];
  panels?: readonly PanelRecord[];
};
export type DoorRecord = {
  id: string;
  nominalWidth: number;
  nominalHeight: number;
};
export type PanelRecord = {
  id: string;
  size: Point3;
  anchor: string;
  orientation?: OrientationSpec;
};

const point = (x: number, y: number, z: number): Point3 => ({ x, y, z });
const PROFILE_3030_SIDE_MM = 30;
const PROFILE_3030_HALF_SIDE_MM = PROFILE_3030_SIDE_MM / 2;
const PROFILE_3060_WIDE_SIDE_MM = 60;
const PROFILE_3060_HALF_WIDE_SIDE_MM = PROFILE_3060_WIDE_SIDE_MM / 2;
const STRUCTURAL_JOINT_TOLERANCE_MM = 0.1;
const PROFILE_3030_END_ENVELOPE_AREA_MM2 = PROFILE_3030_SIDE_MM ** 2;
const PROFILE_3060_END_ENVELOPE_AREA_MM2 = PROFILE_3030_SIDE_MM * PROFILE_3060_WIDE_SIDE_MM;

export function makeRail({
  from,
  to,
  profile,
  anchors,
  id = "rail",
  orientation,
}: {
  from: AnchorReference;
  to: AnchorReference;
  profile: ProfileId;
  anchors: Readonly<Record<string, Anchor>>;
  id?: string;
  orientation?: OrientationSpec;
}): FrameMember {
  const start = atAnchor(from, anchors);
  const end = atAnchor(to, anchors);
  if (start.frame !== end.frame)
    throw new Error(`Anchor frame mismatch: ${start.frame} !== ${end.frame}`);
  const span = betweenAnchors(start, end);
  return {
    id: partId(id),
    profile,
    from,
    to,
    length: span.length,
    orientation,
    transform: orientedAlong(start, end, orientation),
  };
}
export const makePost = makeRail;

export function makeEnclosureV2(input: EnclosureDimensions): EnclosureModel {
  const designInput =
    "innerClearWidthMm" in input ? input : designInputFromExistingEnclosureDimensions(input);
  const innerClearWidthMm = designInput.innerClearWidthMm;
  const innerClearHeightMm = designInput.innerClearHeightMm;
  const innerClearDepthMm = designInput.innerClearDepthMm;
  const doorDimensions = evaluateSymmetricInsetDoorDimensionsMm(designInput);
  const mainStructuralEnvelopeMm = evaluateMainStructuralEnvelopeMm(designInput);
  const practicalFrontAccessEnvelopeMm = evaluatePracticalFrontAccessEnvelopeMm(designInput);
  const anchors: Record<string, Anchor> = {};
  const add = (name: string, position: Point3) => {
    const value = anchor(name, position);
    anchors[`anchor:${name}`] = value;
    anchors[name] = value;
  };
  // The requested clear volume is X=[0,width], Y=[0,height], Z=[-depth,0].
  // All structural centres are derived from those boundary planes and the
  // selected profile sections; none of these offsets belong to the renderer.
  const clearBoundaryProfileOffsetMm = PROFILE_3030_HALF_SIDE_MM;
  add(
    "left-rail-bottom-front",
    point(-clearBoundaryProfileOffsetMm, -clearBoundaryProfileOffsetMm, 0),
  );
  add(
    "left-rail-bottom-back",
    point(-clearBoundaryProfileOffsetMm, -clearBoundaryProfileOffsetMm, -innerClearDepthMm),
  );
  add(
    "left-rail-top-front",
    point(-clearBoundaryProfileOffsetMm, innerClearHeightMm + clearBoundaryProfileOffsetMm, 0),
  );
  add(
    "left-rail-top-back",
    point(
      -clearBoundaryProfileOffsetMm,
      innerClearHeightMm + clearBoundaryProfileOffsetMm,
      -innerClearDepthMm,
    ),
  );
  add(
    "right-rail-bottom-front",
    point(innerClearWidthMm + clearBoundaryProfileOffsetMm, -clearBoundaryProfileOffsetMm, 0),
  );
  add(
    "right-rail-bottom-back",
    point(
      innerClearWidthMm + clearBoundaryProfileOffsetMm,
      -clearBoundaryProfileOffsetMm,
      -innerClearDepthMm,
    ),
  );
  add(
    "right-rail-top-front",
    point(
      innerClearWidthMm + clearBoundaryProfileOffsetMm,
      innerClearHeightMm + clearBoundaryProfileOffsetMm,
      0,
    ),
  );
  add(
    "right-rail-top-back",
    point(
      innerClearWidthMm + clearBoundaryProfileOffsetMm,
      innerClearHeightMm + clearBoundaryProfileOffsetMm,
      -innerClearDepthMm,
    ),
  );
  add("left-side-vertical-bottom", point(-clearBoundaryProfileOffsetMm, 0, -innerClearDepthMm / 2));
  add(
    "left-side-vertical-top",
    point(-clearBoundaryProfileOffsetMm, innerClearHeightMm, -innerClearDepthMm / 2),
  );
  add(
    "right-side-vertical-bottom",
    point(innerClearWidthMm + clearBoundaryProfileOffsetMm, 0, -innerClearDepthMm / 2),
  );
  add(
    "right-side-vertical-top",
    point(
      innerClearWidthMm + clearBoundaryProfileOffsetMm,
      innerClearHeightMm,
      -innerClearDepthMm / 2,
    ),
  );
  add(
    "front-rail-bottom-left",
    point(
      -PROFILE_3060_HALF_WIDE_SIDE_MM,
      -clearBoundaryProfileOffsetMm,
      clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "front-rail-bottom-right",
    point(
      innerClearWidthMm + PROFILE_3060_HALF_WIDE_SIDE_MM,
      -clearBoundaryProfileOffsetMm,
      clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "front-rail-top-left",
    point(-PROFILE_3060_HALF_WIDE_SIDE_MM, innerClearHeightMm, clearBoundaryProfileOffsetMm),
  );
  add(
    "front-rail-top-right",
    point(
      innerClearWidthMm + PROFILE_3060_HALF_WIDE_SIDE_MM,
      innerClearHeightMm,
      clearBoundaryProfileOffsetMm,
    ),
  );

  add("front-left-post-bottom", point(0, 0, clearBoundaryProfileOffsetMm));
  add(
    "front-left-post-top",
    point(
      0,
      innerClearHeightMm - frontFrameOpeningReductionMm.heightMm,
      clearBoundaryProfileOffsetMm,
    ),
  );
  add("front-right-post-bottom", point(innerClearWidthMm, 0, clearBoundaryProfileOffsetMm));
  add(
    "front-right-post-top",
    point(
      innerClearWidthMm,
      innerClearHeightMm - frontFrameOpeningReductionMm.heightMm,
      clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "back-left-post-bottom",
    point(-clearBoundaryProfileOffsetMm, 0, -innerClearDepthMm - clearBoundaryProfileOffsetMm),
  );
  add(
    "back-left-post-top",
    point(
      -clearBoundaryProfileOffsetMm,
      innerClearHeightMm,
      -innerClearDepthMm - clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "back-right-post-bottom",
    point(
      innerClearWidthMm + clearBoundaryProfileOffsetMm,
      0,
      -innerClearDepthMm - clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "back-right-post-top",
    point(
      innerClearWidthMm + clearBoundaryProfileOffsetMm,
      innerClearHeightMm,
      -innerClearDepthMm - clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "back-middle-bottom",
    point(innerClearWidthMm / 2, 0, -innerClearDepthMm - clearBoundaryProfileOffsetMm),
  );
  add(
    "back-middle-top",
    point(
      innerClearWidthMm / 2,
      innerClearHeightMm,
      -innerClearDepthMm - clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "back-rail-bottom-left",
    point(
      -PROFILE_3030_SIDE_MM,
      -clearBoundaryProfileOffsetMm,
      -innerClearDepthMm - clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "back-rail-bottom-right",
    point(
      innerClearWidthMm + PROFILE_3030_SIDE_MM,
      -clearBoundaryProfileOffsetMm,
      -innerClearDepthMm - clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "back-rail-top-left",
    point(
      -PROFILE_3030_SIDE_MM,
      innerClearHeightMm + clearBoundaryProfileOffsetMm,
      -innerClearDepthMm - clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "back-rail-top-right",
    point(
      innerClearWidthMm + PROFILE_3030_SIDE_MM,
      innerClearHeightMm + clearBoundaryProfileOffsetMm,
      -innerClearDepthMm - clearBoundaryProfileOffsetMm,
    ),
  );
  add(
    "top-tie-front",
    point(innerClearWidthMm / 2, innerClearHeightMm + clearBoundaryProfileOffsetMm, 0),
  );
  add(
    "top-tie-back",
    point(
      innerClearWidthMm / 2,
      innerClearHeightMm + clearBoundaryProfileOffsetMm,
      -innerClearDepthMm,
    ),
  );
  add(
    "left-hinge",
    point(
      PROFILE_3060_HALF_WIDE_SIDE_MM + designInput.frontDoorSideClearanceMm,
      designInput.frontDoorBottomClearanceMm,
      PROFILE_3030_SIDE_MM,
    ),
  );
  add(
    "right-hinge",
    point(
      innerClearWidthMm - PROFILE_3060_HALF_WIDE_SIDE_MM - designInput.frontDoorSideClearanceMm,
      designInput.frontDoorBottomClearanceMm,
      PROFILE_3030_SIDE_MM,
    ),
  );

  const ids = new Set<string>();
  const member = (
    id: string,
    from: string,
    to: string,
    profile: string,
    orientation?: OrientationSpec,
  ) => {
    if (ids.has(id)) throw new Error(`Duplicate member ID: ${id}`);
    ids.add(id);
    return makeRail({
      id,
      from: `anchor:${from}`,
      to: `anchor:${to}`,
      profile: profileId(profile),
      anchors,
      orientation,
    });
  };
  const members = [
    member("left-bottom-rail", "left-rail-bottom-front", "left-rail-bottom-back", "aluminium-3030"),
    member(
      "side-middle-left",
      "left-side-vertical-bottom",
      "left-side-vertical-top",
      "aluminium-3060",
      { wideFace: "left" },
    ),
    member("left-top-rail", "left-rail-top-front", "left-rail-top-back", "aluminium-3030"),
    member(
      "right-bottom-rail",
      "right-rail-bottom-front",
      "right-rail-bottom-back",
      "aluminium-3030",
    ),
    member(
      "side-middle-right",
      "right-side-vertical-bottom",
      "right-side-vertical-top",
      "aluminium-3060",
      { wideFace: "right" },
    ),
    member("right-top-rail", "right-rail-top-front", "right-rail-top-back", "aluminium-3030"),
    member(
      "front-bottom-rail",
      "front-rail-bottom-left",
      "front-rail-bottom-right",
      "aluminium-3030",
    ),
    member("front-top", "front-rail-top-left", "front-rail-top-right", "aluminium-3060", {
      wideFace: "front",
    }),
    member("front-left-post", "front-left-post-bottom", "front-left-post-top", "aluminium-3060", {
      wideFace: "front",
    }),
    member(
      "front-right-post",
      "front-right-post-bottom",
      "front-right-post-top",
      "aluminium-3060",
      { wideFace: "front" },
    ),
    member("back-left-post", "back-left-post-bottom", "back-left-post-top", "aluminium-3030"),
    member("back-right-post", "back-right-post-bottom", "back-right-post-top", "aluminium-3030"),
    member("back-middle-support", "back-middle-bottom", "back-middle-top", "aluminium-3060", {
      wideFace: "front",
    }),
    member("back-bottom-rail", "back-rail-bottom-left", "back-rail-bottom-right", "aluminium-3030"),
    member("back-top-rail", "back-rail-top-left", "back-rail-top-right", "aluminium-3030"),
    member("top-back-tie", "top-tie-front", "top-tie-back", "aluminium-3030"),
  ];
  const structuralMemberId = (id: string) => `part:${id}`;
  const structuralButtJoint = (
    id: string,
    terminatingMember: string,
    supportingMember: string,
    terminatingFace: "start" | "end",
    supportingFace: "front" | "back" | "left" | "right" | "top" | "bottom",
    expectedContactAreaMm2: number,
  ): Connection => {
    const terminating = structuralMemberId(terminatingMember);
    const supporting = structuralMemberId(supportingMember);
    return {
      id: `joint:${id}`,
      parts: [terminating, supporting],
      joint: buttJoint(
        terminating,
        supporting,
        terminatingFace,
        supportingFace,
        expectedContactAreaMm2,
        STRUCTURAL_JOINT_TOLERANCE_MM,
      ),
    };
  };
  // Every frame member is connected through an explicit nominal butt joint.
  // Nominal contact area is the terminating profile's section envelope:
  // 900 mm² for 3030 and 1,800 mm² for 3060.
  const connections: readonly Connection[] = [
    structuralButtJoint(
      "side-middle-left-bottom",
      "side-middle-left",
      "left-bottom-rail",
      "start",
      "top",
      PROFILE_3060_END_ENVELOPE_AREA_MM2,
    ),
    structuralButtJoint(
      "side-middle-left-top",
      "side-middle-left",
      "left-top-rail",
      "end",
      "bottom",
      1800,
    ),
    structuralButtJoint(
      "side-middle-right-bottom",
      "side-middle-right",
      "right-bottom-rail",
      "start",
      "top",
      1800,
    ),
    structuralButtJoint(
      "side-middle-right-top",
      "side-middle-right",
      "right-top-rail",
      "end",
      "bottom",
      1800,
    ),
    structuralButtJoint(
      "front-left-post-bottom",
      "front-left-post",
      "front-bottom-rail",
      "start",
      "top",
      1800,
    ),
    structuralButtJoint(
      "front-left-post-top",
      "front-left-post",
      "front-top",
      "end",
      "bottom",
      1800,
    ),
    structuralButtJoint(
      "front-right-post-bottom",
      "front-right-post",
      "front-bottom-rail",
      "start",
      "top",
      1800,
    ),
    structuralButtJoint(
      "front-right-post-top",
      "front-right-post",
      "front-top",
      "end",
      "bottom",
      1800,
    ),
    structuralButtJoint(
      "back-left-post-bottom",
      "back-left-post",
      "back-bottom-rail",
      "start",
      "top",
      PROFILE_3030_END_ENVELOPE_AREA_MM2,
    ),
    structuralButtJoint(
      "back-left-post-top",
      "back-left-post",
      "back-top-rail",
      "end",
      "bottom",
      900,
    ),
    structuralButtJoint(
      "back-right-post-bottom",
      "back-right-post",
      "back-bottom-rail",
      "start",
      "top",
      900,
    ),
    structuralButtJoint(
      "back-right-post-top",
      "back-right-post",
      "back-top-rail",
      "end",
      "bottom",
      900,
    ),
    structuralButtJoint(
      "back-middle-bottom",
      "back-middle-support",
      "back-bottom-rail",
      "start",
      "top",
      1800,
    ),
    structuralButtJoint(
      "back-middle-top",
      "back-middle-support",
      "back-top-rail",
      "end",
      "bottom",
      1800,
    ),
    structuralButtJoint(
      "left-bottom-rail-front",
      "left-bottom-rail",
      "front-bottom-rail",
      "start",
      "back",
      900,
    ),
    structuralButtJoint(
      "left-bottom-rail-back",
      "left-bottom-rail",
      "back-bottom-rail",
      "end",
      "front",
      900,
    ),
    structuralButtJoint("left-top-rail-front", "left-top-rail", "front-top", "start", "back", 900),
    structuralButtJoint(
      "left-top-rail-back",
      "left-top-rail",
      "back-top-rail",
      "end",
      "front",
      900,
    ),
    structuralButtJoint(
      "right-bottom-rail-front",
      "right-bottom-rail",
      "front-bottom-rail",
      "start",
      "back",
      900,
    ),
    structuralButtJoint(
      "right-bottom-rail-back",
      "right-bottom-rail",
      "back-bottom-rail",
      "end",
      "front",
      900,
    ),
    structuralButtJoint(
      "right-top-rail-front",
      "right-top-rail",
      "front-top",
      "start",
      "back",
      900,
    ),
    structuralButtJoint(
      "right-top-rail-back",
      "right-top-rail",
      "back-top-rail",
      "end",
      "front",
      900,
    ),
    structuralButtJoint("top-back-tie-front", "top-back-tie", "front-top", "start", "back", 900),
    structuralButtJoint("top-back-tie-back", "top-back-tie", "back-top-rail", "end", "front", 900),
  ];
  return {
    frame: {
      id: frameId("enclosure-root"),
      transform: { position: point(0, 0, 0), rotation: { x: 0, y: 0, z: 0 } },
    },
    anchors,
    members,
    connections,
    designInput,
    innerClearDimensionsMm: {
      widthMm: innerClearWidthMm,
      heightMm: innerClearHeightMm,
      depthMm: innerClearDepthMm,
    },
    mainStructuralEnvelopeMm,
    frontOpeningClearDimensionsMm: {
      widthMm: doorDimensions.frontOpeningClearWidthMm,
      heightMm: doorDimensions.frontOpeningClearHeightMm,
    },
    practicalFrontAccessEnvelopeMm,
    dimensions: {
      x: innerClearWidthMm,
      y: innerClearHeightMm,
      z: innerClearDepthMm,
    },
    doorSeamClearance: designInput.frontDoorCentreGapMm,
    doors: [
      {
        id: "left-door",
        nominalWidth: doorDimensions.leafWidthMm,
        nominalHeight: doorDimensions.leafHeightMm,
      },
      {
        id: "right-door",
        nominalWidth: doorDimensions.leafWidthMm,
        nominalHeight: doorDimensions.leafHeightMm,
      },
    ],
  };
}

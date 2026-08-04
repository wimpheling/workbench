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

export type EnclosureDimensions = Dimensions;
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
  dimensions?: { x: number; y: number; z: number };
  doorSeamClearance?: number;
  doors?: readonly DoorRecord[];
  serviceSlider?: ServiceSliderRecord;
  panels?: readonly PanelRecord[];
};
export type DoorRecord = { id: string; nominalWidth: number };
export type ServiceSliderRecord = {
  id: string;
  anchor: string;
  width: number;
  height: number;
  travel: number;
};
export type PanelRecord = {
  id: string;
  size: Point3;
  anchor: string;
  orientation?: OrientationSpec;
};

const point = (x: number, y: number, z: number): Point3 => ({ x, y, z });

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

export function makeEnclosureV2(
  dimensions: EnclosureDimensions | { width: number; height: number; depth: number },
): EnclosureModel {
  const width = "width" in dimensions ? dimensions.width : dimensions.x;
  const height = "height" in dimensions ? dimensions.height : dimensions.y;
  const depth = "depth" in dimensions ? dimensions.depth : dimensions.z;
  if (![width, height, depth].every((value) => Number.isFinite(value) && value > 0))
    throw new Error("Enclosure dimensions must be finite and positive");
  const anchors: Record<string, Anchor> = {};
  const add = (name: string, position: Point3) => {
    const value = anchor(name, position);
    anchors[`anchor:${name}`] = value;
    anchors[name] = value;
  };
  // These named points describe the historical cut layout directly.  The input
  // dimensions are the clear (inner) dimensions; the 30 mm section offsets
  // therefore belong in the anchor coordinates rather than in the renderer.
  add("left-rail-bottom-front", point(15, 30, -30));
  add("left-rail-bottom-back", point(15, 30, -depth - 30));
  add("left-rail-top-front", point(15, height - 30, -30));
  add("left-rail-top-back", point(15, height - 30, -depth - 30));
  add("right-rail-bottom-front", point(width + 45, 30, -30));
  add("right-rail-bottom-back", point(width + 45, 30, -depth - 30));
  add("right-rail-top-front", point(width + 45, height - 30, -30));
  add("right-rail-top-back", point(width + 45, height - 30, -depth - 30));
  add("left-side-vertical-bottom", point(15, 30, -depth / 2 - 30));
  add("left-side-vertical-top", point(15, height - 30, -depth / 2 - 30));
  add("right-side-vertical-bottom", point(width + 45, 30, -depth / 2 - 30));
  add("right-side-vertical-top", point(width + 45, height - 30, -depth / 2 - 30));
  add("front-rail-bottom-left", point(0, 15, -30));
  add("front-rail-bottom-right", point(width + 60, 15, -30));
  add("front-rail-top-left", point(0, height - 30, -30));
  add("front-rail-top-right", point(width + 60, height - 30, -30));

  add("front-left-post-bottom", point(30, 30, 0));
  add("front-left-post-top", point(30, height - 60, 0));
  add("front-right-post-bottom", point(width + 30, 30, 0));
  add("front-right-post-top", point(width + 30, height - 60, 0));
  add("back-left-post-bottom", point(15, 30, -depth - 45));
  add("back-left-post-top", point(15, height - 30, -depth - 45));
  add("back-right-post-bottom", point(width + 45, 30, -depth - 45));
  add("back-right-post-top", point(width + 45, height - 30, -depth - 45));
  add("back-middle-bottom", point(width / 2 + 30, 30, -depth - 45));
  add("back-middle-top", point(width / 2 + 30, height - 30, -depth - 45));
  add("back-rail-bottom-left", point(0, 15, -depth - 60));
  add("back-rail-bottom-right", point(width + 60, 15, -depth - 60));
  add("back-rail-top-left", point(0, height - 15, -depth - 60));
  add("back-rail-top-right", point(width + 60, height - 15, -depth - 60));
  add("top-tie-front", point(width / 2 + 30, height - 15, -30));
  add("top-tie-back", point(width / 2 + 30, height - 15, -depth - 30));
  add("left-hinge", point(30, 30, 0));
  add("right-hinge", point(width + 30, 30, 0));
  add("service-slider-origin", point(60, height / 2 - 100, -depth - 75));

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
      {
        wideFace: "front",
      },
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
      {
        wideFace: "front",
      },
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
  return {
    frame: {
      id: frameId("enclosure-root"),
      transform: { position: point(0, 0, 0), rotation: { x: 0, y: 0, z: 0 } },
    },
    anchors,
    members,
    dimensions: { x: width, y: height, z: depth },
    doorSeamClearance: 2,
    doors: [
      { id: "left-door", nominalWidth: width / 2 },
      { id: "right-door", nominalWidth: width / 2 },
    ],
    // A small rear access panel exercises the same assembly API as future
    // sliding panels without claiming full panel/fit/manufacturing support.
    serviceSlider: {
      id: "service-slider",
      anchor: "anchor:service-slider-origin",
      width: Math.max(1, Math.min(300, width - 120)),
      height: Math.max(1, Math.min(300, height - 120)),
      travel: Math.max(0, Math.min(200, width - 180)),
    },
  };
}

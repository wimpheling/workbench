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
  const anchors: Record<string, Anchor> = {};
  const add = (name: string, position: Point3) => {
    const value = anchor(name, position);
    anchors[`anchor:${name}`] = value;
    anchors[name] = value;
  };
  add("front-left-bottom", point(0, 0, 0));
  add("front-right-bottom", point(width, 0, 0));
  add("front-left-top", point(0, height, 0));
  add("front-right-top", point(width, height, 0));
  add("back-left-bottom", point(0, 0, depth));
  add("back-right-bottom", point(width, 0, depth));
  add("back-left-top", point(0, height, depth));
  add("back-right-top", point(width, height, depth));
  add("front-opening-mid", point(width / 2, height / 2, 0));
  add("back-middle", point(width / 2, height / 2, depth));
  add("side-middle-left", point(0, height / 2, depth / 2));
  add("side-middle-right", point(width, height / 2, depth / 2));
  add("left-hinge", point(0, height / 2, 0));
  add("right-hinge", point(width, height / 2, 0));
  const member = (
    id: string,
    from: string,
    to: string,
    profile: string,
    orientation?: OrientationSpec,
  ) =>
    makeRail({
      id,
      from: `anchor:${from}`,
      to: `anchor:${to}`,
      profile: profileId(profile),
      anchors,
      orientation,
    });
  const members = [
    member("front-top", "front-left-top", "front-right-top", "aluminium-3060", {
      wideFace: "front",
    }),
    member("front-left-corner", "front-left-bottom", "front-left-top", "aluminium-3060", {
      wideFace: "front",
    }),
    member("front-right-corner", "front-right-bottom", "front-right-top", "aluminium-3060", {
      wideFace: "front",
    }),
    member("side-middle-left", "front-left-bottom", "back-left-bottom", "aluminium-3030"),
    member("side-middle-right", "front-right-bottom", "back-right-bottom", "aluminium-3030"),
    member("back-middle-support", "back-left-bottom", "back-right-bottom", "aluminium-3030"),
    member("top-back-tie", "front-right-top", "back-right-top", "aluminium-3030"),
  ];
  return {
    frame: {
      id: frameId("enclosure-root"),
      transform: { position: point(0, 0, 0), rotation: { x: 0, y: 0, z: 0 } },
    },
    anchors,
    members,
  };
}

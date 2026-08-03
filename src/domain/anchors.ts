import type { FrameId } from "./ids";
import { frameId } from "./ids";
import type { Point3, Rotation, Transform, Vector3 } from "./frames";

export type AnchorId = `anchor:${string}`;
export type AnchorReference = AnchorId;
export type Anchor = { id: AnchorId; frame: FrameId; position: Point3 };
export type OrientationSpec = { wideFace?: "front" | "back" | "left" | "right" | "top" | "bottom" };
export type PlacementSpec = {
  from: AnchorReference;
  to: AnchorReference;
  orientation?: OrientationSpec;
};
export type AnchorSpan = {
  from: Anchor;
  to: Anchor;
  vector: Vector3;
  length: number;
  axis: Vector3;
};

const rootFrame = frameId("enclosure-root");
const vector = (from: Point3, to: Point3): Vector3 => ({
  x: to.x - from.x,
  y: to.y - from.y,
  z: to.z - from.z,
});
const magnitude = (v: Vector3): number => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
const normalize = (v: Vector3): Vector3 => {
  const length = magnitude(v);
  if (length === 0) throw new Error("Cannot orient between coincident anchors");
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};

export const anchor = (name: string, position: Point3, frame: FrameId = rootFrame): Anchor => ({
  id: `anchor:${name}`,
  frame,
  position,
});

export const midpoint = (a: Anchor, b: Anchor): Anchor =>
  anchor(
    `${a.id.slice(7)}-mid-${b.id.slice(7)}`,
    {
      x: (a.position.x + b.position.x) / 2,
      y: (a.position.y + b.position.y) / 2,
      z: (a.position.z + b.position.z) / 2,
    },
    a.frame,
  );

export const offsetAlong = (from: Anchor, to: Anchor, distance: number): Anchor => {
  const axis = normalize(vector(from.position, to.position));
  return anchor(
    `${from.id.slice(7)}-offset-${distance}`,
    {
      x: from.position.x + axis.x * distance,
      y: from.position.y + axis.y * distance,
      z: from.position.z + axis.z * distance,
    },
    from.frame,
  );
};

export const betweenAnchors = (from: Anchor, to: Anchor): AnchorSpan => {
  const vectorValue = vector(from.position, to.position);
  return {
    from,
    to,
    vector: vectorValue,
    length: magnitude(vectorValue),
    axis: normalize(vectorValue),
  };
};

export const orientedAlong = (
  from: Anchor,
  to: Anchor,
  orientation?: OrientationSpec,
): Transform & { axis: Vector3; orientation?: OrientationSpec } => {
  const span = betweenAnchors(from, to);
  const yaw = Math.atan2(span.axis.y, span.axis.x);
  const pitch = Math.atan2(-span.axis.z, Math.sqrt(span.axis.x ** 2 + span.axis.y ** 2));
  return {
    position: midpoint(from, to).position,
    rotation: { x: 0, y: pitch, z: yaw } satisfies Rotation,
    axis: span.axis,
    orientation,
  };
};

export const atAnchor = (
  reference: AnchorReference,
  anchors: Readonly<Record<string, Anchor>>,
): Anchor => {
  const found = anchors[reference] ?? Object.values(anchors).find((item) => item.id === reference);
  if (!found) throw new Error(`Missing anchor reference: ${reference}`);
  return found;
};

export type { Transform };

import type { Angle, Length } from "./units";
import type { FrameId } from "./ids";

export type Point3 = { x: Length; y: Length; z: Length };
export type Vector3 = Point3;
/** Right-handed X/Y/Z axes; rotations are radians, intrinsic XYZ (X then Y then Z), local-to-parent. */
export type Rotation = { x: Angle; y: Angle; z: Angle };
export type Transform = {
  position: Point3;
  rotation: Rotation;
  readonly basis?: readonly number[];
};
export type CoordinateFrame = { id: FrameId; parent?: FrameId; transform: Transform };

export const identityTransform = (): Transform => ({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
});
export const addVectors = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
export const subtractVectors = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

type Matrix = readonly number[];
const mul = (a: Matrix, b: Matrix): Matrix =>
  Array.from({ length: 9 }, (_, i) =>
    [0, 1, 2].reduce((s, k) => s + a[((i / 3) | 0) * 3 + k] * b[k * 3 + (i % 3)], 0),
  );
const rot = (r: Rotation): Matrix => {
  const cx = Math.cos(r.x),
    sx = Math.sin(r.x),
    cy = Math.cos(r.y),
    sy = Math.sin(r.y),
    cz = Math.cos(r.z),
    sz = Math.sin(r.z);
  return [
    cz * cy,
    cz * sy * sx - sz * cx,
    cz * sy * cx + sz * sx,
    sz * cy,
    sz * sy * sx + cz * cx,
    sz * sy * cx - cz * sx,
    -sy,
    cy * sx,
    cy * cx,
  ];
};
const matrixOf = (t: Transform): Matrix => t.basis ?? rot(t.rotation);
const rotate = (p: Point3, m: Matrix): Point3 => ({
  x: m[0] * p.x + m[1] * p.y + m[2] * p.z,
  y: m[3] * p.x + m[4] * p.y + m[5] * p.z,
  z: m[6] * p.x + m[7] * p.y + m[8] * p.z,
});
export function applyTransform(point: Point3, transform: Transform): Point3 {
  return addVectors(rotate(point, matrixOf(transform)), transform.position);
}
export function composeTransforms(parent: Transform, child: Transform): Transform {
  const basis = mul(matrixOf(parent), matrixOf(child));
  const position = applyTransform(child.position, parent);
  // Euler values are retained as a readable legacy view; basis is authoritative for composition.
  return { position, rotation: { x: 0, y: 0, z: 0 }, basis };
}

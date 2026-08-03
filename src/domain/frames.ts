import type { Angle, Length } from "./units";

export type Point3 = { x: Length; y: Length; z: Length };
export type Vector3 = Point3;
export type Transform = { position: Point3; rotation: { x: Angle; y: Angle; z: Angle } };
export type CoordinateFrame = { id: string; parent?: string; transform: Transform };

export const identityTransform = (): Transform => ({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
});

export const addVectors = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const subtractVectors = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

export function applyTransform(point: Point3, transform: Transform): Point3 {
  const { x: rx, y: ry, z: rz } = transform.rotation;
  let x = point.x;
  let y = point.y;
  let z = point.z;

  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  [x, z] = [x * cosY + z * sinY, -x * sinY + z * cosY];
  const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
  [x, y] = [x * cosZ - y * sinZ, x * sinZ + y * cosZ];

  return addVectors({ x, y, z }, transform.position);
}

export function composeTransforms(parent: Transform, child: Transform): Transform {
  return {
    position: applyTransform(child.position, parent),
    rotation: {
      x: parent.rotation.x + child.rotation.x,
      y: parent.rotation.y + child.rotation.y,
      z: parent.rotation.z + child.rotation.z,
    },
  };
}

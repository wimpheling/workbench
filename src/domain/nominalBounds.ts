import { applyTransform, type Point3, type Transform } from "./frames";

/** An axis-aligned bounding box in the coordinate frame in which it is declared. */
export type NominalBounds = Readonly<{ min: Point3; max: Point3 }>;

const cornersOf = (bounds: NominalBounds): readonly Point3[] =>
  ([bounds.min.x, bounds.max.x] as const).flatMap((x) =>
    ([bounds.min.y, bounds.max.y] as const).flatMap((y) =>
      ([bounds.min.z, bounds.max.z] as const).map((z) => ({ x, y, z })),
    ),
  );

/**
 * Converts a local nominal AABB into its enclosing world-space AABB.
 *
 * All eight corners are transformed, rather than assuming an axis-aligned
 * placement.  This keeps the calculation correct for arbitrary member and
 * leaf orientations, including reflected bases used by the right-hand door.
 */
export const transformedNominalBounds = (
  nominalBounds: NominalBounds,
  transform: Transform,
): NominalBounds => {
  const corners = cornersOf(nominalBounds).map((corner) => applyTransform(corner, transform));
  return {
    min: {
      x: Math.min(...corners.map((corner) => corner.x)),
      y: Math.min(...corners.map((corner) => corner.y)),
      z: Math.min(...corners.map((corner) => corner.z)),
    },
    max: {
      x: Math.max(...corners.map((corner) => corner.x)),
      y: Math.max(...corners.map((corner) => corner.y)),
      z: Math.max(...corners.map((corner) => corner.z)),
    },
  };
};

/** Returns the local AABB of a rectangular nominal part centred at its origin. */
export const centeredNominalBounds = (size: Point3): NominalBounds => ({
  min: { x: -size.x / 2, y: -size.y / 2, z: -size.z / 2 },
  max: { x: size.x / 2, y: size.y / 2, z: size.z / 2 },
});

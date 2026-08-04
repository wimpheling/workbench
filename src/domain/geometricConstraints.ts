/**
 * Deterministic, post-evaluation geometric constraints.
 *
 * This module deliberately evaluates a supplied design; it never changes a
 * point, vector, or scalar in an attempt to find a solution. A future solver
 * can consume the same constraint records without making rendering responsible
 * for design decisions.
 */

export type GeometricPoint = Readonly<{ x: number; y: number; z: number }>;
export type GeometricVector = GeometricPoint;

/** A named domain feature involved in a constraint, for diagnostics and UI. */
export type GeometricConstraintEntity = Readonly<{
  id: string;
  description: string;
}>;

type ConstraintMetadata = Readonly<{
  /** Stable, human-readable identifier, for example `frame.left-post.top-joint`. */
  id: string;
  /** Human-readable statement of the intended relationship. */
  description: string;
  /** Named domain features involved in the relationship. */
  entities: readonly GeometricConstraintEntity[];
  /** Permitted residual in the unit appropriate to this constraint. */
  tolerance: number;
}>;

export type PointCoincidenceConstraint = ConstraintMetadata &
  Readonly<{
    kind: "point-coincidence";
    first: GeometricPoint;
    second: GeometricPoint;
  }>;

export type ParallelConstraint = ConstraintMetadata &
  Readonly<{
    kind: "parallel";
    first: GeometricVector;
    second: GeometricVector;
  }>;

export type PerpendicularConstraint = ConstraintMetadata &
  Readonly<{
    kind: "perpendicular";
    first: GeometricVector;
    second: GeometricVector;
  }>;

export type ScalarEqualityConstraint = ConstraintMetadata &
  Readonly<{
    kind: "scalar-equality";
    actual: number;
    expected: number;
  }>;

export type ScalarMinimumConstraint = ConstraintMetadata &
  Readonly<{
    kind: "scalar-minimum";
    actual: number;
    minimum: number;
  }>;

export type GeometricConstraint =
  | PointCoincidenceConstraint
  | ParallelConstraint
  | PerpendicularConstraint
  | ScalarEqualityConstraint
  | ScalarMinimumConstraint;

export type GeometricConstraintEvaluation = Readonly<{
  constraint: Readonly<{
    id: string;
    description: string;
    entities: readonly GeometricConstraintEntity[];
  }>;
  kind: GeometricConstraint["kind"];
  status: "satisfied" | "violated";
  /** False only when the constraint input itself could not be evaluated. */
  inputValid: boolean;
  /** Magnitude of the unsatisfied relationship, after direction is accounted for. */
  residual: number | null;
  /** Tolerance compared with `residual`; null for invalid input. */
  tolerance: number | null;
  /** Observed value: distance for points, angle in radians for vectors, scalar otherwise. */
  measured: number | null;
  /** Target value: zero / pi/2 angle, requested scalar, or lower scalar bound. */
  expected: number | null;
  message: string;
}>;

const pointIsFinite = (point: GeometricPoint): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);

const magnitude = (vector: GeometricVector): number => Math.hypot(vector.x, vector.y, vector.z);

const dot = (first: GeometricVector, second: GeometricVector): number =>
  first.x * second.x + first.y * second.y + first.z * second.z;

const distance = (first: GeometricPoint, second: GeometricPoint): number =>
  Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);

const metadataIsValid = (constraint: GeometricConstraint): boolean =>
  constraint.id.trim().length > 0 &&
  constraint.description.trim().length > 0 &&
  constraint.entities.length > 0 &&
  constraint.entities.every(
    (entity) => entity.id.trim().length > 0 && entity.description.trim().length > 0,
  ) &&
  Number.isFinite(constraint.tolerance) &&
  constraint.tolerance >= 0;

const referenceOf = (constraint: GeometricConstraint) =>
  Object.freeze({
    id: constraint.id,
    description: constraint.description,
    entities: Object.freeze(
      constraint.entities.map((entity) =>
        Object.freeze({ id: entity.id, description: entity.description }),
      ),
    ),
  });

const invalid = (constraint: GeometricConstraint, reason: string): GeometricConstraintEvaluation =>
  Object.freeze({
    constraint: referenceOf(constraint),
    kind: constraint.kind,
    status: "violated",
    inputValid: false,
    residual: null,
    tolerance: null,
    measured: null,
    expected: null,
    message: `${constraint.id}: cannot evaluate constraint: ${reason}`,
  });

const evaluated = (
  constraint: GeometricConstraint,
  measured: number,
  expected: number,
  residual: number,
): GeometricConstraintEvaluation => {
  const status = residual <= constraint.tolerance ? "satisfied" : "violated";
  return Object.freeze({
    constraint: referenceOf(constraint),
    kind: constraint.kind,
    status,
    inputValid: true,
    residual,
    tolerance: constraint.tolerance,
    measured,
    expected,
    message: `${constraint.id}: ${constraint.description}; measured ${measured}, expected ${expected}, residual ${residual}, tolerance ${constraint.tolerance}`,
  });
};

const angleBetween = (first: GeometricVector, second: GeometricVector): number => {
  const cosine = dot(first, second) / (magnitude(first) * magnitude(second));
  // Floating-point error may otherwise make acos return NaN for parallel vectors.
  return Math.acos(Math.max(-1, Math.min(1, cosine)));
};

/**
 * Evaluates one constraint without solving or mutating its input.
 *
 * Point residuals use the point unit (millimetres in EnclosureV2); vector
 * residuals use radians; scalar residuals use the caller's declared unit.
 */
export const evaluateGeometricConstraint = (
  constraint: GeometricConstraint,
): GeometricConstraintEvaluation => {
  if (!metadataIsValid(constraint)) {
    return invalid(
      constraint,
      "id, description, at least one named entity, and a finite non-negative tolerance are required",
    );
  }

  switch (constraint.kind) {
    case "point-coincidence": {
      if (!pointIsFinite(constraint.first) || !pointIsFinite(constraint.second)) {
        return invalid(constraint, "points must have finite x, y, and z coordinates");
      }
      const measured = distance(constraint.first, constraint.second);
      return evaluated(constraint, measured, 0, measured);
    }
    case "parallel": {
      if (!pointIsFinite(constraint.first) || !pointIsFinite(constraint.second)) {
        return invalid(constraint, "vectors must have finite x, y, and z components");
      }
      if (magnitude(constraint.first) === 0 || magnitude(constraint.second) === 0) {
        return invalid(constraint, "parallel vectors must have non-zero magnitude");
      }
      const measured = angleBetween(constraint.first, constraint.second);
      return evaluated(constraint, measured, 0, Math.min(measured, Math.PI - measured));
    }
    case "perpendicular": {
      if (!pointIsFinite(constraint.first) || !pointIsFinite(constraint.second)) {
        return invalid(constraint, "vectors must have finite x, y, and z components");
      }
      if (magnitude(constraint.first) === 0 || magnitude(constraint.second) === 0) {
        return invalid(constraint, "perpendicular vectors must have non-zero magnitude");
      }
      const measured = angleBetween(constraint.first, constraint.second);
      return evaluated(constraint, measured, Math.PI / 2, Math.abs(Math.PI / 2 - measured));
    }
    case "scalar-equality": {
      if (!Number.isFinite(constraint.actual) || !Number.isFinite(constraint.expected)) {
        return invalid(constraint, "actual and expected scalars must be finite");
      }
      return evaluated(
        constraint,
        constraint.actual,
        constraint.expected,
        Math.abs(constraint.actual - constraint.expected),
      );
    }
    case "scalar-minimum": {
      if (!Number.isFinite(constraint.actual) || !Number.isFinite(constraint.minimum)) {
        return invalid(constraint, "actual and minimum scalars must be finite");
      }
      return evaluated(
        constraint,
        constraint.actual,
        constraint.minimum,
        Math.max(0, constraint.minimum - constraint.actual),
      );
    }
  }
};

/** Evaluates constraints in input order, preserving a deterministic diagnostic order. */
export const evaluateGeometricConstraints = (
  constraints: readonly GeometricConstraint[],
): readonly GeometricConstraintEvaluation[] =>
  Object.freeze(constraints.map((constraint) => evaluateGeometricConstraint(constraint)));

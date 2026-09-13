import { describe, expect, it } from "vitest";
import {
  evaluateGeometricConstraint,
  evaluateGeometricConstraints,
  type GeometricConstraint,
} from "./geometricConstraints";

const entities = [
  { id: "member:left-post", description: "Left front post" },
  { id: "member:top-rail", description: "Top front rail" },
] as const;

const base = {
  id: "frame.left-post.top-joint",
  description: "The left post end meets the top rail underside",
  entities,
  tolerance: 0.01,
} as const;

describe("geometric constraint evaluation", () => {
  it("evaluates point coincidence with an explicit length residual", () => {
    const result = evaluateGeometricConstraint({
      ...base,
      kind: "point-coincidence",
      first: { x: 10, y: 20, z: 30 },
      second: { x: 10, y: 20.006, z: 30 },
    });

    expect(result).toMatchObject({
      status: "satisfied",
      inputValid: true,
      expected: 0,
      tolerance: 0.01,
    });
    expect(result.measured).toBeCloseTo(0.006);
    expect(result.residual).toBeCloseTo(0.006);
    expect(result.constraint).toEqual({
      id: base.id,
      description: base.description,
      entities,
    });
  });

  it("makes anti-parallel vectors parallel and reports angles in radians", () => {
    const result = evaluateGeometricConstraint({
      ...base,
      kind: "parallel",
      first: { x: 1, y: 0, z: 0 },
      second: { x: -5, y: 0, z: 0 },
      tolerance: 1e-8,
    });

    expect(result.status).toBe("satisfied");
    expect(result.measured).toBeCloseTo(Math.PI);
    expect(result.residual).toBeCloseTo(0);
    expect(result.expected).toBe(0);
  });

  it("reports a perpendicular violation as its angular residual", () => {
    const result = evaluateGeometricConstraint({
      ...base,
      kind: "perpendicular",
      first: { x: 1, y: 0, z: 0 },
      second: { x: 1, y: 1, z: 0 },
      tolerance: 0.1,
    });

    expect(result).toMatchObject({ status: "violated", expected: Math.PI / 2 });
    expect(result.measured).toBeCloseTo(Math.PI / 4);
    expect(result.residual).toBeCloseTo(Math.PI / 4);
  });

  it("checks scalar equality and a minimum without changing supplied values", () => {
    const equality = {
      ...base,
      kind: "scalar-equality" as const,
      actual: 29.98,
      expected: 30,
      tolerance: 0.01,
    };
    const minimum = {
      ...base,
      id: "access.board-width",
      kind: "scalar-minimum" as const,
      actual: 797,
      minimum: 800,
      tolerance: 1,
    };
    const original = structuredClone({ equality, minimum });

    const equalityResult = evaluateGeometricConstraint(equality);
    expect(equalityResult).toMatchObject({
      status: "violated",
      measured: 29.98,
      expected: 30,
    });
    expect(equalityResult.residual).toBeCloseTo(0.02);
    expect(evaluateGeometricConstraint(minimum)).toMatchObject({
      status: "violated",
      measured: 797,
      expected: 800,
      residual: 3,
    });
    expect({ equality, minimum }).toEqual(original);
  });

  it("accepts values above a scalar minimum and does not count surplus as residual", () => {
    const result = evaluateGeometricConstraint({
      ...base,
      kind: "scalar-minimum",
      actual: 803,
      minimum: 800,
    });

    expect(result).toMatchObject({
      status: "satisfied",
      residual: 0,
      measured: 803,
      expected: 800,
    });
  });

  it("returns structured violations for degenerate or non-finite geometry", () => {
    const zeroVector = evaluateGeometricConstraint({
      ...base,
      kind: "parallel",
      first: { x: 0, y: 0, z: 0 },
      second: { x: 1, y: 0, z: 0 },
    });
    const invalidScalar = evaluateGeometricConstraint({
      ...base,
      kind: "scalar-equality",
      actual: Number.NaN,
      expected: 3,
    });

    expect(zeroVector).toMatchObject({
      status: "violated",
      inputValid: false,
      residual: null,
      tolerance: null,
    });
    expect(zeroVector.message).toContain("non-zero magnitude");
    expect(invalidScalar).toMatchObject({ status: "violated", inputValid: false, measured: null });
  });

  it("rejects malformed human-readable metadata and invalid tolerances", () => {
    const result = evaluateGeometricConstraint({
      ...base,
      id: " ",
      description: "",
      entities: [],
      tolerance: -0.01,
      kind: "scalar-equality",
      actual: 1,
      expected: 1,
    });

    expect(result).toMatchObject({ status: "violated", inputValid: false });
    expect(result.message).toContain("id, description");
  });

  it("evaluates a collection deterministically in the caller's order", () => {
    const constraints: readonly GeometricConstraint[] = [
      { ...base, id: "first", kind: "scalar-equality", actual: 1, expected: 1 },
      { ...base, id: "second", kind: "scalar-minimum", actual: 0, minimum: 1 },
    ];

    expect(evaluateGeometricConstraints(constraints).map((result) => result.constraint.id)).toEqual(
      ["first", "second"],
    );
  });
});

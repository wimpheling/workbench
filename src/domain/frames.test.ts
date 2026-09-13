import { describe, expect, it } from "vitest";
import {
  addVectors,
  applyTransform,
  composeTransforms,
  identityTransform,
  subtractVectors,
} from "./frames";

describe("coordinate frames and transforms", () => {
  it("applies translation and right-handed XYZ rotation", () => {
    const result = applyTransform(
      { x: 10, y: 20, z: 30 },
      { position: { x: 1, y: 2, z: 3 }, rotation: { x: 0, y: 0, z: Math.PI / 2 } },
    );
    expect(result.x).toBeCloseTo(-19);
    expect(result.y).toBeCloseTo(12);
    expect(result.z).toBeCloseTo(33);
  });
  it("composes transforms and exposes vector helpers", () => {
    const translated = composeTransforms(
      { position: { x: 10, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 0, y: 5, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
    );
    expect(translated.position).toEqual({ x: 10, y: 5, z: 0 });
    expect(addVectors({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toEqual({ x: 5, y: 7, z: 9 });
    expect(subtractVectors({ x: 4, y: 5, z: 6 }, { x: 1, y: 2, z: 3 })).toEqual({
      x: 3,
      y: 3,
      z: 3,
    });
    expect(identityTransform()).toEqual({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    });
  });
  it("composes non-commuting rotations as rotations, not Euler component sums", () => {
    const x = { position: { x: 0, y: 0, z: 0 }, rotation: { x: Math.PI / 2, y: 0, z: 0 } };
    const y = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } };
    expect(applyTransform({ x: 0, y: 1, z: 0 }, composeTransforms(x, y))).toEqual({
      x: 0,
      y: expect.closeTo(0),
      z: expect.closeTo(1),
    });
    expect(applyTransform({ x: 0, y: 1, z: 0 }, composeTransforms(y, x))).toEqual({
      x: expect.closeTo(1),
      y: expect.closeTo(0),
      z: expect.closeTo(0),
    });
  });
  it("supports radians and parent-local translation", () => {
    const parent = { position: { x: 10, y: 20, z: 30 }, rotation: { x: 0, y: 0, z: Math.PI / 2 } };
    expect(
      composeTransforms(parent, { position: { x: 2, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } })
        .position,
    ).toEqual({ x: 10, y: 22, z: 30 });
  });
});

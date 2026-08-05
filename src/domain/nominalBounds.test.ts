import { describe, expect, it } from "vitest";
import { centeredNominalBounds, transformedNominalBounds } from "./nominalBounds";

describe("transformed nominal bounds", () => {
  it("encloses every transformed corner rather than assuming world-aligned placement", () => {
    const bounds = transformedNominalBounds(
      { min: { x: 0, y: 0, z: 0 }, max: { x: 20, y: 10, z: 4 } },
      { position: { x: 10, y: 20, z: 30 }, rotation: { x: 0, y: 0, z: Math.PI / 2 } },
    );

    expect(bounds.min).toMatchObject({ z: 30 });
    expect(bounds.max).toMatchObject({ z: 34 });
    expect(bounds.min.x).toBeCloseTo(0);
    expect(bounds.max.x).toBeCloseTo(10);
    expect(bounds.min.y).toBeCloseTo(20);
    expect(bounds.max.y).toBeCloseTo(40);
  });

  it("supports a reflected transform, as used by the closed right-hand leaf", () => {
    const bounds = transformedNominalBounds(centeredNominalBounds({ x: 20, y: 10, z: 4 }), {
      position: { x: 100, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      basis: [-1, 0, 0, 0, 1, 0, 0, 0, 1],
    });

    expect(bounds).toEqual({ min: { x: 90, y: -5, z: -2 }, max: { x: 110, y: 5, z: 2 } });
  });
});

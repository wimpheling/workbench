import { measureVolume } from "replicad";
import { describe, expect, it, beforeAll } from "vitest";
import { initializeOpenCascade } from "./enclosureScene";
import { createProfileSolid } from "./profileSolid";

const dimensions = (solid: ReturnType<typeof createProfileSolid>) => {
  const [min, max] = solid.boundingBox.bounds;
  return {
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
  };
};

describe("centred T-slot profile solids", () => {
  beforeAll(async () => {
    await initializeOpenCascade();
  });

  it.each([
    ["profile:aluminium-3030", 120, 30, 30],
    ["profile:aluminium-3060", 120, 60, 30],
  ] as const)(
    "uses X length and the declared Y/Z section for %s",
    (profile, length, width, depth) => {
      const result = dimensions(createProfileSolid(length, profile));
      expect(result.size[0]).toBeCloseTo(length);
      expect(result.size[1]).toBeCloseTo(width);
      expect(result.size[2]).toBeCloseTo(depth);
      expect(result.center[0]).toBeCloseTo(0);
      expect(result.center[1]).toBeCloseTo(0);
      expect(result.center[2]).toBeCloseTo(0);
    },
  );

  it.each(["profile:aluminium-3030", "profile:aluminium-3060"] as const)(
    "%s retains the legacy slot relief rather than becoming a plain box",
    (profile) => {
      const solid = createProfileSolid(100, profile);
      const { size } = dimensions(solid);
      expect(measureVolume(solid)).toBeLessThan(size[0] * size[1] * size[2]);
    },
  );

  it("rejects non-positive cut lengths", () => {
    expect(() => createProfileSolid(0, "profile:aluminium-3030")).toThrow(/positive finite/);
  });
});

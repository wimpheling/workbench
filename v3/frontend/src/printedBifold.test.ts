import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import cases from "./printedBifold.fixture.json";
import { poseTransform, type MotionDoor } from "./motion";

// Fixture generated from core.build_model/pose_model: both leaves and carriage,
// both walls, five fractions. Keeps the HTTP/client motion contract executable.
describe("revision C backend/browser pose parity", () => {
  for (const sample of cases) {
    it(sample.door.id + ":" + sample.leaf + ":" + sample.fraction, () => {
      const transform = poseTransform(
        { motion_leaf: sample.leaf as "a" | "b" | "slider" },
        sample.door as MotionDoor,
        sample.fraction,
      );
      const actual = new Vector3(...sample.closed)
        .applyMatrix4(transform)
        .toArray();
      actual.forEach((v, i) => expect(v).toBeCloseTo(sample.expected[i], 7));
    });
  }
});

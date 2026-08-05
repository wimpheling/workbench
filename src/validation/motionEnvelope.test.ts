import { describe, expect, it } from "vitest";
import { defaultDoorMotion } from "./kinematics";
import { sampleMotionEnvelope } from "./motionEnvelope";

describe("motion envelopes", () => {
  it("refines a narrow collision between uniform samples", () => {
    const result = sampleMotionEnvelope(
      defaultDoorMotion("anchor:left-hinge"),
      (value) => (Math.abs(value - Math.PI / 4) < 0.04 ? -1 : 2),
      { samples: 3, minimumClearance: 0, maxRefinements: 4 },
    );
    expect(result.status).toBe("collision");
    expect(result.minimum.value).toBeCloseTo(Math.PI / 4, 2);
    expect(result.verified).toBe(true);
  });
});

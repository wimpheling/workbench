import { describe, expect, it } from "vitest";
import { defaultDoorMotion, evaluateMotions, rotateAround } from "./kinematics";

describe("kinematics", () => {
  it("clamps and reports motion values outside limits", () => {
    const result = evaluateMotions([defaultDoorMotion("anchor:left-hinge")], {
      "left-door-angle": 2,
    });
    expect(result.issues).toHaveLength(1);
    expect(result.state.values["left-door-angle"]).toBe(Math.PI / 2);
  });
  it("evaluates a revolute point deterministically", () => {
    expect(
      rotateAround({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, Math.PI / 2).x,
    ).toBeCloseTo(0);
  });
});

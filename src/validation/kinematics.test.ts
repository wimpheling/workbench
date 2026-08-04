import { describe, expect, it } from "vitest";
import { defaultDoorMotion, evaluateMotions, motionPosition, rotateAround } from "./kinematics";

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
  it("evaluates a prismatic motion along its normalized axis", () => {
    const motion = {
      kind: "prismatic" as const,
      axis: { x: 2, y: 0, z: 0 },
      origin: "anchor:slider",
      min: 0,
      max: 100,
    };
    const result = evaluateMotions([{ id: "slider.travel", motion }], { "slider.travel": 25 });
    expect(result.issues).toHaveLength(0);
    expect(
      motionPosition(motion, result.state.values["slider.travel"]!, { x: 1, y: 2, z: 3 }),
    ).toEqual({
      x: 26,
      y: 2,
      z: 3,
    });
  });
});

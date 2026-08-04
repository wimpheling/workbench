import { describe, expect, it } from "vitest";
import { boxJoint, buttJoint, connectionHardware, validateConnection } from "./connections";

describe("connections", () => {
  it("reports malformed box joints", () => {
    expect(
      validateConnection({ id: "c", parts: ["a", "b"], joint: boxJoint("a", "b", "front", 0, 1) }),
    ).toHaveLength(1);
  });
  it("groups hardware quantities", () => {
    expect(
      connectionHardware([
        {
          id: "a",
          parts: ["x", "y"],
          hardware: [{ id: "bolt", specification: "M6", quantity: 2 }],
        },
        {
          id: "b",
          parts: ["y", "z"],
          hardware: [{ id: "bolt", specification: "M6", quantity: 3 }],
        },
      ])[0].quantity,
    ).toBe(5);
  });
  it("validates explicit structural butt-joint members and parameters", () => {
    const valid = {
      id: "joint:left-post-bottom",
      parts: ["part:left-post", "part:bottom-rail"],
      joint: buttJoint("part:left-post", "part:bottom-rail", "start", "top", 900, 0.1),
    };
    expect(validateConnection(valid)).toEqual([]);

    const malformed = {
      ...valid,
      joint: buttJoint("part:missing-post", "part:bottom-rail", "start", "top", 0, -0.1),
    };
    expect(validateConnection(malformed).map((issue) => issue.id)).toEqual([
      "joint:left-post-bottom.butt-members",
      "joint:left-post-bottom.butt-parameters",
    ]);
  });
});

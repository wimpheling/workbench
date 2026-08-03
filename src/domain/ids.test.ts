import { describe, expect, it } from "vitest";
import { featureId, partId, parameterId, stableId } from "./ids";

describe("stable IDs", () => {
  it("creates deterministic namespaced IDs", () => {
    expect(stableId("part", "front-top")).toBe("part:front-top");
    expect(partId("front-top")).toBe("part:front-top");
    expect(featureId("frame")).toBe("feature:frame");
    expect(parameterId("width")).toBe("parameter:width");
    expect(stableId("part", "front-top")).toBe(stableId("part", "front-top"));
  });
});

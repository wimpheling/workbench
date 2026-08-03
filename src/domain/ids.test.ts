import { describe, expect, it } from "vitest";
import {
  catalogId,
  featureId,
  frameId,
  materialId,
  partId,
  parameterId,
  profileId,
  projectId,
  stableId,
} from "./ids";
describe("stable IDs", () => {
  it("creates deterministic namespaced IDs", () => {
    expect(stableId("part", "front-top")).toBe("part:front-top");
    expect(partId("front-top")).toBe("part:front-top");
    expect(featureId("frame")).toBe("feature:frame");
    expect(parameterId("width")).toBe("parameter:width");
    expect(projectId("demo")).toBe("project:demo");
    expect(frameId("root")).toBe("frame:root");
    expect(profileId("aluminium-3030")).toBe("profile:aluminium-3030");
    expect(materialId("wood")).toBe("material:wood");
    expect(catalogId("default")).toBe("catalog:default");
  });
  it("rejects malformed IDs", () => {
    expect(() => projectId(" ")).toThrow();
    expect(() => frameId("a:b")).toThrow();
  });
});

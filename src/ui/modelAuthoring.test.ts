import { describe, expect, it } from "vitest";
import {
  defaultDimensions,
  dimensionsFromParameters,
  modelRevision,
  regenerateModel,
  updateDimension,
} from "./modelAuthoring";

describe("model authoring", () => {
  it("accepts positive edits and rejects invalid values", () => {
    expect(updateDimension(defaultDimensions, "width", "140")?.width).toBe(140);
    expect(updateDimension(defaultDimensions, "width", "0")).toBeUndefined();
    expect(dimensionsFromParameters({ width: 140, height: 100, depth: 80 }).width).toBe(140);
  });
  it("regenerates deterministically and changes topology dimensions", () => {
    const first = regenerateModel(defaultDimensions);
    const second = regenerateModel(defaultDimensions);
    expect(modelRevision(defaultDimensions)).toBe(modelRevision(defaultDimensions));
    expect(first.model.members.map((member) => member.id)).toEqual(
      second.model.members.map((member) => member.id),
    );
    expect(regenerateModel({ ...defaultDimensions, width: 140 }).model.dimensions?.x).toBe(140);
  });
});

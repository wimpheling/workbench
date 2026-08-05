import { describe, expect, it } from "vitest";
import {
  defaultEnclosureV2VariablesForAuthoring,
  dimensionsFromParameters,
  modelRevision,
  regenerateModel,
  updateVariable,
  variablesFromParameters,
} from "./modelAuthoring";

describe("model authoring", () => {
  it("accepts positive edits and rejects invalid values", () => {
    expect(
      updateVariable(defaultEnclosureV2VariablesForAuthoring, "innerClearWidthMm", "140")
        ?.innerClearWidthMm,
    ).toBe(140);
    expect(
      updateVariable(defaultEnclosureV2VariablesForAuthoring, "frontDoorCentreGapMm", "0"),
    ).toBeUndefined();
    expect(dimensionsFromParameters({ width: 140, height: 100, depth: 80 }).width).toBe(140);
    expect(variablesFromParameters({ frontDoorCentreGapMm: 5 }).frontDoorCentreGapMm).toBe(5);
  });
  it("regenerates deterministically and changes topology dimensions", () => {
    const first = regenerateModel(defaultEnclosureV2VariablesForAuthoring);
    const second = regenerateModel(defaultEnclosureV2VariablesForAuthoring);
    expect(modelRevision(defaultEnclosureV2VariablesForAuthoring)).toBe(
      modelRevision(defaultEnclosureV2VariablesForAuthoring),
    );
    expect(first.model.members.map((member) => member.id)).toEqual(
      second.model.members.map((member) => member.id),
    );
    expect(
      regenerateModel({ ...defaultEnclosureV2VariablesForAuthoring, innerClearWidthMm: 140 }).model
        .dimensions?.x,
    ).toBe(140);
  });
  it("keeps the documented legacy enclosure envelope in millimetres", () => {
    expect(defaultEnclosureV2VariablesForAuthoring).toMatchObject({
      innerClearWidthMm: 1674,
      innerClearHeightMm: 740,
      innerClearDepthMm: 1649,
    });
    expect(regenerateModel(defaultEnclosureV2VariablesForAuthoring).model.dimensions).toEqual({
      x: 1674,
      y: 740,
      z: 1649,
    });
  });
  it("regenerates from the authored door-clearance variables", () => {
    const model = regenerateModel({
      ...defaultEnclosureV2VariablesForAuthoring,
      frontDoorCentreGapMm: 5,
    }).model;
    expect(model.designInput.frontDoorCentreGapMm).toBe(5);
    expect(model.doorSeamClearance).toBe(5);
  });
});

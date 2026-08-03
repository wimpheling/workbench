import { describe, expect, it } from "vitest";
import {
  PositiveLength,
  Equal,
  CenteredOn,
  Between,
  Coincident,
  Parallel,
  Perpendicular,
  Distance,
  FitsWithin,
  ClearanceAtLeast,
  SymmetricAbout,
  SupportedBy,
  validateModel,
} from "./constraints";
import { makeEnclosureV2 } from "../domain/enclosureV2";

describe("deterministic constraints", () => {
  it("reports useful measured and expected diagnostics", () => {
    const result = Equal("door-widths", 40, 41, ["left-door", "right-door"]);
    expect(result).toMatchObject({
      id: "door-widths",
      passed: false,
      measured: 1,
      expected: 0,
      severity: "error",
    });
    expect(result.message).toContain("1");
  });
  it("supports geometric relationship checks", () => {
    const x = { x: 1, y: 0, z: 0 },
      y = { x: 0, y: 1, z: 0 };
    expect(PositiveLength("len", 2).passed).toBe(true);
    expect(CenteredOn("center", 5, 0, 10).passed).toBe(true);
    expect(Between("between", 5, 0, 10).passed).toBe(true);
    expect(Coincident("coincident", x, x).passed).toBe(true);
    expect(Parallel("parallel", x, { x: 2, y: 0, z: 0 }).passed).toBe(true);
    expect(Perpendicular("perpendicular", x, y).passed).toBe(true);
    expect(Distance("distance", x, y, Math.sqrt(2)).passed).toBe(true);
    expect(FitsWithin("fit", { x: 8, y: 9, z: 10 }, { x: 10, y: 10, z: 10 }).passed).toBe(true);
    expect(ClearanceAtLeast("clearance", 3, 2).passed).toBe(true);
    expect(SymmetricAbout("symmetric", 2, 8, 5).passed).toBe(true);
    expect(
      SupportedBy("supported", { x: 5, y: 0, z: 0 }, [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
      ]).passed,
    ).toBe(true);
  });
  it("validates EnclosureV2 relationships and catches changed parameters", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    expect(validateModel(model).every((r) => r.passed)).toBe(true);
    const changed = {
      ...model,
      members: model.members.map((m) =>
        String(m.id).endsWith(":front-top")
          ? { ...m, profile: "profile:aluminium-3030" as typeof m.profile }
          : m,
      ),
    };
    expect(
      validateModel(changed).find((r) => r.id === "enclosure.front.front-top.profile")?.passed,
    ).toBe(false);
  });
});

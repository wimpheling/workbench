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

  it("uses canonical x dimensions when checking undersized doors", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const undersized = {
      ...model,
      doors: [
        { id: "left-door", nominalWidth: 50 },
        { id: "right-door", nominalWidth: 50 },
      ],
    };
    const failure = validateModel(undersized).find((r) => r.id === "enclosure.doors.cover-opening");
    expect(failure).toMatchObject({ passed: false, measured: 100, expected: 120 });
  });

  it("validates side-middle supports against the model depth midpoint", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const anchors = {
      ...model.anchors,
      "anchor:side-middle-left-bottom": {
        ...model.anchors["anchor:side-middle-left-bottom"],
        position: { x: 0, y: 0, z: -30 },
      },
    };
    const failure = validateModel({ ...model, anchors }).find(
      (r) => r.id === "enclosure.part:side-middle-left.depth-midpoint",
    );
    expect(failure).toMatchObject({ passed: false, measured: -35, expected: -40 });
  });

  it("reports missing required front members and profile violations", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const missing = validateModel({
      ...model,
      members: model.members.filter((m) => !String(m.id).endsWith(":front-left-post")),
    });
    expect(missing.find((r) => r.id === "enclosure.front.front-left-post.required")).toMatchObject({
      passed: false,
    });
    const wrongProfile = validateModel({
      ...model,
      members: model.members.map((m) =>
        String(m.id).endsWith(":front-right-post")
          ? { ...m, profile: "profile:aluminium-3030" as typeof m.profile }
          : m,
      ),
    });
    expect(
      wrongProfile.find((r) => r.id === "enclosure.front.front-right-post.profile"),
    ).toMatchObject({ passed: false });
  });

  it("checks panel extents from the panel anchor in the frame", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const outside = {
      ...model,
      anchors: {
        ...model.anchors,
        "anchor:outside": {
          ...model.anchors["anchor:front-left-bottom"],
          id: "anchor:outside",
          position: { x: 110, y: 0, z: 0 },
        },
      },
      panels: [
        {
          id: "side-panel",
          size: { x: 20, y: 20, z: 2 },
          anchor: "anchor:outside",
          orientation: { wideFace: "front" as const },
        },
      ],
    };
    const failure = validateModel(outside).find((r) => r.id === "panel.side-panel.bounds");
    expect(failure).toMatchObject({ passed: false });
    expect(failure?.measured).toBeGreaterThan(0);
  });

  it("rejects panels whose anchor is negative even when their positive extent fits", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const invalid = {
      ...model,
      anchors: {
        ...model.anchors,
        "anchor:negative": {
          ...model.anchors["anchor:front-left-bottom"],
          id: "anchor:negative",
          position: { x: -1, y: 0, z: 0 },
        },
      },
      panels: [
        {
          id: "negative-panel",
          size: { x: 20, y: 20, z: 2 },
          anchor: "anchor:negative",
          orientation: { wideFace: "front" as const },
        },
      ],
    };
    expect(
      validateModel(invalid).find((r) => r.id === "panel.negative-panel.bounds"),
    ).toMatchObject({ passed: false });
  });

  it("validates panel orientation values rather than only checking presence", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const invalid = {
      ...model,
      panels: [
        {
          id: "bad-orientation",
          size: { x: 20, y: 20, z: 2 },
          anchor: "anchor:front-left-bottom",
          orientation: { wideFace: "diagonal" },
        },
      ],
    };
    const result = validateModel(invalid).find((r) => r.id === "panel.bad-orientation.orientation");
    expect(result).toMatchObject({ passed: false, severity: "error" });
  });

  it("accounts for signed panel extents for oriented faces", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const invalid = {
      ...model,
      panels: [
        {
          id: "back-panel",
          size: { x: 20, y: 20, z: 2 },
          anchor: "anchor:front-left-bottom",
          orientation: { wideFace: "back" as const },
        },
      ],
    };
    expect(validateModel(invalid).find((r) => r.id === "panel.back-panel.bounds")).toMatchObject({
      passed: false,
    });
  });

  it("reports missing dimensions without throwing", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const result = validateModel({ ...model, dimensions: undefined });
    expect(result.find((r) => r.id === "enclosure.dimensions.required")).toMatchObject({
      passed: false,
    });
  });

  it("aggregates independent validation failures", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const broken = {
      ...model,
      doors: [
        { id: "left-door", nominalWidth: 40 },
        { id: "right-door", nominalWidth: 40 },
      ],
      members: model.members.filter((m) => !String(m.id).endsWith(":front-left-post")),
      anchors: {
        ...model.anchors,
        "anchor:side-middle-left-bottom": {
          ...model.anchors["anchor:side-middle-left-bottom"],
          position: { x: 0, y: 0, z: -20 },
        },
      },
    };
    const failures = validateModel(broken)
      .filter((r) => !r.passed)
      .map((r) => r.id);
    expect(failures).toEqual(
      expect.arrayContaining([
        "enclosure.doors.cover-opening",
        "enclosure.front.front-left-post.required",
        "enclosure.part:side-middle-left.depth-midpoint",
      ]),
    );
  });
});

import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "./enclosureV2";

const historicalDimensions = { width: 1674, height: 740, depth: 1649 };

const member = (id: string) => {
  const result = makeEnclosureV2(historicalDimensions).members.find(
    (item) => item.id === `part:${id}`,
  );
  if (!result) throw new Error(`Missing member: ${id}`);
  return result;
};

describe("EnclosureV2 historical assembly parity", () => {
  it("preserves legacy profile-axis offsets and cut lengths in millimetres", () => {
    expect(member("left-bottom-rail").length).toBeCloseTo(1649);
    expect(member("left-bottom-rail").transform.position).toMatchObject({
      x: 15,
      y: 30,
      z: -854.5,
    });

    expect(member("front-bottom-rail").length).toBeCloseTo(1734);
    expect(member("front-bottom-rail").transform.position).toMatchObject({ x: 867, y: 15, z: -30 });

    expect(member("front-left-post").length).toBeCloseTo(650);
    expect(member("front-left-post").transform.position).toMatchObject({ x: 30, y: 355, z: 0 });
    expect(member("back-middle-support").length).toBeCloseTo(680);
    expect(member("back-middle-support").transform.position).toMatchObject({
      x: 867,
      y: 370,
      z: -1694,
    });
  });

  it("places door hinges on the historical front extrusion axes", () => {
    const model = makeEnclosureV2(historicalDimensions);
    expect(model.anchors["anchor:left-hinge"]?.position).toEqual({ x: 30, y: 30, z: 0 });
    expect(model.anchors["anchor:right-hinge"]?.position).toEqual({ x: 1704, y: 30, z: 0 });
  });
});

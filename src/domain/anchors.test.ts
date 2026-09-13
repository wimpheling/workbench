import { describe, expect, it } from "vitest";
import { dimensions, mm } from "./units";
import {
  anchor,
  betweenAnchors,
  midpoint,
  offsetAlong,
  orientedAlong,
  type Anchor,
} from "./anchors";

describe("semantic anchors", () => {
  const left = anchor("left", { x: 0, y: 0, z: 0 });
  const right = anchor("right", { x: 100, y: 0, z: 0 });

  it("calculates pure midpoint, offset and between helpers", () => {
    expect(midpoint(left, right).position).toEqual({ x: 50, y: 0, z: 0 });
    expect(offsetAlong(left, right, 25).position).toEqual({
      x: 25,
      y: 0,
      z: 0,
    });
    expect(betweenAnchors(left, right).length).toBe(100);
    expect(orientedAlong(left, right).axis).toEqual({ x: 1, y: 0, z: 0 });
  });

  it("supports typed anchor references", () => {
    const reference: Anchor["id"] = "anchor:left";
    expect(reference).toBe(left.id);
  });
});

describe("EnclosureV2 declarative frame", () => {
  it("exposes clear-boundary profile coordinates and derived members", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2({
      width: mm(600),
      height: mm(500),
      depth: mm(400),
    });
    expect(model.anchors["front-rail-bottom-left"].position).toEqual({
      x: -30,
      y: -15,
      z: 15,
    });
    expect(model.anchors["front-right-post-top"].position).toEqual({
      x: 600,
      y: 470,
      z: 15,
    });
    expect(model.members.find((member) => member.id === "part:front-top")?.length).toBe(660);
    expect(model.members.find((member) => member.id === "part:side-middle-left")?.length).toBe(500);
  });

  it("propagates dimension changes to rail lengths", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2(dimensions(800, 700, 450));
    expect(model.members.find((member) => member.id === "part:front-top")?.length).toBe(860);
    expect(model.members.find((member) => member.id === "part:top-back-tie")?.length).toBe(450);
  });

  it("keeps 3060 wide-face orientation explicit", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2({ width: 600, height: 500, depth: 400 });
    const member = model.members.find((item) => item.id === "part:front-top");
    expect(member?.profile).toBe("profile:aluminium-3060");
    expect(member?.orientation).toEqual({ wideFace: "front" });
    expect(member?.transform.basis).toBeDefined();
    expect(member?.transform.basis).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("keeps the clear front boundary at zero and structure outside it", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2({ width: 600, height: 500, depth: 400 });
    expect(model.anchors["anchor:left-hinge"].position.z).toBe(30);
    expect(model.anchors["back-middle-bottom"].position.z).toBe(-415);
  });

  it("uses a right-handed basis with front wide faces normal to positive Z", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2({ width: 600, height: 500, depth: 400 });
    const member = model.members.find((item) => item.id === "part:front-top");
    expect(member?.transform.basis).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("describes the complete frame with semantic endpoints", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2({ width: 600, height: 500, depth: 400 });
    expect(model.members).toHaveLength(16);
    expect(new Set(model.members.map((item) => item.id)).size).toBe(16);
    const member = (id: string) => model.members.find((item) => item.id === `part:${id}`)!;
    expect(member("side-middle-left").from).toBe("anchor:left-side-vertical-bottom");
    expect(member("side-middle-left").to).toBe("anchor:left-side-vertical-top");
    expect(member("side-middle-right").from).toBe("anchor:right-side-vertical-bottom");
    expect(member("back-middle-support").from).toBe("anchor:back-middle-bottom");
    expect(member("back-middle-support").to).toBe("anchor:back-middle-top");
    expect(member("top-back-tie").from).toBe("anchor:top-tie-front");
    expect(member("top-back-tie").to).toBe("anchor:top-tie-back");
  });

  it("rejects invalid dimensions and mixed-frame anchors", async () => {
    const { makeEnclosureV2, makeRail } = await import("./enclosureV2");
    expect(() => makeEnclosureV2({ width: 0, height: 500, depth: 400 })).toThrow(/positive/i);
    expect(() => makeEnclosureV2({ width: 600, height: -1, depth: 400 })).toThrow(/positive/i);
    const { anchor } = await import("./anchors");
    const { frameId, profileId } = await import("./ids");
    expect(() =>
      makeRail({
        from: "anchor:a",
        to: "anchor:b",
        profile: profileId("aluminium-3030"),
        anchors: {
          "anchor:a": anchor("a", { x: 0, y: 0, z: 0 }, frameId("one")),
          "anchor:b": anchor("b", { x: 1, y: 0, z: 0 }, frameId("two")),
        },
      }),
    ).toThrow(/frame/i);
  });

  it("reports missing anchor references", async () => {
    const { makeRail } = await import("./enclosureV2");
    expect(() =>
      makeRail({
        from: "anchor:missing",
        to: "anchor:right",
        profile: "profile:aluminium-3030",
        anchors: { "anchor:right": anchor("right", { x: 100, y: 0, z: 0 }) },
      }),
    ).toThrow(/missing/i);
  });

  it("exposes numeric transforms without Three.js", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2({ width: 600, height: 500, depth: 400 });
    const member = model.members.find((item) => item.id === "part:front-top");
    expect(member?.transform.position).toEqual({ x: 300, y: 500, z: 15 });
    expect(member?.transform.rotation.z).toBe(0);
  });
});

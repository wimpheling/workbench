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
    expect(offsetAlong(left, right, 25).position).toEqual({ x: 25, y: 0, z: 0 });
    expect(betweenAnchors(left, right).length).toBe(100);
    expect(orientedAlong(left, right).axis).toEqual({ x: 1, y: 0, z: 0 });
  });

  it("supports typed anchor references", () => {
    const reference: Anchor["id"] = "anchor:left";
    expect(reference).toBe(left.id);
  });
});

describe("EnclosureV2 declarative frame", () => {
  it("exposes named coordinates and derived members", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2({ width: mm(600), height: mm(500), depth: mm(400) });
    expect(model.anchors["front-left-bottom"].position).toEqual({ x: 0, y: 0, z: 0 });
    expect(model.anchors["front-right-top"].position).toEqual({ x: 600, y: 500, z: 0 });
    expect(model.members.find((member) => member.id === "part:front-top")?.length).toBe(600);
    expect(model.members.find((member) => member.id === "part:side-middle-left")?.length).toBe(400);
  });

  it("propagates dimension changes to rail lengths", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2(dimensions(800, 700, 450));
    expect(model.members.find((member) => member.id === "part:front-top")?.length).toBe(800);
    expect(model.members.find((member) => member.id === "part:top-back-tie")?.length).toBe(450);
  });

  it("keeps 3060 wide-face orientation explicit", async () => {
    const { makeEnclosureV2 } = await import("./enclosureV2");
    const model = makeEnclosureV2({ width: 600, height: 500, depth: 400 });
    const member = model.members.find((item) => item.id === "part:front-top");
    expect(member?.profile).toBe("profile:aluminium-3060");
    expect(member?.orientation).toEqual({ wideFace: "front" });
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
    expect(member?.transform.position).toEqual({ x: 300, y: 500, z: 0 });
    expect(member?.transform.rotation.z).toBe(0);
  });
});

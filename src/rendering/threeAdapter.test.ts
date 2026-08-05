import { Object3D, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { anchor, type PlacementSpec } from "../domain/anchors";
import { makeRail } from "../domain/enclosureV2";
import { profileId } from "../domain/ids";
import { applyMemberTransform, applyPlacement, applyTransform } from "./threeAdapter";

const closeToVector = (actual: Vector3, expected: Vector3) => {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
  expect(actual.z).toBeCloseTo(expected.z);
};

describe("Three.js transform adapter", () => {
  it("maps a pure domain position and Euler rotation to an Object3D", () => {
    const object = new Object3D();

    applyTransform(object, {
      position: { x: 12, y: -4, z: 8 },
      rotation: { x: Math.PI / 2, y: Math.PI / 4, z: -Math.PI / 6 },
    });

    expect(object.position.toArray()).toEqual([12, -4, 8]);
    expect(object.rotation.x).toBeCloseTo(Math.PI / 2);
    expect(object.rotation.y).toBeCloseTo(Math.PI / 4);
    expect(object.rotation.z).toBeCloseTo(-Math.PI / 6);
  });

  it("maps the authoritative domain basis so explicit wide-face orientation is preserved", () => {
    const object = new Object3D();
    const from = anchor("from", { x: 0, y: 0, z: 0 });
    const to = anchor("to", { x: 0, y: 10, z: 0 });
    const member = makeRail({
      from: from.id,
      to: to.id,
      profile: profileId("aluminium-3060"),
      anchors: { [from.id]: from, [to.id]: to },
      orientation: { wideFace: "front" },
    });

    applyMemberTransform(object, member);
    object.updateMatrixWorld();

    closeToVector(new Vector3(1, 0, 0).applyQuaternion(object.quaternion), new Vector3(0, 1, 0));
    closeToVector(new Vector3(0, 1, 0).applyQuaternion(object.quaternion), new Vector3(-1, 0, 0));
    closeToVector(new Vector3(0, 0, 1).applyQuaternion(object.quaternion), new Vector3(0, 0, 1));
    expect(object.position.toArray()).toEqual([0, 5, 0]);
  });

  it("derives and applies a placement from semantic anchors", () => {
    const object = new Object3D();
    const placement: PlacementSpec = {
      from: "anchor:start",
      to: "anchor:end",
      orientation: { wideFace: "front" },
    };
    const anchors = {
      "anchor:start": anchor("start", { x: 10, y: 20, z: 30 }),
      "anchor:end": anchor("end", { x: 30, y: 20, z: 30 }),
    };

    applyPlacement(object, placement, anchors);

    expect(object.position.toArray()).toEqual([20, 20, 30]);
    closeToVector(new Vector3(1, 0, 0).applyQuaternion(object.quaternion), new Vector3(1, 0, 0));
    closeToVector(new Vector3(0, 0, 1).applyQuaternion(object.quaternion), new Vector3(0, 0, 1));
  });
});

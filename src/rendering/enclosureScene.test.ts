import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "../domain/enclosureV2";
import { buildEnclosureScene } from "./enclosureScene";

const dimensions = { width: 120, height: 100, depth: 80 };

describe("production EnclosureV2 scene boundary", () => {
  it("adapts every declarative member into one named Three object", async () => {
    const model = makeEnclosureV2(dimensions);
    const scene = await buildEnclosureScene(dimensions);

    expect(model.members).toHaveLength(16);
    expect(scene.members).toHaveLength(model.members.length);
    expect(scene.members.map((object) => object.name)).toEqual(
      model.members.map((member) => member.id),
    );
    expect(scene.members.every((object) => object.userData.memberId)).toBe(true);
    expect(scene.members.map((object) => object.userData.memberId)).toEqual(
      model.members.map((member) => member.id),
    );
  });

  it("creates a real mesh for every member from the profile catalog", async () => {
    const scene = await buildEnclosureScene(dimensions);
    expect(scene.members.every((object) => object.type === "Mesh")).toBe(true);
    expect(scene.members.every((object) => object.userData.geometryAdapter === "replicad")).toBe(
      true,
    );
    expect(scene.members.every((object) => object.userData.solid)).toBe(true);
    expect(scene.members.every((object) => object.userData.meshVertexCount > 0)).toBe(true);
  });

  it("applies representative positions and explicit wide-face orientations", async () => {
    const model = makeEnclosureV2(dimensions);
    const scene = await buildEnclosureScene(dimensions);
    const frontTop = model.members.find((member) => member.id === "part:front-top")!;
    const frontTopObject = scene.members.find((object) => object.name === frontTop.id)!;

    expect(frontTopObject.position.toArray()).toEqual([
      frontTop.transform.position.x,
      frontTop.transform.position.y,
      frontTop.transform.position.z,
    ]);
    frontTopObject.updateMatrixWorld();
    const wideFace = new Vector3(0, 0, 1).applyQuaternion(frontTopObject.quaternion);
    expect(wideFace.x).toBeCloseTo(0);
    expect(wideFace.y).toBeCloseTo(0);
    expect(wideFace.z).toBeCloseTo(1);

    for (const [index, member] of model.members.entries()) {
      const object = scene.members[index];
      expect(object.position.toArray()).toEqual([
        member.transform.position.x,
        member.transform.position.y,
        member.transform.position.z,
      ]);
    }
  });

  it("builds each member with its span on local X, so transformed endpoints align", async () => {
    const model = makeEnclosureV2(dimensions);
    const scene = await buildEnclosureScene(dimensions);
    const member = model.members.find((item) => item.id === "part:front-top")!;
    const object = scene.members.find((item) => item.name === member.id)!;
    object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox!;
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(member.length);
    expect(bounds.max.z - bounds.min.z).toBeCloseTo(60);
    const localSpan = new Vector3(1, 0, 0).applyQuaternion(object.quaternion);
    expect(localSpan.x).toBeCloseTo(member.transform.axis!.x);
    expect(localSpan.y).toBeCloseTo(member.transform.axis!.y);
    expect(localSpan.z).toBeCloseTo(member.transform.axis!.z);
  });
});

import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "../domain/enclosureV2";
import { applyDoorPose, buildEnclosureScene, transformShapeToWorld } from "./enclosureScene";
import { makeBaseBox, type Shape3D } from "replicad";

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

  it("rend deux portes pivotées, chacune avec cinq meshes de parité legacy", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    expect(scene.members).toHaveLength(16);
    expect(scene.doors).toHaveLength(2);
    expect(scene.doors.map((door) => door.name)).toEqual(["door:left-door", "door:right-door"]);
    expect(scene.doors[0].position.toArray()).toEqual([30, 30, 0]);
    expect(scene.doors[1].position.toArray()).toEqual([1230, 30, 0]);
    for (const door of scene.doors) {
      const meshes: any[] = [];
      door.traverse((child) => {
        if (child.type === "Mesh") meshes.push(child);
      });
      expect(meshes).toHaveLength(5);
      expect(
        meshes.filter((mesh) => mesh.userData.profileId === "profile:aluminium-3030"),
      ).toHaveLength(4);
      expect(meshes.filter((mesh) => mesh.userData.partType === "door-panel")).toHaveLength(1);
    }
    const descendant = scene.doors[0].getObjectByName("left-door-panel")!;
    scene.root.updateMatrixWorld(true);
    const before = descendant.getWorldPosition(new Vector3()).clone();
    scene.doors[0].rotation.y = Math.PI / 2;
    scene.root.updateMatrixWorld(true);
    expect(descendant.getWorldPosition(new Vector3()).distanceTo(before)).toBeGreaterThan(1);
    expect(descendant.getWorldPosition(new Vector3()).z).not.toBeCloseTo(before.z);
  });

  it("expose des contrôles solides world-space et un rapport prêt à afficher", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    expect(scene.solidChecks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "clearance.door-left-door.door-right-door",
        "clearance.door-left-door.part:front-left-post",
        "clearance.door-right-door.part:front-right-post",
      ]),
    );
    expect(scene.solidChecks.every((check) => check.minimum !== undefined)).toBe(true);
    expect(scene.validationReport).toEqual(expect.objectContaining({ issues: expect.any(Array) }));
  });

  it("retourne un rapport incomplet si l'initialisation OpenCascade échoue", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 }, async () => {
      throw new Error("WASM indisponible");
    });
    expect(scene.solidChecks.every((check) => check.status === "indeterminate")).toBe(true);
    expect(scene.validationReport.status).toBe("incomplete");
  });

  it("applique la réflexion world-space du parent de la porte droite au solide", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const panel = scene.doors[1].getObjectByName("right-door-panel")!;
    const worldSolid = transformShapeToWorld(makeBaseBox(10, 10, 10) as Shape3D, panel);
    const vertices = worldSolid.mesh({ tolerance: 0.01, angularTolerance: 0.1 }).vertices;
    const maxX = Math.max(...vertices.filter((_, index) => index % 3 === 0));
    expect(scene.doors[1].scale.x).toBe(-1);
    expect(maxX).toBeLessThan(scene.doors[1].position.x);
  });

  it("applique une pose absolue aux groupes existants sans perdre pivots ni miroir", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const left = scene.doors[0];
    const right = scene.doors[1];
    const leftPosition = left.position.toArray();
    const rightPosition = right.position.toArray();
    const leftPanel = left.getObjectByName("left-door-panel")!;
    const rightPanel = right.getObjectByName("right-door-panel")!;
    applyDoorPose(scene, { "left-door.angle": Math.PI / 2, "right-door.angle": Math.PI / 2 });
    expect(left.rotation.y).toBeCloseTo(Math.PI / 2);
    expect(right.rotation.y).toBeCloseTo(Math.PI / 2);
    expect(left.position.toArray()).toEqual(leftPosition);
    expect(right.position.toArray()).toEqual(rightPosition);
    expect(right.scale.x).toBe(-1);
    expect(leftPanel).toBe(left.getObjectByName("left-door-panel"));
    expect(rightPanel).toBe(right.getObjectByName("right-door-panel"));
  });

  it("ouvre puis referme les portes en conservant les pivots et l'identité des meshes", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const doors = [...scene.doors];
    const meshes = doors.flatMap((door) => {
      const result: any[] = [];
      door.traverse((child) => child.type === "Mesh" && result.push(child));
      return result;
    });
    const pivots = doors.map((door) => door.position.toArray());
    const panelPosition = (door: (typeof doors)[number]) =>
      door
        .getObjectByName(`${door.name.slice("door:".length)}-panel`)!
        .getWorldPosition(new Vector3())
        .toArray();
    const closed = doors.map(panelPosition);

    applyDoorPose(scene, { "left-door.angle": -Math.PI / 2, "right-door.angle": Math.PI / 2 });
    expect(doors.map(panelPosition)).not.toEqual(closed);
    expect(doors.map((door) => door.position.toArray())).toEqual(pivots);

    applyDoorPose(scene, { "left-door.angle": 0, "right-door.angle": 0 });
    expect(doors.map((door) => door.position.toArray())).toEqual(pivots);
    expect(doors.map(panelPosition)).toEqual(closed);
    expect(
      doors.flatMap((door) => {
        const result: any[] = [];
        door.traverse((child) => child.type === "Mesh" && result.push(child));
        return result;
      }),
    ).toEqual(meshes);
  });

  it("avance les deux panneaux vers Z positif à l'ouverture sans déplacer les pivots", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const doors = [...scene.doors];
    const rightDoor = doors.find((door) => door.name === "door:right-door")!;
    const pivots = doors.map((door) => door.position.toArray());
    const panelPosition = (door: (typeof doors)[number]) =>
      door
        .getObjectByName(`${door.name.slice("door:".length)}-panel`)!
        .getWorldPosition(new Vector3());
    const closed = doors.map(panelPosition).map((position) => position.z);
    applyDoorPose(scene, { "left-door.angle": -Math.PI / 2, "right-door.angle": Math.PI / 2 });
    const open = doors.map(panelPosition).map((position) => position.z);
    expect(open[0]).toBeGreaterThan(closed[0]);
    expect(open[1]).toBeGreaterThan(closed[1]);
    expect(rightDoor.scale.x).toBe(-1);
    expect(doors.map((door) => door.position.toArray())).toEqual(pivots);
  });
});

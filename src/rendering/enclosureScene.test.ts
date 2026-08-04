import { Box3, Mesh, Vector3 } from "three";
import { describe, expect, it, vi } from "vitest";
import { makeEnclosureV2 } from "../domain/enclosureV2";
import type { MotionSolidCheckResult } from "../validation/motionSolidChecks";
import {
  applyAssemblyPose,
  buildEnclosureScene,
  initializeOpenCascade,
  transformShapeToWorld,
} from "./enclosureScene";
import { makeBaseBox, type Shape3D } from "replicad";

const { checkDoorMotionSolidsMock } = vi.hoisted(() => ({
  checkDoorMotionSolidsMock: vi.fn(),
}));

vi.mock("../validation/motionSolidChecks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../validation/motionSolidChecks")>();
  checkDoorMotionSolidsMock.mockImplementation(actual.checkDoorMotionSolids);
  return { ...actual, checkDoorMotionSolids: checkDoorMotionSolidsMock };
});

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
    expect(bounds.max.y - bounds.min.y).toBeCloseTo(60);
    expect(bounds.max.z - bounds.min.z).toBeCloseTo(30);
    const localSpan = new Vector3(1, 0, 0).applyQuaternion(object.quaternion);
    expect(localSpan.x).toBeCloseTo(member.transform.axis!.x);
    expect(localSpan.y).toBeCloseTo(member.transform.axis!.y);
    expect(localSpan.z).toBeCloseTo(member.transform.axis!.z);
  });

  it("centres member solids on the domain origin before applying their placement", async () => {
    const scene = await buildEnclosureScene(dimensions);

    for (const object of scene.members) {
      object.geometry.computeBoundingBox();
      const center = object.geometry.boundingBox!.getCenter(new Vector3());
      expect(center.x, `${object.name} local X`).toBeCloseTo(0);
      expect(center.y, `${object.name} local Y`).toBeCloseTo(0);
      expect(center.z, `${object.name} local Z`).toBeCloseTo(0);
    }
  });

  it("renders two hinged inset doors with five meshes each", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    expect(scene.members).toHaveLength(16);
    expect(scene.doors).toHaveLength(2);
    expect(scene.assemblies.map((assembly) => assembly.id)).toEqual([
      "assembly:enclosure",
      "assembly:left-door",
      "assembly:right-door",
    ]);
    expect([...scene.assemblyObjects.keys()]).toEqual([
      "assembly:left-door",
      "assembly:right-door",
    ]);
    expect(scene.doors.map((door) => door.name)).toEqual(["door:left-door", "door:right-door"]);
    expect(scene.doors[0].position.toArray()).toEqual([3, 3, 30]);
    expect(scene.doors[1].position.toArray()).toEqual([1197, 3, 30]);
    for (const door of scene.doors) {
      const meshes: any[] = [];
      door.traverse((child) => {
        if (child.type === "Mesh") meshes.push(child);
      });
      expect(meshes).toHaveLength(5);
      for (const mesh of meshes) {
        mesh.geometry.computeBoundingBox();
        const center = mesh.geometry.boundingBox.getCenter(new Vector3());
        expect(center.z, `${mesh.name} local Z`).toBeCloseTo(0);
      }
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

  it("exposes world-space solid checks and a display-ready report", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    expect(scene.solidChecks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "clearance.door-left-door.door-right-door",
        "clearance.door-left-door.part:front-left-post",
        "clearance.door-right-door.part:front-right-post",
        "clearance.door-left-door.part:front-bottom-rail",
        "clearance.door-right-door.part:front-bottom-rail",
      ]),
    );
    expect(scene.solidChecks.every((check) => check.minimum !== undefined)).toBe(true);
    expect(scene.validationReport).toEqual(expect.objectContaining({ issues: expect.any(Array) }));
  });

  it("keeps insufficient motion clearance as a warning in the complete build report", async () => {
    const firstFailure: NonNullable<MotionSolidCheckResult["firstFailure"]> = {
      id: "motion.left-door-panel.front-left-post",
      status: "insufficient-clearance",
      subject: "left-door-panel",
      target: "part:front-left-post",
      intersection: false,
      distance: 1,
      minimum: 2,
      diagnostics: ["clearance 1 is below required 2"],
      state: { "left-door.angle": -Math.PI / 4, "right-door.angle": Math.PI / 4 },
    };
    checkDoorMotionSolidsMock.mockReturnValueOnce({
      status: "insufficient-clearance",
      verified: false,
      states: [firstFailure.state],
      checkedStates: 81,
      checkedPairs: [{ subject: firstFailure.subject, target: firstFailure.target }],
      firstFailure,
      diagnostics: ["insufficient clearance; no collision"],
    } satisfies MotionSolidCheckResult);
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });

    expect(scene.motionSolidCheck.status).toBe("insufficient-clearance");
    expect(scene.motionSolidCheck.firstFailure).toMatchObject({
      status: "insufficient-clearance",
      intersection: false,
    });
    expect(scene.validationReport.status).toBe("warnings");
    expect(
      scene.validationReport.issues.filter(
        (issue) =>
          issue.references.join("|") ===
          [
            scene.motionSolidCheck.firstFailure!.subject,
            scene.motionSolidCheck.firstFailure!.target,
          ].join("|"),
      ),
    ).toEqual([expect.objectContaining({ id: "motion.solid", severity: "warning" })]);
  });

  it("keeps the configured clearance between each closed door and front post", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    for (const id of [
      "clearance.door-left-door.part:front-left-post",
      "clearance.door-right-door.part:front-right-post",
    ]) {
      const check = scene.solidChecks.find((candidate) => candidate.id === id)!;
      expect(check.status, `${id}: ${check.diagnostics.join("; ")}`).toBe("clear");
      expect(check.intersection).toBe(false);
      expect(check.distance).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps the closed door seam and bottom rail clear by the configured clearance", async () => {
    const scene = await buildEnclosureScene({ width: 1674, height: 740, depth: 1649 });
    for (const id of [
      "clearance.door-left-door.door-right-door",
      "clearance.door-left-door.part:front-bottom-rail",
      "clearance.door-right-door.part:front-bottom-rail",
    ]) {
      const check = scene.solidChecks.find((candidate) => candidate.id === id)!;
      expect(check.status, `${id}: ${check.diagnostics.join("; ")}`).toBe("clear");
      expect(check.intersection).toBe(false);
      expect(check.distance).toBeGreaterThanOrEqual(2);
    }
    expect(scene.motionSolidCheck.status, scene.motionSolidCheck.diagnostics.join("; ")).toBe(
      "clear",
    );
    expect(scene.motionSolidCheck.verified).toBe(true);
  });

  it("returns an incomplete report when OpenCascade initialization fails", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 }, async () => {
      throw new Error("WASM unavailable");
    });
    expect(scene.solidChecks.every((check) => check.status === "indeterminate")).toBe(true);
    expect(scene.validationReport.status).toBe("incomplete");
  });

  it("applies the right-door parent reflection to the world-space solid", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const panel = scene.doors[1].getObjectByName("right-door-panel")!;
    const worldSolid = transformShapeToWorld(makeBaseBox(10, 10, 10) as Shape3D, panel);
    const vertices = worldSolid.mesh({ tolerance: 0.01, angularTolerance: 0.1 }).vertices;
    const maxX = Math.max(...vertices.filter((_, index) => index % 3 === 0));
    expect(scene.doors[1].scale.x).toBe(-1);
    expect(maxX).toBeLessThan(scene.doors[1].position.x);
  });

  it("keeps Three.js and Replicad world bounds aligned for closed and open doors", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const poses = [
      { "left-door.angle": 0, "right-door.angle": 0 },
      { "left-door.angle": -Math.PI / 2, "right-door.angle": Math.PI / 2 },
    ] as const;

    for (const pose of poses) {
      applyAssemblyPose(scene, pose);
      for (const door of scene.doors) {
        door.traverse((object) => {
          if (!(object instanceof Mesh) || !object.userData.solid) return;
          object.geometry.computeBoundingBox();
          const threeBounds = object.geometry.boundingBox!.clone().applyMatrix4(object.matrixWorld);
          const solidBounds = transformShapeToWorld(object.userData.solid as Shape3D, object)
            .boundingBox.bounds;
          const replicadBounds = new Box3(
            new Vector3(...solidBounds[0]),
            new Vector3(...solidBounds[1]),
          );
          expect(
            replicadBounds.min.toArray(),
            `${object.name} min @ ${JSON.stringify(pose)}`,
          ).toEqual(
            expect.arrayContaining(
              threeBounds.min.toArray().map((value) => expect.closeTo(value, 6)),
            ),
          );
          expect(
            replicadBounds.max.toArray(),
            `${object.name} max @ ${JSON.stringify(pose)}`,
          ).toEqual(
            expect.arrayContaining(
              threeBounds.max.toArray().map((value) => expect.closeTo(value, 6)),
            ),
          );
        });
      }
    }
  });

  it("applies non-orthogonal rotation and uniform scale in world-space order", async () => {
    await initializeOpenCascade();
    const object = new Mesh();
    object.position.set(7, -3, 11);
    object.rotation.set(0.31, -0.47, 0.19);
    object.scale.setScalar(1.7);
    object.updateMatrixWorld(true);
    const shape = makeBaseBox(2, 3, 5).translate(1, -2, 0.5) as Shape3D;

    const localBounds = shape.boundingBox.bounds;
    const expected = new Box3(
      new Vector3(...localBounds[0]),
      new Vector3(...localBounds[1]),
    ).applyMatrix4(object.matrixWorld);
    const bounds = transformShapeToWorld(shape, object).boundingBox.bounds;
    expect(bounds[0]).toEqual(
      expect.arrayContaining(expected.min.toArray().map((v) => expect.closeTo(v, 6))),
    );
    expect(bounds[1]).toEqual(
      expect.arrayContaining(expected.max.toArray().map((v) => expect.closeTo(v, 6))),
    );
    expect(shape.isNull).toBe(false);
  });

  it("explicitly rejects non-uniform scale that Replicad cannot represent", async () => {
    await initializeOpenCascade();
    const object = new Mesh();
    object.rotation.set(0.31, -0.47, 0.19);
    object.scale.set(1.2, 0.8, 1.5);
    object.updateMatrixWorld(true);
    const shape = makeBaseBox(2, 3, 5) as Shape3D;
    expect(() => transformShapeToWorld(shape, object)).toThrow(/non-uniform .*scale/i);
    expect(shape.isNull).toBe(false);
  });

  it("applies an absolute pose without losing existing pivots or reflection", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const left = scene.doors[0];
    const right = scene.doors[1];
    const leftPosition = left.position.toArray();
    const rightPosition = right.position.toArray();
    const leftPanel = left.getObjectByName("left-door-panel")!;
    const rightPanel = right.getObjectByName("right-door-panel")!;
    applyAssemblyPose(scene, { "left-door.angle": Math.PI / 2, "right-door.angle": Math.PI / 2 });
    expect(left.rotation.y).toBeCloseTo(Math.PI / 2);
    expect(right.rotation.y).toBeCloseTo(Math.PI / 2);
    expect(left.position.toArray()).toEqual(leftPosition);
    expect(right.position.toArray()).toEqual(rightPosition);
    expect(right.scale.x).toBe(-1);
    expect(leftPanel).toBe(left.getObjectByName("left-door-panel"));
    expect(rightPanel).toBe(right.getObjectByName("right-door-panel"));
  });

  it("opens and closes doors while preserving pivots and mesh identity", async () => {
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

    applyAssemblyPose(scene, { "left-door.angle": -Math.PI / 2, "right-door.angle": Math.PI / 2 });
    expect(doors.map(panelPosition)).not.toEqual(closed);
    expect(doors.map((door) => door.position.toArray())).toEqual(pivots);

    applyAssemblyPose(scene, { "left-door.angle": 0, "right-door.angle": 0 });
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

  it("moves both panels toward positive Z when opening without moving their pivots", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const doors = [...scene.doors];
    const rightDoor = doors.find((door) => door.name === "door:right-door")!;
    const pivots = doors.map((door) => door.position.toArray());
    const panelPosition = (door: (typeof doors)[number]) =>
      door
        .getObjectByName(`${door.name.slice("door:".length)}-panel`)!
        .getWorldPosition(new Vector3());
    const closed = doors.map(panelPosition).map((position) => position.z);
    applyAssemblyPose(scene, { "left-door.angle": -Math.PI / 2, "right-door.angle": Math.PI / 2 });
    const open = doors.map(panelPosition).map((position) => position.z);
    expect(open[0]).toBeGreaterThan(closed[0]);
    expect(open[1]).toBeGreaterThan(closed[1]);
    expect(rightDoor.scale.x).toBe(-1);
    expect(doors.map((door) => door.position.toArray())).toEqual(pivots);
  });
});

import { Group, Mesh } from "three";
import { makeBaseBox } from "replicad";
import { beforeAll, describe, expect, it } from "vitest";
import { buildEnclosureScene, initializeOpenCascade } from "../rendering/enclosureScene";
import { checkDoorMotionSolids, cartesianDoorStates } from "./motionSolidChecks";

beforeAll(async () => {
  await initializeOpenCascade();
});

const motionFixture = () => {
  const leftDoor = new Group();
  leftDoor.name = "door:left-door";
  const leftPanel = new Mesh();
  leftPanel.name = "left-door-panel";
  leftPanel.userData.solid = makeBaseBox(1, 1, 1).translate(10, 0, 0);
  leftDoor.add(leftPanel);

  const rightDoor = new Group();
  rightDoor.name = "door:right-door";
  const rightPanel = new Mesh();
  rightPanel.name = "right-door-panel";
  rightPanel.userData.solid = makeBaseBox(1, 1, 1).translate(12, 0, 0);
  rightDoor.add(rightPanel);

  const obstacle = new Mesh();
  obstacle.name = "frame-obstacle";
  obstacle.userData.solid = makeBaseBox(1, 1, 1).translate(0, 0, 10);

  return { doors: [leftDoor, rightDoor], staticMeshes: [obstacle] };
};

describe("Replicad door-motion validation", () => {
  it("generates a deterministic Cartesian grid and respects maxStates", () => {
    const states = cartesianDoorStates({ samples: 3, maxStates: 4 });
    const completeGrid = cartesianDoorStates({ samples: 3 });
    expect(states).toHaveLength(4);
    expect(states.slice(0, 3)).toEqual([
      { "left-door.angle": 0, "right-door.angle": 0 },
      { "left-door.angle": 0, "right-door.angle": Math.PI / 4 },
      { "left-door.angle": 0, "right-door.angle": Math.PI / 2 },
    ]);
    expect(completeGrid).toHaveLength(9);
    expect(completeGrid.at(-1)).toEqual({
      "left-door.angle": -Math.PI / 2,
      "right-door.angle": Math.PI / 2,
    });
  });

  it("normalizes invalid parameters without NaN or RangeError", () => {
    expect(cartesianDoorStates({ samples: 0, maxStates: -4 })).toEqual([]);
    const states = cartesianDoorStates({ samples: Number.NaN, maxStates: Number.NaN });
    expect(states).toHaveLength(81);
    expect(states.every((state) => Object.values(state).every(Number.isFinite))).toBe(true);
  });

  it("reports incomplete when the budget does not cover the full grid", () => {
    const result = checkDoorMotionSolids({ doors: [], staticMeshes: [], samples: 3, maxStates: 2 });
    expect(result.status).toBe("incomplete");
    expect(result.verified).toBe(false);
    expect(result.diagnostics.join(" ")).toMatch(/budget|state/i);
  });

  it("reports insufficient clearance but gives priority to a later collision", () => {
    const fixture = motionFixture();
    const result = checkDoorMotionSolids({
      ...fixture,
      samples: 2,
      maxStates: 4,
    });

    expect(result.status).toBe("collision");
    expect(result.verified).toBe(false);
    expect(result.checkedStates).toBe(3);
    expect(result.diagnostics.join(" ")).toMatch(/insufficient clearance/i);
    expect(result.diagnostics.join(" ")).toMatch(/left-door-panel.*right-door-panel/i);
    expect(result.firstFailure?.subject).toBe("left-door-panel");
    expect(result.firstFailure?.target).toBe("frame-obstacle");
    expect(result.firstFailure?.status).toBe("collision");
    expect(result.firstFailure?.distance).toBe(0);
    expect(result.firstFailure?.intersection).toBe(true);
    expect(result.firstFailure?.state).toEqual({
      "left-door.angle": -Math.PI / 2,
      "right-door.angle": 0,
    });
  });

  it("keeps insufficient-clearance when no state collides", () => {
    const door = new Group();
    door.name = "door:left-door";
    const panel = new Mesh();
    panel.name = "left-door-panel";
    panel.userData.solid = makeBaseBox(1, 1, 1).translate(-0.5, -0.5, -0.5);
    door.add(panel);
    const obstacle = new Mesh();
    obstacle.name = "near-obstacle";
    obstacle.userData.solid = makeBaseBox(1, 1, 1).translate(3, -0.5, -0.5);

    const result = checkDoorMotionSolids({
      doors: [door],
      staticMeshes: [obstacle],
      samples: 2,
      minimumClearance: 3,
    });

    expect(result.status).toBe("insufficient-clearance");
    expect(result.firstFailure?.status).toBe("insufficient-clearance");
    expect(result.firstFailure?.intersection).toBe(false);
  });

  it("becomes incomplete when the kernel fails after an insufficient-clearance result", () => {
    const fixture = motionFixture();
    const obstacle = fixture.staticMeshes[0];
    const solid = obstacle.userData.solid as ReturnType<typeof makeBaseBox>;
    const originalClone = solid.clone.bind(solid);
    let clones = 0;
    solid.clone = () => {
      clones++;
      if (clones === 2) throw new Error("kernel failure after clearance");
      return originalClone();
    };

    const result = checkDoorMotionSolids({
      ...fixture,
      samples: 2,
      maxStates: 2,
    });

    expect(result.status).toBe("incomplete");
    expect(result.verified).toBe(false);
    expect(result.firstFailure).toMatchObject({
      status: "insufficient-clearance",
      intersection: false,
      subject: "left-door-panel",
      target: "right-door-panel",
    });
    expect(result.diagnostics.join(" ")).toMatch(/kernel failure after clearance/i);
  });

  it("applies absolute angles, preserves right-door reflection, and excludes same-door components", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const result = checkDoorMotionSolids({
      doors: scene.doors,
      staticMeshes: [],
      samples: 2,
      maxStates: 4,
    });
    expect(scene.doors[0].rotation.y).toBe(0);
    expect(scene.doors[1].rotation.y).toBe(0);
    expect(scene.doors[1].scale.x).toBe(-1);
    expect(result.status).toBe("clear");
    expect(
      result.checkedPairs.every(
        (pair) =>
          (pair.subject.includes("left-door") && pair.target.includes("right-door")) ||
          (pair.subject.includes("right-door") && pair.target.includes("left-door")),
      ),
    ).toBe(true);
  });

  it("always restores the initial pose and matrices after the sweep", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    scene.doors[0].rotation.set(0.1, 0.23, -0.2);
    scene.doors[1].rotation.y = -0.31;
    scene.doors[0].updateMatrixWorld(true);
    scene.doors[1].updateMatrixWorld(true);
    const initial = scene.doors.map((door) => door.rotation.toArray());
    checkDoorMotionSolids({ doors: scene.doors, staticMeshes: [], samples: 2 });
    expect(scene.doors.map((door) => door.rotation.toArray())).toEqual(initial);
    expect(scene.doors.every((door) => door.matrixWorld.elements.every(Number.isFinite))).toBe(
      true,
    );
  });

  it("documents that clear validates only the sampled grid", () => {
    const result = checkDoorMotionSolids({ doors: [], staticMeshes: [], samples: 2 });
    expect(result.status).toBe("clear");
    expect(result.diagnostics.join(" ")).toMatch(/sampled states/i);
    expect(result.diagnostics.join(" ")).toMatch(/not a continuous proof/i);
  });

  it("converts a kernel error into an indeterminate state without a false clear", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const mesh = scene.doors[0].getObjectByName("left-door-panel") as Mesh;
    const solid = mesh.userData.solid as ReturnType<typeof makeBaseBox>;
    const originalClone = solid.clone.bind(solid);
    const failingClone = (): typeof solid => {
      const clone = originalClone();
      let proxy: typeof solid;
      proxy = new Proxy(clone, {
        get(target, property, receiver) {
          if (property === "clone" || property === "translate") return () => proxy;
          if (property === "intersect")
            return () => {
              throw new Error("kernel failure");
            };
          return Reflect.get(target, property, receiver);
        },
      });
      return proxy;
    };
    solid.clone = failingClone;
    const other = new Group();
    other.name = "door:right-door";
    const obstacle = new Mesh();
    obstacle.name = "frame-obstacle";
    obstacle.userData.solid = makeBaseBox(1, 1, 1).translate(100, 0, 0);
    const result = checkDoorMotionSolids({
      doors: [scene.doors[0], other],
      staticMeshes: [obstacle],
      samples: 2,
      maxStates: 4,
    });
    expect(result.status).toBe("incomplete");
    expect(result.verified).toBe(false);
    expect(result.diagnostics.join(" ")).toMatch(/indeterminate|kernel/i);
  });

  it("reports a non-callable clone as indeterminate without consuming the source solid", async () => {
    const door = new Group();
    door.name = "door:left-door";
    const mesh = new Mesh();
    mesh.name = "left-door-panel";
    const source = makeBaseBox(1, 1, 1);
    mesh.userData.solid = source;
    door.add(mesh);
    const obstacle = new Mesh();
    obstacle.name = "obstacle";
    obstacle.userData.solid = makeBaseBox(1, 1, 1).translate(10, 0, 0);
    Object.assign(source, { clone: true });
    const result = checkDoorMotionSolids({
      doors: [door],
      staticMeshes: [obstacle],
      samples: 2,
      maxStates: 1,
    });
    expect(result.status).toBe("incomplete");
    expect(result.verified).toBe(false);
    expect(result.diagnostics.join(" ")).toMatch(/non clonable|clone/i);
    expect(source.isNull).toBe(false);
  });
});

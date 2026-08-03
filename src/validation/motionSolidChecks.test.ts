import { Group, Mesh } from "three";
import { describe, expect, it } from "vitest";
import { buildEnclosureScene } from "../rendering/enclosureScene";
import { checkDoorMotionSolids, cartesianDoorStates } from "./motionSolidChecks";

describe("validation Replicad des mouvements de portes", () => {
  it("génère une grille cartésienne déterministe et respecte maxStates", () => {
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

  it("normalise les paramètres invalides sans NaN ni RangeError", () => {
    expect(cartesianDoorStates({ samples: 0, maxStates: -4 })).toEqual([]);
    const states = cartesianDoorStates({ samples: Number.NaN, maxStates: Number.NaN });
    expect(states).toHaveLength(81);
    expect(states.every((state) => Object.values(state).every(Number.isFinite))).toBe(true);
  });

  it("marque incomplete quand le budget ne couvre pas toute la grille", () => {
    const result = checkDoorMotionSolids({ doors: [], staticMeshes: [], samples: 3, maxStates: 2 });
    expect(result.status).toBe("incomplete");
    expect(result.verified).toBe(false);
    expect(result.diagnostics.join(" ")).toMatch(/budget|état/i);
  });

  it("retourne la première collision avec les IDs mesh réels et les mesures", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    scene.doors[1].position.x = scene.doors[0].position.x;
    const result = checkDoorMotionSolids({
      doors: scene.doors,
      staticMeshes: [],
      samples: 2,
      maxStates: 4,
    });

    expect(result.status).toBe("collision");
    expect(result.verified).toBe(false);
    expect(result.diagnostics.join(" ")).toMatch(/collision/i);
    expect(result.firstFailure?.subject).toMatch(/left-door|right-door/);
    expect(result.firstFailure?.target).toMatch(/left-door|right-door/);
    expect(result.firstFailure?.distance).toBeDefined();
    expect(result.firstFailure?.intersection).toBe(true);
  });

  it("applique les angles absolus, conserve la réflexion droite et exclut les composants d'une même porte", async () => {
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
    expect(
      result.checkedPairs.some(
        (pair) => pair.subject.includes("left-door") && pair.target.includes("right-door"),
      ),
    ).toBe(true);
  });

  it("restaure toujours la pose initiale et les matrices après le sweep", async () => {
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

  it("documente que clear valide uniquement la grille échantillonnée", () => {
    const result = checkDoorMotionSolids({ doors: [], staticMeshes: [], samples: 2 });
    expect(result.status).toBe("clear");
    expect(result.diagnostics.join(" ")).toMatch(/échantillonnés/i);
    expect(result.diagnostics.join(" ")).toMatch(/pas une preuve continue/i);
  });

  it("convertit une erreur du noyau en état indéterminé sans faux clear", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const mesh = scene.doors[0].getObjectByName("left-door-panel") as Mesh;
    const solid = mesh.userData.solid as { intersect: (other: unknown) => unknown };
    mesh.userData.solid = {
      ...solid,
      intersect: () => {
        throw new Error("kernel failure");
      },
    };
    const other = new Group();
    other.name = "door:right-door";
    const result = checkDoorMotionSolids({
      doors: [scene.doors[0], other],
      staticMeshes: [],
      samples: 2,
      maxStates: 4,
    });
    expect(result.status).toBe("incomplete");
    expect(result.verified).toBe(false);
    expect(result.diagnostics.join(" ")).toMatch(/indéterminé|kernel/i);
  });

  it("tolère un clone truthy mais non appelable sur un solide de mouvement", async () => {
    const scene = await buildEnclosureScene({ width: 1200, height: 800, depth: 600 });
    const mesh = scene.doors[0].getObjectByName("left-door-panel") as Mesh;
    mesh.userData.solid = Object.assign(mesh.userData.solid, { clone: true });
    const result = checkDoorMotionSolids({
      doors: scene.doors,
      staticMeshes: [],
      samples: 2,
      maxStates: 1,
    });
    expect(["collision", "incomplete"]).toContain(result.status);
    expect(result.verified).toBe(false);
    expect(result.diagnostics.join(" ")).not.toMatch(/clone is not a function/i);
  });
});

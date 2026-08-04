import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { makeBaseBox, setOC, type Shape3D } from "replicad";
import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import {
  makeEnclosureV2,
  type EnclosureDimensions,
  type EnclosureModel,
} from "../domain/enclosureV2";
import { getProfile } from "../domain/profiles";
import { applyMemberTransform } from "./threeAdapter";
import {
  checkSolidClearance,
  type SolidCheckResult,
  type SolidPair,
} from "../validation/solidChecks";
import { buildValidationReport, type ValidationReport } from "../validation/reports";
import { validateModel } from "../validation/constraints";
import {
  checkDoorMotionSolids,
  type MotionSolidCheckResult,
} from "../validation/motionSolidChecks";
import { transformShapeToWorld } from "../geometry/replicadTransform";
import { createProfileSolid } from "./profileSolid";
import { buildEnclosureAssemblies } from "../domain/assemblies";
import {
  buildAssemblyTree,
  type Assembly,
  type AssemblyTreeNode,
  type MotionPose,
} from "../validation/kinematics";

export { transformShapeToWorld } from "../geometry/replicadTransform";

let openCascadePromise: Promise<unknown> | undefined;
type OpenCascadeModule = Parameters<typeof setOC>[0];
type OpenCascadeInitializer = (options: {
  locateFile: (file: string) => string;
}) => Promise<OpenCascadeModule>;

function wasmLocation(browserAsset: string): string {
  const nodeProcess = (globalThis as { process?: { versions?: { node?: string } } }).process;
  return nodeProcess?.versions?.node
    ? new URL("../../node_modules/replicad-opencascadejs/src/replicad_single.wasm", import.meta.url)
        .pathname
    : browserAsset;
}

export function initializeOpenCascade(
  initializer: OpenCascadeInitializer = opencascade,
  browserAsset = opencascadeWasm,
): Promise<OpenCascadeModule> {
  if (initializer !== opencascade) {
    return initializer({ locateFile: () => wasmLocation(browserAsset) }).then((oc) => {
      setOC(oc);
      return oc;
    });
  }
  if (!openCascadePromise) {
    openCascadePromise = initializer({ locateFile: () => wasmLocation(browserAsset) }).then(
      (oc) => {
        setOC(oc);
        return oc;
      },
    );
  }
  return openCascadePromise as Promise<OpenCascadeModule>;
}

function createExtrusionSolid(
  length: number,
  profileId: Parameters<typeof getProfile>[0],
): Shape3D {
  return createProfileSolid(length, profileId);
}

function shapeMesh(shape: Shape3D): BufferGeometry {
  const mesh = shape.mesh({ tolerance: 0.01, angularTolerance: 0.1 });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(mesh.vertices, 3));
  geometry.setIndex(mesh.triangles);
  geometry.computeVertexNormals();
  return geometry;
}

export type EnclosureScene = {
  model: EnclosureModel;
  root: Group;
  members: readonly Object3D[];
  doors: readonly Group[];
  assemblies: readonly Assembly[];
  assemblyTree: readonly AssemblyTreeNode[];
  assemblyObjects: ReadonlyMap<string, Object3D>;
  solidChecks: readonly SolidCheckResult[];
  validationReport: ValidationReport;
  motionSolidCheck: MotionSolidCheckResult;
};

export const applyAssemblyPose = (
  scene: Pick<EnclosureScene, "root" | "assemblies" | "assemblyObjects">,
  pose: MotionPose,
): void => {
  for (const assembly of scene.assemblies) {
    if (!assembly.motions.length) continue;
    const object = scene.assemblyObjects.get(assembly.id);
    if (!object) throw new Error(`Missing render object for ${assembly.id}`);
    for (const definition of assembly.motions) {
      // A caller may intentionally control only one assembly. Motions omitted
      // from a partial pose return to their declared rest/minimum position.
      const value = pose[definition.id] ?? definition.motion.min;
      const axis = new Vector3(
        definition.motion.axis.x,
        definition.motion.axis.y,
        definition.motion.axis.z,
      ).normalize();
      if (definition.motion.kind === "revolute") object.setRotationFromAxisAngle(axis, value);
      else {
        const base = object.userData.basePosition;
        if (!(base instanceof Vector3)) throw new Error(`Missing base position for ${assembly.id}`);
        object.position.copy(base).addScaledVector(axis, value);
      }
    }
  }
  scene.root.updateMatrixWorld(true);
};

const indeterminateSolidCheck = (
  id: string,
  subject: string,
  target: string,
  minimum: number,
  error: unknown,
): SolidCheckResult => ({
  id,
  status: "indeterminate",
  minimum,
  subject,
  target,
  diagnostics: [error instanceof Error ? error.message : String(error)],
});

const collectDoorSolids = (door: Group): SolidPair[] => {
  const solids: SolidPair[] = [];
  door.traverse((child) => {
    if (child instanceof Mesh && child.userData.solid) {
      solids.push({
        id: child.name,
        shape: transformShapeToWorld(child.userData.solid as Shape3D, child),
      });
    }
  });
  return solids;
};

const checkSolidGroups = (
  id: string,
  subject: string,
  target: string,
  subjects: readonly SolidPair[],
  targets: readonly SolidPair[],
  minimum: number,
): SolidCheckResult => {
  const results = subjects.flatMap((subjectPart) =>
    targets.map((targetPart) =>
      checkSolidClearance(
        new Map([
          [subjectPart.id, subjectPart.shape],
          [targetPart.id, targetPart.shape],
        ]),
        {
          id: `${id}.${subjectPart.id}.${targetPart.id}`,
          subject: subjectPart.id,
          target: targetPart.id,
          minimum,
        },
      ),
    ),
  );
  const collision = results.find((result) => result.status === "collision");
  const indeterminate = results.find((result) => result.status === "indeterminate");
  const distance = Math.min(...results.flatMap((result) => result.distance ?? []));
  const status = collision
    ? "collision"
    : indeterminate
      ? "indeterminate"
      : distance + 1e-6 < minimum
        ? "insufficient-clearance"
        : "clear";
  return {
    id,
    status,
    subject,
    target,
    minimum,
    ...(Number.isFinite(distance) ? { distance } : {}),
    intersection: Boolean(collision),
    diagnostics: collision
      ? [`${collision.subject} intersects ${collision.target}`, ...collision.diagnostics]
      : indeterminate
        ? [`${indeterminate.subject} vs ${indeterminate.target}`, ...indeterminate.diagnostics]
        : [],
  };
};

function createDoorMesh(
  length: number,
  side: number,
  depth: number,
  name: string,
  profileId?: Parameters<typeof getProfile>[0],
): Mesh {
  const solidDepth = Math.max(depth, 1);
  const solid = profileId
    ? createProfileSolid(Math.max(length, 1), profileId)
    : (makeBaseBox(Math.max(length, 1), Math.max(side, 1), solidDepth).translateZ(
        -solidDepth / 2,
      ) as Shape3D);
  const geometry = shapeMesh(solid);
  const object = new Mesh(
    geometry,
    new MeshStandardMaterial({
      color: profileId ? 0xb8c2cc : 0x6fa8c9,
      metalness: profileId ? 0.7 : 0.05,
      roughness: profileId ? 0.3 : 0.2,
      transparent: !profileId,
      opacity: profileId ? 1 : 0.42,
      depthWrite: Boolean(profileId),
    }),
  );
  object.name = name;
  object.userData.geometryAdapter = "replicad";
  object.userData.solid = solid;
  object.userData.meshVertexCount = geometry.getAttribute("position").count;
  if (profileId) object.userData.profileId = profileId;
  else object.userData.partType = "door-panel";
  return object;
}

function createDoor(model: EnclosureModel, id: string, width: number, height: number): Group {
  const door = new Group();
  door.name = `door:${id}`;
  const hinge = model.anchors[`anchor:${id === "left-door" ? "left" : "right"}-hinge`]!.position;
  door.position.set(hinge.x, hinge.y, hinge.z);
  if (id === "right-door") door.scale.x = -1;
  const profile = "profile:aluminium-3030" as Parameters<typeof getProfile>[0];
  const frame = new Group();
  frame.name = `${id}-frame`;
  // The hinge anchor is the outside/front corner of the inset leaf. The rigid
  // leaf extends inward in X and behind the front-face plane in Z.
  frame.position.set(width / 2, 0, -15);
  door.add(frame);
  const verticalSide = getProfile("profile:aluminium-3030").section.x;
  const panelSide = 4;
  const verticals = [
    [-(width / 2 - verticalSide / 2), height / 2, "left-upright"],
    [width / 2 - verticalSide / 2, height / 2, "right-upright"],
  ] as const;
  for (const [x, y, name] of verticals) {
    const mesh = createDoorMesh(height, verticalSide, verticalSide, `${id}-${name}`, profile);
    // Replicad boxes are longitudinal on local X; turn door uprights into Y.
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, 0);
    frame.add(mesh);
  }
  for (const [x, y, name] of [
    [0, verticalSide / 2, "bottom-rail"],
    [0, height - verticalSide / 2, "top-rail"],
  ] as const) {
    const mesh = createDoorMesh(width - 60, verticalSide, verticalSide, `${id}-${name}`, profile);
    mesh.position.set(x, y, 0);
    frame.add(mesh);
  }
  const panel = createDoorMesh(width - 50, height - 50, panelSide, `${id}-panel`);
  panel.position.set(0, height / 2, 0);
  frame.add(panel);
  return door;
}

export async function buildEnclosureScene(
  clearDimensions: EnclosureDimensions,
  initializer: OpenCascadeInitializer = opencascade,
): Promise<EnclosureScene> {
  let initializationError: unknown;
  try {
    await initializeOpenCascade(initializer);
  } catch (error) {
    initializationError = error;
  }
  const model = makeEnclosureV2(clearDimensions);
  const assemblies = buildEnclosureAssemblies(model);
  const root = new Group();
  root.name = model.frame.id;
  root.userData.frameId = model.frame.id;

  const members = model.members.map((member) => {
    const solid = createExtrusionSolid(member.length, member.profile);
    const geometry = shapeMesh(solid);
    const object = new Mesh(
      geometry,
      new MeshStandardMaterial({ color: 0xb8c2cc, metalness: 0.7, roughness: 0.3 }),
    );
    object.name = member.id;
    object.userData.memberId = member.id;
    object.userData.profileId = member.profile;
    object.userData.geometryAdapter = "replicad";
    object.userData.solid = solid;
    object.userData.meshVertexCount = geometry.getAttribute("position").count;
    applyMemberTransform(object, member);
    root.add(object);
    return object;
  });

  const assemblyObjects = new Map<string, Object3D>();
  const doors = (model.doors ?? []).map((door) => {
    const object = createDoor(model, door.id, door.nominalWidth, door.nominalHeight);
    object.userData.basePosition = object.position.clone();
    const assembly = assemblies.find((candidate) => candidate.parts.includes(door.id));
    if (!assembly) throw new Error(`Missing assembly for ${door.id}`);
    object.userData.assemblyId = assembly.id;
    assemblyObjects.set(assembly.id, object);
    root.add(object);
    return object;
  });
  root.updateMatrixWorld(true);
  const minimum = model.doorSeamClearance ?? 2;
  const motionSolidCheck: MotionSolidCheckResult = initializationError
    ? {
        status: "incomplete",
        verified: false,
        states: [],
        checkedStates: 0,
        checkedPairs: [],
        diagnostics: [
          initializationError instanceof Error
            ? initializationError.message
            : String(initializationError),
        ],
      }
    : checkDoorMotionSolids({
        doors,
        staticMeshes: members,
        // Keep the interactive scene responsive.  The three-state grid covers
        // closed, mid-travel, and fully open for each leaf; exhaustive sweeps
        // can be requested by the validation API outside the render path.
        samples: 3,
        maxStates: 9,
        minimumClearance: minimum,
      });
  const solidIds = [
    "clearance.door-left-door.door-right-door",
    "clearance.door-left-door.part:front-left-post",
    "clearance.door-right-door.part:front-right-post",
    "clearance.door-left-door.part:front-bottom-rail",
    "clearance.door-right-door.part:front-bottom-rail",
  ];
  let solidChecks: SolidCheckResult[];
  try {
    if (initializationError) throw initializationError;
    const memberSolids: SolidPair[] = members.map((object) => ({
      id: object.name,
      shape: transformShapeToWorld(object.userData.solid as Shape3D, object),
    }));
    const doorSolids = new Map(doors.map((door) => [door.name, collectDoorSolids(door)]));
    const memberGroups = new Map(memberSolids.map((solid) => [solid.id, [solid]]));
    const groups = new Map([...memberGroups, ...doorSolids]);
    solidChecks = [
      {
        id: solidIds[0],
        subject: "door:left-door",
        target: "door:right-door",
        minimum,
      },
      {
        id: solidIds[1],
        subject: "door:left-door",
        target: "part:front-left-post",
        minimum,
      },
      {
        id: solidIds[2],
        subject: "door:right-door",
        target: "part:front-right-post",
        minimum,
      },
      {
        id: solidIds[3],
        subject: "door:left-door",
        target: "part:front-bottom-rail",
        minimum,
      },
      {
        id: solidIds[4],
        subject: "door:right-door",
        target: "part:front-bottom-rail",
        minimum,
      },
    ].map((check) =>
      checkSolidGroups(
        check.id,
        check.subject,
        check.target,
        groups.get(check.subject) ?? [],
        groups.get(check.target) ?? [],
        check.minimum,
      ),
    );
  } catch (error) {
    solidChecks = [
      indeterminateSolidCheck(solidIds[0], "door:left-door", "door:right-door", minimum, error),
      indeterminateSolidCheck(
        solidIds[1],
        "door:left-door",
        "part:front-left-post",
        minimum,
        error,
      ),
      indeterminateSolidCheck(
        solidIds[2],
        "door:right-door",
        "part:front-right-post",
        minimum,
        error,
      ),
      indeterminateSolidCheck(
        solidIds[3],
        "door:left-door",
        "part:front-bottom-rail",
        minimum,
        error,
      ),
      indeterminateSolidCheck(
        solidIds[4],
        "door:right-door",
        "part:front-bottom-rail",
        minimum,
        error,
      ),
    ];
  }

  const revision = JSON.stringify({ dimensions: model.dimensions, members: model.members });
  const validationReport = buildValidationReport(
    revision,
    validateModel(model),
    [],
    [],
    solidChecks,
    motionSolidCheck,
  );
  root.userData.geometryReady = true;

  return {
    model,
    root,
    members,
    doors,
    assemblies,
    assemblyTree: buildAssemblyTree(assemblies),
    assemblyObjects,
    solidChecks,
    motionSolidCheck,
    validationReport,
  };
}

export const defaultEnclosureScene = () =>
  buildEnclosureScene({ width: 1674, height: 740, depth: 1649 });

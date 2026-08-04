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
import { checkSolidPairs, type SolidCheckResult, type SolidPair } from "../validation/solidChecks";
import { buildValidationReport, type ValidationReport } from "../validation/reports";
import { validateModel } from "../validation/constraints";
import {
  checkDoorMotionSolids,
  type MotionSolidCheckResult,
} from "../validation/motionSolidChecks";
import { transformShapeToWorld } from "../geometry/replicadTransform";
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
  const profile = getProfile(profileId);
  // The domain basis maps local X to the member span, local Y to the profile side,
  // and local Z to its wide face. Keep the profile section dimensions in mm.
  return makeBaseBox(length, profile.section.x, profile.section.y) as Shape3D;
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

const collectDoorSolid = (door: Group): Shape3D => {
  const solids: Shape3D[] = [];
  door.traverse((child) => {
    if (child instanceof Mesh && child.userData.solid) {
      solids.push(transformShapeToWorld(child.userData.solid as Shape3D, child));
    }
  });
  return solids.slice(1).reduce((combined, solid) => combined.fuse(solid) as Shape3D, solids[0]);
};

function createDoorMesh(
  length: number,
  side: number,
  depth: number,
  name: string,
  profileId?: Parameters<typeof getProfile>[0],
): Mesh {
  const solid = makeBaseBox(Math.max(length, 1), Math.max(side, 1), Math.max(depth, 1)) as Shape3D;
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
  if (profileId) object.userData.profileId = `profile:${profileId}`;
  else object.userData.partType = "door-panel";
  return object;
}

function createDoor(model: EnclosureModel, id: string, width: number, height: number): Group {
  const door = new Group();
  door.name = `door:${id}`;
  const hinge = model.anchors[`anchor:${id === "left-door" ? "left" : "right"}-hinge`]!.position;
  door.position.set(hinge.x, hinge.y, hinge.z);
  if (id === "right-door") door.scale.x = -1;
  const profile = "aluminium-3030" as Parameters<typeof getProfile>[0];
  // The 3060 front post presents a 30 mm side toward the door; derive the
  // offset from the catalog's established section width.
  const frontPostSide = getProfile("profile:aluminium-3030").section.x;
  const clearance = 2;
  // Put the hinge line in front of the post's front face. A pivot on the post
  // centreline is clear only while closed; the hinge-side stile sweeps back
  // into the post as soon as the leaf rotates.
  door.position.z += frontPostSide + 2 * clearance;
  const frame = new Group();
  frame.name = `${id}-frame`;
  // The local door is positioned from its hinge edge. The front post occupies
  // one profile side toward the door, so leave that side plus the clearance;
  // the hinge pivot itself remains unchanged.
  frame.position.x = width / 2 + frontPostSide + clearance;
  // The bottom rail occupies the first 30 mm above the hinge anchor.  Raise
  // the leaf by the configured clearance so its upright does not merely touch
  // (or intersect) that rail in the closed state.
  frame.position.y = clearance;
  door.add(frame);
  const verticalSide = getProfile("profile:aluminium-3030").section.x;
  const panelSide = 4;
  const verticals = [
    [-(width / 2 - verticalSide / 2), height / 2, "left-montant"],
    [width / 2 - verticalSide / 2, height / 2, "right-montant"],
  ] as const;
  for (const [x, y, name] of verticals) {
    const mesh = createDoorMesh(height, verticalSide, verticalSide, `${id}-${name}`, profile);
    // Replicad boxes are longitudinal on local X; turn door uprights into Y.
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, 0);
    frame.add(mesh);
  }
  for (const [x, y, name] of [
    [0, verticalSide / 2, "bottom-traverse"],
    [0, height - verticalSide / 2, "top-traverse"],
  ] as const) {
    const mesh = createDoorMesh(width - 60, verticalSide, verticalSide, `${id}-${name}`, profile);
    mesh.position.set(x, y, 0);
    frame.add(mesh);
  }
  const panel = createDoorMesh(width - 50, height - 50, panelSide, `${id}-panel`);
  panel.position.set(0, height / 2, verticalSide / 2 - panelSide / 2);
  frame.add(panel);
  return door;
}

function createServiceSlider(model: EnclosureModel): Group | undefined {
  const slider = model.serviceSlider;
  if (!slider) return undefined;
  const anchor = model.anchors[slider.anchor]?.position;
  if (!anchor) throw new Error(`Missing service slider anchor ${slider.anchor}`);
  const group = new Group();
  group.name = `assembly-object:${slider.id}`;
  group.position.set(anchor.x, anchor.y, anchor.z);
  const panel = createDoorMesh(slider.width, slider.height, 4, slider.id);
  panel.position.set(slider.width / 2, slider.height / 2, 0);
  panel.userData.partType = "service-slider";
  group.add(panel);
  return group;
}

export async function buildEnclosureScene(
  dimensions: EnclosureDimensions,
  initializer: OpenCascadeInitializer = opencascade,
): Promise<EnclosureScene> {
  let initializationError: unknown;
  try {
    await initializeOpenCascade(initializer);
  } catch (error) {
    initializationError = error;
  }
  const model = makeEnclosureV2(dimensions);
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

  const frontPostSide = getProfile("profile:aluminium-3030").section.x;
  const seamClearance = model.doorSeamClearance ?? 2;
  const sideClearance = frontPostSide + seamClearance;
  // Each leaf starts after its front post and must leave the configured seam
  // between the two meeting stiles.  Using half the enclosure width ignored
  // the two post clearances, making the closed leaves overlap.
  const doorWidth = (dimensions.width - 2 * sideClearance - seamClearance) / 2;
  const doorHeight = dimensions.height - 90 - seamClearance;
  const assemblyObjects = new Map<string, Object3D>();
  const doors = (model.doors ?? []).map((door) => {
    const object = createDoor(model, door.id, doorWidth, doorHeight);
    object.userData.basePosition = object.position.clone();
    const assembly = assemblies.find((candidate) => candidate.parts.includes(door.id));
    if (!assembly) throw new Error(`Missing assembly for ${door.id}`);
    object.userData.assemblyId = assembly.id;
    assemblyObjects.set(assembly.id, object);
    root.add(object);
    return object;
  });
  const slider = createServiceSlider(model);
  if (slider && model.serviceSlider) {
    slider.userData.basePosition = slider.position.clone();
    const assembly = assemblies.find((candidate) =>
      candidate.parts.includes(model.serviceSlider!.id),
    );
    if (!assembly) throw new Error(`Missing assembly for ${model.serviceSlider.id}`);
    slider.userData.assemblyId = assembly.id;
    assemblyObjects.set(assembly.id, slider);
    root.add(slider);
  }

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
    const solids: SolidPair[] = members.map((object) => ({
      id: object.name,
      shape: transformShapeToWorld(object.userData.solid as Shape3D, object),
    }));
    solids.push(...doors.map((door) => ({ id: door.name, shape: collectDoorSolid(door) })));
    solidChecks = checkSolidPairs(solids, [
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
    ]);
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

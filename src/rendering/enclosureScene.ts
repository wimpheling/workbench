import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
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
  solidChecks: readonly SolidCheckResult[];
  validationReport: ValidationReport;
};

export const transformShapeToWorld = (shape: Shape3D, object: Object3D): Shape3D => {
  const position = object.getWorldPosition(new Vector3());
  const quaternion = object.getWorldQuaternion(new Quaternion());
  const angle = 2 * Math.acos(Math.max(-1, Math.min(1, quaternion.w)));
  const axis = new Vector3(quaternion.x, quaternion.y, quaternion.z);
  const reflected = object.matrixWorld.determinant() < 0 ? shape.mirror("YZ", [0, 0, 0]) : shape;
  const oriented =
    angle > 1e-10 && axis.lengthSq() > 1e-12
      ? reflected.rotate(angle, [0, 0, 0], axis.normalize().toArray())
      : reflected;
  return oriented.translate(position.x, position.y, position.z) as Shape3D;
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
    if (child instanceof Mesh && child.userData.solid)
      solids.push(transformShapeToWorld(child.userData.solid as Shape3D, child));
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
  const frame = new Group();
  frame.name = `${id}-frame`;
  door.add(frame);
  const profile = "aluminium-3030" as Parameters<typeof getProfile>[0];
  const verticalSide = 30;
  const panelSide = 4;
  const verticals = [
    [verticalSide / 2, height / 2, "left-montant"],
    [width - verticalSide / 2, height / 2, "right-montant"],
  ] as const;
  for (const [x, y, name] of verticals) {
    const mesh = createDoorMesh(height, verticalSide, verticalSide, `${id}-${name}`, profile);
    // Replicad boxes are longitudinal on local X; turn door uprights into Y.
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, 0);
    frame.add(mesh);
  }
  for (const [x, y, name] of [
    [width / 2, verticalSide / 2, "bottom-traverse"],
    [width / 2, height - verticalSide / 2, "top-traverse"],
  ] as const) {
    const mesh = createDoorMesh(width - 60, verticalSide, verticalSide, `${id}-${name}`, profile);
    mesh.position.set(x, y, 0);
    frame.add(mesh);
  }
  const panel = createDoorMesh(width - 50, height - 50, panelSide, `${id}-panel`);
  panel.position.set(width / 2, height / 2, verticalSide / 2 - panelSide / 2);
  frame.add(panel);
  return door;
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

  const doorWidth = dimensions.width / 2;
  const doorHeight = dimensions.height - 90;
  const doors = (model.doors ?? []).map((door) => {
    const object = createDoor(model, door.id, doorWidth, doorHeight);
    root.add(object);
    return object;
  });

  root.updateMatrixWorld(true);
  const minimum = model.doorSeamClearance ?? 2;
  const solidIds = [
    "clearance.door-left-door.door-right-door",
    "clearance.door-left-door.part:front-left-post",
    "clearance.door-right-door.part:front-right-post",
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
    ];
  }
  const revision = JSON.stringify({ dimensions: model.dimensions, members: model.members });
  const validationReport = buildValidationReport(
    revision,
    validateModel(model),
    [],
    [],
    solidChecks,
  );
  root.userData.geometryReady = true;

  return { model, root, members, doors, solidChecks, validationReport };
}

export const defaultEnclosureScene = () =>
  buildEnclosureScene({ width: 1674, height: 740, depth: 1649 });

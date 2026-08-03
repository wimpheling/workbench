import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
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
): Promise<EnclosureScene> {
  await initializeOpenCascade();
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

  root.userData.geometryReady = true;

  return { model, root, members, doors };
}

export const defaultEnclosureScene = () =>
  buildEnclosureScene({ width: 1674, height: 740, depth: 1649 });

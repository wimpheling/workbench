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
};

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

  root.userData.geometryReady = true;

  return { model, root, members };
}

export const defaultEnclosureScene = () =>
  buildEnclosureScene({ width: 1674, height: 740, depth: 1649 });

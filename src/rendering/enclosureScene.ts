import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
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
import type { DoorHingeInstallation } from "../domain/doorHardware";
import { loadManufacturerCad, type ManufacturerCad } from "./manufacturerCad";
import {
  buildAssemblyTree,
  type Assembly,
  type AssemblyTreeNode,
  type MotionPose,
} from "../validation/kinematics";
import {
  biFoldDoorPose,
  type BiFoldDoorPose,
  type EvaluatedBiFoldDoorLeaf,
  type EvaluatedBiFoldDoorOpening,
} from "../domain/bifoldDoors";

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
    openCascadePromise = initializer({
      locateFile: () => wasmLocation(browserAsset),
    }).then((oc) => {
      setOC(oc);
      return oc;
    });
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
  /** Frame-mounted GLR3030 portions; they do not participate in door motion. */
  stationaryHinges: readonly Group[];
  /** Calibrated visual previews for the selected external CBR brackets. */
  structuralConnectors: readonly Group[];
  /** Evaluated side/back bi-fold door assemblies, each with two transformable leaves. */
  biFoldDoors: readonly Group[];
  /** Conservative closed-state AABB conflicts; these block installation review. */
  closedDoorConnectorEnvelopeConflicts: readonly Readonly<{
    connectionId: string;
    doorId: string;
  }>[];
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
  manufacturerCad?: ManufacturerCad,
): Mesh {
  const solidDepth = Math.max(depth, 1);
  const usesManufacturerCad = profileId === "profile:aluminium-3030" && manufacturerCad;
  const solid = profileId
    ? createProfileSolid(Math.max(length, 1), profileId)
    : (makeBaseBox(Math.max(length, 1), Math.max(side, 1), solidDepth).translateZ(
        -solidDepth / 2,
      ) as Shape3D);
  const geometry = usesManufacturerCad
    ? manufacturerCad.profile3030Geometry
        .clone()
        .scale(length / manufacturerCad.profile3030StockLengthMm, 1, 1)
    : shapeMesh(solid!);
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
  object.userData.geometryAdapter = usesManufacturerCad ? "manufacturer-step" : "replicad";
  object.userData.solid = solid;
  if (usesManufacturerCad) object.userData.manufacturerCadAsset = "AST03003004.step";
  object.userData.meshVertexCount = geometry.getAttribute("position").count;
  if (profileId) object.userData.profileId = profileId;
  else object.userData.partType = "door-panel";
  return object;
}

function createDoor(
  model: EnclosureModel,
  id: string,
  width: number,
  height: number,
  manufacturerCad: ManufacturerCad,
): Group {
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
  const infill = model.doorInfillPanels.find((candidate) => candidate.leafId === id);
  if (!infill) throw new Error(`Missing infill panel specification for ${id}`);
  const verticals = [
    [-(width / 2 - verticalSide / 2), height / 2, "left-upright"],
    [width / 2 - verticalSide / 2, height / 2, "right-upright"],
  ] as const;
  for (const [x, y, name] of verticals) {
    const mesh = createDoorMesh(
      height,
      verticalSide,
      verticalSide,
      `${id}-${name}`,
      profile,
      manufacturerCad,
    );
    // Replicad boxes are longitudinal on local X; turn door uprights into Y.
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, 0);
    frame.add(mesh);
  }
  for (const [x, y, name] of [
    [0, verticalSide / 2, "bottom-rail"],
    [0, height - verticalSide / 2, "top-rail"],
  ] as const) {
    const mesh = createDoorMesh(
      width - 60,
      verticalSide,
      verticalSide,
      `${id}-${name}`,
      profile,
      manufacturerCad,
    );
    mesh.position.set(x, y, 0);
    frame.add(mesh);
  }
  const panel = createDoorMesh(
    infill.cutSizeMm.widthMm,
    infill.cutSizeMm.heightMm,
    infill.thicknessMm,
    `${id}-panel`,
  );
  panel.position.set(0, height / 2, 0);
  frame.add(panel);
  const hingeInstallation = model.doorHinges.find((candidate) => candidate.leafId === id);
  if (hingeInstallation?.fitStatus === "fits-leaf-height") {
    door.add(createLeafHinge(id, hingeInstallation, manufacturerCad));
  }
  return door;
}

const BI_FOLD_FRAME_PROFILE = "profile:aluminium-3030" as Parameters<typeof getProfile>[0];

const biFoldMetadata = (opening: EvaluatedBiFoldDoorOpening) => ({
  partType: "bi-fold-access-door",
  renderStatus: "evaluated-leaf-frame-and-inset-panel",
  openingId: opening.id,
  accessFace: opening.face,
  openingDirection: "outward",
  parkingDirection: opening.parkingDirection,
  interLeafHingeSelection: opening.interLeafHinge.hardwareSelection,
  interLeafHingeCollisionProof: opening.interLeafHinge.collisionProofStatus,
});

function createBiFoldLeafFrame(
  opening: EvaluatedBiFoldDoorOpening,
  leaf: EvaluatedBiFoldDoorLeaf,
  manufacturerCad: ManufacturerCad,
): Group {
  const frame = new Group();
  frame.name = `bi-fold-leaf:${leaf.id}`;
  Object.assign(frame.userData, biFoldMetadata(opening), {
    partType: "bi-fold-leaf",
    leafId: leaf.id,
    leafRole: leaf.role,
    frameProfile: leaf.frameProfile,
    insetPanelInstallation: leaf.insetPanel.installation,
    frameFitStatus: leaf.frameFitStatus,
  });
  frame.position.set(leaf.nominalWidthMm / 2, 0, 0);
  const sideMm = leaf.frameFaceDepthMm;
  for (const [x, name] of [
    [-(leaf.nominalWidthMm / 2 - sideMm / 2), "hinge-upright"],
    [leaf.nominalWidthMm / 2 - sideMm / 2, "free-upright"],
  ] as const) {
    const mesh = createDoorMesh(
      leaf.nominalHeightMm,
      sideMm,
      sideMm,
      `${leaf.id}-${name}`,
      BI_FOLD_FRAME_PROFILE,
      manufacturerCad,
    );
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, leaf.nominalHeightMm / 2, 0);
    mesh.userData.biFoldLeafId = leaf.id;
    frame.add(mesh);
  }
  for (const [y, name] of [
    [sideMm / 2, "bottom-rail"],
    [leaf.nominalHeightMm - sideMm / 2, "top-rail"],
  ] as const) {
    const mesh = createDoorMesh(
      Math.max(1, leaf.nominalWidthMm - sideMm * 2),
      sideMm,
      sideMm,
      `${leaf.id}-${name}`,
      BI_FOLD_FRAME_PROFILE,
      manufacturerCad,
    );
    mesh.position.set(0, y, 0);
    mesh.userData.biFoldLeafId = leaf.id;
    frame.add(mesh);
  }
  const panel = createDoorMesh(
    Math.max(1, leaf.insetPanel.cutWidthMm),
    Math.max(1, leaf.insetPanel.cutHeightMm),
    leaf.insetPanel.thicknessMm,
    `${leaf.id}-inset-panel`,
  );
  panel.position.set(0, leaf.nominalHeightMm / 2, 0);
  Object.assign(panel.userData, {
    biFoldLeafId: leaf.id,
    partType: "bi-fold-inset-panel",
    installation: leaf.insetPanel.installation,
  });
  frame.add(panel);
  return frame;
}

function createBiFoldGlrFrameHinge(
  opening: EvaluatedBiFoldDoorOpening,
  leaf: EvaluatedBiFoldDoorLeaf,
  manufacturerCad: ManufacturerCad,
): readonly [Group, Group] | readonly [] {
  // GLR3030 is a 600 mm long supplier CAD component. Preserve its selection
  // in metadata even when a tiny test enclosure cannot physically fit it.
  if (leaf.nominalHeightMm < 600) return [];
  const offsetY = (leaf.nominalHeightMm - 600) / 2 + 300;
  const stationary = new Group();
  stationary.name = `bi-fold-hinge:${leaf.id}:stationary`;
  Object.assign(stationary.userData, biFoldMetadata(opening), {
    partType: "bi-fold-frame-hinge-stationary",
    hardwareId: "hardware:wolweiss-glr3030",
    hardwareSelection: "selected",
    geometryAdapter: "manufacturer-step",
  });
  const stationaryMesh = new Mesh(
    manufacturerCad.glr3030StationaryGeometry.clone(),
    new MeshStandardMaterial({
      color: 0x65717d,
      metalness: 0.75,
      roughness: 0.28,
    }),
  );
  stationaryMesh.name = `${leaf.id}-glr3030-stationary`;
  stationaryMesh.position.y = offsetY;
  stationary.add(stationaryMesh);

  const moving = new Group();
  moving.name = `bi-fold-hinge:${leaf.id}:leaf`;
  Object.assign(moving.userData, biFoldMetadata(opening), {
    partType: "bi-fold-frame-hinge-leaf",
    hardwareId: "hardware:wolweiss-glr3030",
    hardwareSelection: "selected",
    geometryAdapter: "manufacturer-step",
  });
  const movingMesh = new Mesh(
    manufacturerCad.glr3030LeafGeometry.clone(),
    new MeshStandardMaterial({
      color: 0x65717d,
      metalness: 0.75,
      roughness: 0.28,
    }),
  );
  movingMesh.name = `${leaf.id}-glr3030-leaf`;
  movingMesh.position.y = offsetY;
  moving.add(movingMesh);
  return [stationary, moving];
}

function createBiFoldDoor(
  opening: EvaluatedBiFoldDoorOpening,
  manufacturerCad: ManufacturerCad,
): Group {
  const group = new Group();
  group.name = `bi-fold-door:${opening.id}`;
  group.position.set(opening.framePivotMm.x, opening.framePivotMm.y, opening.framePivotMm.z);
  // Local +X follows the closed leaf from its frame pivot to its folding mate.
  // These two rotations map that axis along the intended half-face opening.
  group.rotation.y = opening.face === "left" ? -Math.PI / 2 : Math.PI;
  Object.assign(group.userData, biFoldMetadata(opening), {
    openingWidthMm: opening.openingWidthMm,
    openingHeightMm: opening.openingHeightMm,
    frameHingeSelection: opening.frameHinge.hardwareSelection,
    frameHingeGeometry: opening.frameHinge.geometryStatus,
    poseState: "closed",
  });

  const [primaryLeaf, secondaryLeaf] = opening.leaves;
  const primaryPivot = new Group();
  primaryPivot.name = `bi-fold-pivot:${primaryLeaf.id}`;
  primaryPivot.userData.biFoldRole = "primary-pivot";
  primaryPivot.add(createBiFoldLeafFrame(opening, primaryLeaf, manufacturerCad));
  const glr = createBiFoldGlrFrameHinge(opening, primaryLeaf, manufacturerCad);
  if (glr.length) {
    const [stationary, moving] = glr;
    group.add(stationary);
    primaryPivot.add(moving);
  }
  const secondaryPivot = new Group();
  secondaryPivot.name = `bi-fold-pivot:${secondaryLeaf.id}`;
  secondaryPivot.position.x = primaryLeaf.nominalWidthMm;
  secondaryPivot.userData.biFoldRole = "secondary-pivot";
  Object.assign(secondaryPivot.userData, {
    interLeafHingeSelection: opening.interLeafHinge.hardwareSelection,
    collisionProof: opening.interLeafHinge.collisionProofStatus,
  });
  secondaryPivot.add(createBiFoldLeafFrame(opening, secondaryLeaf, manufacturerCad));
  primaryPivot.add(secondaryPivot);
  group.add(primaryPivot);
  return group;
}

/** Apply a named bi-fold pose to the evaluated nested pivots. */
export const applyBiFoldDoorPose = (
  door: Group,
  opening: EvaluatedBiFoldDoorOpening,
  state: BiFoldDoorPose["state"],
): void => {
  const pose = biFoldDoorPose(opening, state);
  const primary = door.getObjectByName(`bi-fold-pivot:${opening.leaves[0].id}`);
  const secondary = door.getObjectByName(`bi-fold-pivot:${opening.leaves[1].id}`);
  if (!primary || !secondary) throw new Error(`Missing evaluated pivots for ${opening.id}`);
  const sign = opening.outwardAngleSign;
  primary.rotation.y = (pose.primaryLeafAngleDeg * sign * Math.PI) / 180;
  secondary.rotation.y = (pose.secondaryLeafRelativeAngleDeg * sign * Math.PI) / 180;
  door.userData.poseState = state;
  door.updateMatrixWorld(true);
};

/** Interpolates the evaluated closed and open poses for UI animation. */
export const applyBiFoldDoorOpenFraction = (
  door: Group,
  opening: EvaluatedBiFoldDoorOpening,
  openFraction: number,
): void => {
  const fraction = Math.min(1, Math.max(0, openFraction));
  const closed = biFoldDoorPose(opening, "closed");
  const open = biFoldDoorPose(opening, "open");
  const primary = door.getObjectByName(`bi-fold-pivot:${opening.leaves[0].id}`);
  const secondary = door.getObjectByName(`bi-fold-pivot:${opening.leaves[1].id}`);
  if (!primary || !secondary) throw new Error(`Missing evaluated pivots for ${opening.id}`);
  const sign = opening.outwardAngleSign;
  const primaryAngleDeg =
    closed.primaryLeafAngleDeg + (open.primaryLeafAngleDeg - closed.primaryLeafAngleDeg) * fraction;
  const secondaryAngleDeg =
    closed.secondaryLeafRelativeAngleDeg +
    (open.secondaryLeafRelativeAngleDeg - closed.secondaryLeafRelativeAngleDeg) * fraction;
  primary.rotation.y = (primaryAngleDeg * sign * Math.PI) / 180;
  secondary.rotation.y = (secondaryAngleDeg * sign * Math.PI) / 180;
  door.userData.poseState = fraction === 0 ? "closed" : fraction === 1 ? "open" : "transitioning";
  door.updateMatrixWorld(true);
};

/** The supplier CAD portion carried by the door leaf. */
function createLeafHinge(
  id: string,
  hinge: DoorHingeInstallation,
  manufacturerCad: ManufacturerCad,
): Group {
  if (hinge.leafBottomOffsetMm === undefined) {
    throw new Error(`Cannot render an incompatible hinge on ${id}`);
  }
  const hardware = hinge.hardware;
  const visible = new Group();
  visible.name = `${id}-hinge-leaf`;
  visible.userData.partType = "door-hinge-leaf";
  visible.userData.hardwareId = hardware.id;
  visible.userData.geometryFidelity = hardware.geometryFidelity;
  const mesh = new Mesh(
    manufacturerCad.glr3030LeafGeometry.clone(),
    new MeshStandardMaterial({
      color: 0x65717d,
      metalness: 0.75,
      roughness: 0.28,
    }),
  );
  mesh.name = `${id}-hinge-glr3030-leaf`;
  mesh.position.set(0, hinge.leafBottomOffsetMm + hardware.overallHeightMm / 2, 0);
  mesh.userData.partType = "door-hinge-glr3030-leaf";
  mesh.userData.hardwareId = hardware.id;
  mesh.userData.geometryAdapter = "manufacturer-step";
  mesh.userData.manufacturerCadAsset = "GLR3030.step";
  visible.add(mesh);
  return visible;
}

function createStationaryHinge(
  model: EnclosureModel,
  installation: DoorHingeInstallation,
  manufacturerCad: ManufacturerCad,
): Group {
  if (installation.leafBottomOffsetMm === undefined) {
    throw new Error(`Cannot render an incompatible hinge on ${installation.leafId}`);
  }
  const side = installation.leafId === "left-door" ? "left" : "right";
  const anchor = model.anchors[`anchor:${side}-hinge`]!.position;
  const group = new Group();
  group.name = `hinge:${installation.leafId}:stationary`;
  group.position.set(
    anchor.x,
    anchor.y + installation.leafBottomOffsetMm + installation.hardware.overallHeightMm / 2,
    anchor.z,
  );
  if (installation.leafId === "right-door") group.scale.x = -1;
  const mesh = new Mesh(
    manufacturerCad.glr3030StationaryGeometry.clone(),
    new MeshStandardMaterial({
      color: 0x65717d,
      metalness: 0.75,
      roughness: 0.28,
    }),
  );
  mesh.name = `${installation.leafId}-hinge-glr3030-stationary`;
  mesh.userData.partType = "door-hinge-glr3030-stationary";
  mesh.userData.hardwareId = installation.hardware.id;
  mesh.userData.geometryAdapter = "manufacturer-step";
  mesh.userData.manufacturerCadAsset = "GLR3030.step";
  group.add(mesh);
  return group;
}

function createExternalBracket(
  connection: EnclosureModel["connections"][number],
  memberObjects: readonly Object3D[],
  manufacturerCad: ManufacturerCad,
): Group | undefined {
  if (connection.connector?.placement !== "external" || connection.joint?.kind !== "butt") {
    return undefined;
  }
  const geometry =
    connection.connector.id === "hardware:wolweiss-cbr3030"
      ? manufacturerCad.cbr3030Geometry
      : connection.connector.id === "hardware:wolweiss-cbr3060"
        ? manufacturerCad.cbr3060Geometry
        : undefined;
  if (!geometry) return undefined;
  const terminating = memberObjects.find(
    (member) => member.name === connection.joint!.terminatingMember,
  );
  if (!terminating) throw new Error(`Missing render member for ${connection.id}`);
  const sign = connection.joint.terminatingFace === "start" ? -1 : 1;
  const jointPoint = terminating.localToWorld(
    new Vector3((sign * terminating.userData.lengthMm) / 2, 0, 0),
  );
  const group = new Group();
  group.name = `connector:${connection.id}`;
  const supporting = memberObjects.find(
    (member) => member.name === connection.joint!.supportingMember,
  );
  if (!supporting) throw new Error(`Missing render member for ${connection.id}`);
  const terminatingRotation = terminating.getWorldQuaternion(new Quaternion());
  const supportingRotation = supporting.getWorldQuaternion(new Quaternion());
  const terminatingOutward = new Vector3(sign, 0, 0)
    .applyQuaternion(terminatingRotation)
    .normalize();
  const supportingAxis = new Vector3(1, 0, 0).applyQuaternion(supportingRotation).normalize();
  const supportDirection = supportingAxis.multiplyScalar(
    connection.connector.mountingSide === "toward-support-start" ? -1 : 1,
  );
  const terminatingInterior = terminatingOutward.multiplyScalar(-1);
  const localSupportDirection = supportDirection
    .clone()
    .applyQuaternion(terminatingRotation.clone().invert());
  const terminatingProfile = getProfile(terminating.userData.profileId);
  const terminatingHalfExtentAlongSupport =
    (Math.abs(localSupportDirection.y) * terminatingProfile.section.y) / 2 +
    (Math.abs(localSupportDirection.z) * terminatingProfile.section.z) / 2;
  // The supplier datum is the line where the two rear mounting planes meet.
  // Move that datum from the terminating centreline to its actual side face.
  group.position
    .copy(jointPoint)
    .addScaledVector(supportDirection, terminatingHalfExtentAlongSupport);
  const widthDirection = new Vector3()
    .crossVectors(supportDirection, terminatingInterior)
    .normalize();
  // Manufacturer CAD is normalized to: X across bracket width, +Y along the
  // supporting-member leg, +Z from the end face into the terminating member.
  group.quaternion.setFromRotationMatrix(
    new Matrix4().makeBasis(widthDirection, supportDirection, terminatingInterior),
  );
  group.userData.connectionId = connection.id;
  group.userData.hardwareId = connection.connector.id;
  group.userData.placementStatus = "installed-face-transform";
  group.userData.mountingDatumMm = group.position.toArray();
  group.userData.mountingSide = connection.connector.mountingSide;
  group.userData.widthDirection = widthDirection.toArray();
  group.userData.supportDirection = supportDirection.toArray();
  group.userData.terminatingInteriorDirection = terminatingInterior.toArray();
  group.userData.terminatingHalfExtentAlongSupportMm = terminatingHalfExtentAlongSupport;
  const mesh = new Mesh(
    geometry.clone(),
    new MeshStandardMaterial({
      color: 0x4b5563,
      metalness: 0.8,
      roughness: 0.25,
    }),
  );
  mesh.name = `${connection.id}-${connection.connector.id}`;
  mesh.userData.geometryAdapter = "manufacturer-step";
  mesh.userData.manufacturerCadAsset =
    connection.connector.id === "hardware:wolweiss-cbr3030" ? "CBR3030.step" : "CBR3060.step";
  group.add(mesh);
  return group;
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
  const manufacturerCad = await loadManufacturerCad();
  const assemblies = buildEnclosureAssemblies(model);
  const root = new Group();
  root.name = model.frame.id;
  root.userData.frameId = model.frame.id;

  const members = model.members.map((member) => {
    const usesManufacturerCad =
      member.profile === "profile:aluminium-3030" || member.profile === "profile:aluminium-3060";
    const solid = createExtrusionSolid(member.length, member.profile);
    const geometry =
      member.profile === "profile:aluminium-3030"
        ? manufacturerCad.profile3030Geometry
            .clone()
            .scale(member.length / manufacturerCad.profile3030StockLengthMm, 1, 1)
        : member.profile === "profile:aluminium-3060"
          ? manufacturerCad.profile3060Geometry
              .clone()
              .scale(member.length / manufacturerCad.profile3060StockLengthMm, 1, 1)
          : shapeMesh(solid!);
    const object = new Mesh(
      geometry,
      new MeshStandardMaterial({
        color: 0xb8c2cc,
        metalness: 0.7,
        roughness: 0.3,
      }),
    );
    object.name = member.id;
    object.userData.memberId = member.id;
    object.userData.profileId = member.profile;
    object.userData.geometryAdapter = usesManufacturerCad ? "manufacturer-step" : "replicad";
    object.userData.solid = solid;
    if (usesManufacturerCad) {
      object.userData.manufacturerCadAsset =
        member.profile === "profile:aluminium-3030" ? "AST03003004.step" : "AST03006006.step";
    }
    object.userData.meshVertexCount = geometry.getAttribute("position").count;
    object.userData.lengthMm = member.length;
    applyMemberTransform(object, member);
    root.add(object);
    return object;
  });

  const assemblyObjects = new Map<string, Object3D>();
  const doors = (model.doors ?? []).map((door) => {
    const object = createDoor(
      model,
      door.id,
      door.nominalWidth,
      door.nominalHeight,
      manufacturerCad,
    );
    object.userData.basePosition = object.position.clone();
    const assembly = assemblies.find((candidate) => candidate.parts.includes(door.id));
    if (!assembly) throw new Error(`Missing assembly for ${door.id}`);
    object.userData.assemblyId = assembly.id;
    assemblyObjects.set(assembly.id, object);
    root.add(object);
    return object;
  });
  const stationaryHinges = model.doorHinges.flatMap((installation) => {
    if (installation.fitStatus !== "fits-leaf-height") return [];
    const object = createStationaryHinge(model, installation, manufacturerCad);
    root.add(object);
    return [object];
  });
  const biFoldDoors = model.biFoldDoors.openings.map((opening) => {
    const object = createBiFoldDoor(opening, manufacturerCad);
    root.add(object);
    return object;
  });
  // localToWorld must see evaluated member poses before connector joint points
  // are calculated; otherwise it uses stale identity matrices.
  root.updateMatrixWorld(true);
  const structuralConnectors = model.connections.flatMap((connection) => {
    const object = createExternalBracket(connection, members, manufacturerCad);
    if (!object) return [];
    root.add(object);
    return [object];
  });
  root.updateMatrixWorld(true);
  const closedDoorConnectorEnvelopeConflicts = structuralConnectors.flatMap((connector) => {
    const connectorBounds = new Box3().setFromObject(connector);
    const doorIds = doors
      .filter((door) => connectorBounds.intersectsBox(new Box3().setFromObject(door)))
      .map((door) => door.name);
    connector.userData.closedDoorEnvelopeConflicts = doorIds;
    return doorIds.map((doorId) => ({
      connectionId: connector.userData.connectionId as string,
      doorId,
    }));
  });
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

  const revision = JSON.stringify({
    dimensions: model.dimensions,
    members: model.members,
  });
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
    stationaryHinges,
    structuralConnectors,
    biFoldDoors,
    closedDoorConnectorEnvelopeConflicts,
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

import * as THREE from "three";
import type { Part } from "./api";

export interface MotionDoor {
  id: string;
  type: "swing" | "bifold";
  pivot: number[];
  base_deg: number;
  opening_sign: number;
  max_angle_deg: number;
  link_length_mm: number;
  mechanism?: string;
  primary_link_mm?: number[];
  secondary_link_mm?: number[];
  guide_normal_mm?: number;
}

export interface MotionModel {
  doors: MotionDoor[];
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

function rotateZ(
  [x, y, z]: number[],
  degrees: number,
): [number, number, number] {
  const angle = radians(degrees);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c, z];
}

function add(
  [ax, ay, az]: number[],
  [bx, by, bz]: number[],
): [number, number, number] {
  return [ax + bx, ay + by, az + bz];
}

/**
 * Return the rigid transform from a canonical closed mesh to a posed mesh.
 * The equations intentionally mirror core.pose_model: leaf b folds around
 * the moving elbow and the slider translates along the fixed base axis.
 */
export function poseTransform(
  part: Pick<Part, "motion_leaf">,
  door: MotionDoor,
  fraction: number,
): THREE.Matrix4 {
  if (!part.motion_leaf) return new THREE.Matrix4();
  const clamped = Math.max(0, Math.min(1, fraction));
  const theta = clamped * door.max_angle_deg * door.opening_sign;
  const base = door.base_deg;
  if (door.mechanism === "printed-guide-revision-c") {
    const p = door.primary_link_mm!;
    const q = door.secondary_link_mm!;
    const elbow = rotateZ(p, theta);
    const ratio = (door.guide_normal_mm! - elbow[1]) / Math.hypot(q[0], q[1]);
    if (Math.abs(ratio) > 1 + 1e-10)
      throw new Error("Bifold guide unreachable");
    const phi =
      ((Math.asin(Math.max(-1, Math.min(1, ratio))) - Math.atan2(q[1], q[0])) *
        180) /
      Math.PI;
    const closed =
      part.motion_leaf === "a"
        ? [0, 0, 0]
        : part.motion_leaf === "b"
          ? p
          : add(p, q);
    const posed =
      part.motion_leaf === "a"
        ? [0, 0, 0]
        : part.motion_leaf === "b"
          ? elbow
          : add(elbow, rotateZ(q, phi));
    const a = add(door.pivot, rotateZ(closed, base));
    const b = add(door.pivot, rotateZ(posed, base));
    const delta =
      part.motion_leaf === "a" ? theta : part.motion_leaf === "b" ? phi : 0;
    return new THREE.Matrix4()
      .makeTranslation(...b)
      .multiply(new THREE.Matrix4().makeRotationZ(radians(delta)))
      .multiply(new THREE.Matrix4().makeTranslation(-a[0], -a[1], -a[2]));
  }
  if (part.motion_leaf === "slider") {
    const closed = rotateZ([2 * door.link_length_mm, 0, 0], base);
    const posed = rotateZ(
      [2 * door.link_length_mm * Math.cos(radians(theta)), 0, 0],
      base,
    );
    return new THREE.Matrix4().makeTranslation(
      posed[0] - closed[0],
      posed[1] - closed[1],
      0,
    );
  }

  const closedOrigin =
    part.motion_leaf === "b"
      ? add(door.pivot, rotateZ([door.link_length_mm, 0, 0], base))
      : door.pivot;
  const posedOrigin =
    part.motion_leaf === "b"
      ? add(door.pivot, rotateZ([door.link_length_mm, 0, 0], base + theta))
      : door.pivot;
  const delta = part.motion_leaf === "b" ? -theta : theta;
  return new THREE.Matrix4()
    .makeTranslation(posedOrigin[0], posedOrigin[1], posedOrigin[2])
    .multiply(new THREE.Matrix4().makeRotationZ(radians(delta)))
    .multiply(
      new THREE.Matrix4().makeTranslation(
        -closedOrigin[0],
        -closedOrigin[1],
        -closedOrigin[2],
      ),
    );
}

export function applyPoseToMesh(
  mesh: THREE.Mesh,
  part: Pick<Part, "motion_leaf">,
  door: MotionDoor | undefined,
  fraction: number,
): void {
  mesh.matrix.copy(
    door && part.motion_leaf
      ? poseTransform(part, door, fraction)
      : new THREE.Matrix4(),
  );
  mesh.matrixAutoUpdate = false;
  mesh.matrixWorldNeedsUpdate = true;
}

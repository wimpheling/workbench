import type { AnchorReference } from "../domain/anchors";
import type { Point3, Transform, Vector3 } from "../domain/frames";

export type Motion =
  | { kind: "revolute"; axis: Vector3; origin: AnchorReference; min: number; max: number }
  | { kind: "prismatic"; axis: Vector3; origin: AnchorReference; min: number; max: number };
export type KinematicState = Readonly<{ values: Readonly<Record<string, number>> }>;
export type MotionDefinition = Readonly<{ id: string; motion: Motion; transform?: Transform }>;
export type KinematicIssue = {
  id: string;
  motionId: string;
  message: string;
  value: number;
  expected: { min: number; max: number };
};
export type KinematicResult = { state: KinematicState; issues: KinematicIssue[] };
export type MotionPose = Readonly<Record<string, number>>;

const normalize = (v: Vector3): Vector3 => {
  const length = Math.hypot(v.x, v.y, v.z);
  if (!length) throw new Error("Motion axis cannot be zero");
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const identityTransform = (): Transform => ({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
});
export const translate = (point: Point3, axis: Vector3, distance: number): Point3 => {
  const unit = normalize(axis);
  return {
    x: point.x + unit.x * distance,
    y: point.y + unit.y * distance,
    z: point.z + unit.z * distance,
  };
};
export const motionPosition = (motion: Motion, value: number, origin: Point3): Point3 =>
  motion.kind === "prismatic" ? translate(origin, motion.axis, value) : origin;
export const rotateAround = (
  point: Point3,
  origin: Point3,
  axis: Vector3,
  angle: number,
): Point3 => {
  const u = normalize(axis);
  const p = { x: point.x - origin.x, y: point.y - origin.y, z: point.z - origin.z };
  const c = Math.cos(angle),
    s = Math.sin(angle),
    d = u.x * p.x + u.y * p.y + u.z * p.z;
  const cross = { x: u.y * p.z - u.z * p.y, y: u.z * p.x - u.x * p.z, z: u.x * p.y - u.y * p.x };
  return {
    x: origin.x + p.x * c + cross.x * s + u.x * d * (1 - c),
    y: origin.y + p.y * c + cross.y * s + u.y * d * (1 - c),
    z: origin.z + p.z * c + cross.z * s + u.z * d * (1 - c),
  };
};
export const evaluateMotions = (
  motions: readonly MotionDefinition[],
  requested: Readonly<Record<string, number>>,
): KinematicResult => {
  const values: Record<string, number> = {};
  const issues: KinematicIssue[] = [];
  for (const item of motions) {
    const value = requested[item.id] ?? item.motion.min;
    const { min, max } = item.motion;
    if (!Number.isFinite(value) || value < min || value > max)
      issues.push({
        id: `kinematics.${item.id}.limits`,
        motionId: item.id,
        message: `${item.id} is outside motion limits`,
        value,
        expected: { min, max },
      });
    values[item.id] = clamp(value, min, max);
  }
  return { state: { values: Object.freeze(values) }, issues };
};
export const namedState = (id: string, motions: Readonly<Record<string, number>>) =>
  Object.freeze({ id, motions: Object.freeze({ ...motions }) });
export type AssemblyState = ReturnType<typeof namedState>;
export type Assembly = {
  id: string;
  name: string;
  frame: string;
  parts: readonly string[];
  children: readonly string[];
  motions: readonly MotionDefinition[];
  states: readonly AssemblyState[];
};
export const evaluateAssemblyState = (assembly: Assembly, state: AssemblyState): KinematicResult =>
  evaluateMotions(assembly.motions, state.motions);
export const assemblyPose = (assembly: Assembly, state: AssemblyState): MotionPose =>
  evaluateAssemblyState(assembly, state).state.values;
export const composeTransforms = (parent: Transform, child: Transform): Transform => ({
  position: {
    x: parent.position.x + child.position.x,
    y: parent.position.y + child.position.y,
    z: parent.position.z + child.position.z,
  },
  rotation: {
    x: parent.rotation.x + child.rotation.x,
    y: parent.rotation.y + child.rotation.y,
    z: parent.rotation.z + child.rotation.z,
  },
});

export const defaultDoorMotion = (origin: AnchorReference): MotionDefinition => ({
  id: "left-door-angle",
  motion: { kind: "revolute", axis: { x: 0, y: 1, z: 0 }, origin, min: 0, max: Math.PI / 2 },
});
export const defaultDoorStates = () => [
  namedState("closed", { "left-door-angle": 0 }),
  namedState("open", { "left-door-angle": Math.PI / 2 }),
];
export { normalize };

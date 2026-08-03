import type { AnchorReference } from "./anchors";
import type { EnclosureModel } from "./enclosureV2";
import {
  defaultDoorMotion,
  defaultDoorStates,
  evaluateAssemblyState,
  type Assembly,
  type AssemblyState,
  type KinematicResult,
} from "../validation/kinematics";

export const buildEnclosureAssemblies = (model: EnclosureModel): readonly Assembly[] => {
  if (!model.doors?.length) return [];
  return model.doors.map((door, index) => {
    const hinge: AnchorReference = index === 0 ? "anchor:left-hinge" : "anchor:right-hinge";
    const motion = defaultDoorMotion(hinge);
    motion.id = `${door.id}.angle`;
    return {
      id: `assembly:${door.id}`,
      name: door.id,
      frame: model.frame.id,
      parts: [door.id],
      children: [],
      motions: [motion],
      states: defaultDoorStates().map((state) => ({
        id: state.id,
        motions: { [`${door.id}.angle`]: state.id === "open" ? Math.PI / 2 : 0 },
      })),
    };
  });
};

export const evaluateEnclosureAssemblyState = (
  assembly: Assembly,
  state: AssemblyState,
): KinematicResult => evaluateAssemblyState(assembly, state);
export const assemblyState = (assembly: Assembly, id: string): AssemblyState => {
  const state = assembly.states.find((candidate) => candidate.id === id);
  if (!state) throw new Error(`Unknown assembly state: ${id}`);
  return state;
};

export type DoorPose = Readonly<Record<"left-door.angle" | "right-door.angle", number>>;

export const evaluateEnclosureDoorPose = (model: EnclosureModel, stateId: string): DoorPose => {
  const pose = {} as Record<"left-door.angle" | "right-door.angle", number>;
  for (const assembly of buildEnclosureAssemblies(model)) {
    const result = evaluateEnclosureAssemblyState(assembly, assemblyState(assembly, stateId));
    const motion = assembly.motions[0];
    if (!motion || result.issues.length) throw new Error(`Invalid door state: ${stateId}`);
    pose[motion.id as "left-door.angle" | "right-door.angle"] = result.state.values[motion.id] ?? 0;
  }
  return pose;
};

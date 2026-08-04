import type { AnchorReference } from "./anchors";
import type { EnclosureModel } from "./enclosureV2";
import {
  defaultDoorMotion,
  defaultDoorStates,
  evaluateAssemblyState,
  type Assembly,
  type AssemblyState,
  type KinematicResult,
  type MotionPose,
} from "../validation/kinematics";

export const buildEnclosureAssemblies = (model: EnclosureModel): readonly Assembly[] => {
  const rootId = "assembly:enclosure";
  const doors = (model.doors ?? []).map((door, index) => {
    const hinge: AnchorReference = index === 0 ? "anchor:left-hinge" : "anchor:right-hinge";
    const motion = defaultDoorMotion(hinge);
    motion.id = `${door.id}.angle`;
    motion.motion =
      index === 0
        ? { ...motion.motion, min: -Math.PI / 2, max: 0 }
        : { ...motion.motion, min: 0, max: Math.PI / 2 };
    return {
      id: `assembly:${door.id}`,
      name: door.id,
      frame: model.frame.id,
      parts: [door.id],
      parent: rootId,
      children: [],
      motions: [motion],
      states: defaultDoorStates().map((state) => ({
        id: state.id,
        motions: {
          [`${door.id}.angle`]:
            state.id === "open" ? (index === 0 ? -Math.PI / 2 : Math.PI / 2) : 0,
        },
      })),
    };
  });
  const slider = model.serviceSlider
    ? [
        {
          id: `assembly:${model.serviceSlider.id}`,
          name: model.serviceSlider.id,
          frame: model.frame.id,
          parts: [model.serviceSlider.id],
          parent: rootId,
          children: [],
          motions: [
            {
              id: `${model.serviceSlider.id}.travel`,
              motion: {
                kind: "prismatic" as const,
                axis: { x: 1, y: 0, z: 0 },
                origin: model.serviceSlider.anchor as AnchorReference,
                min: 0,
                max: model.serviceSlider.travel,
              },
            },
          ],
          states: [
            { id: "closed", motions: { [`${model.serviceSlider.id}.travel`]: 0 } },
            {
              id: "service",
              motions: { [`${model.serviceSlider.id}.travel`]: model.serviceSlider.travel },
            },
          ],
        } satisfies Assembly,
      ]
    : [];
  return [
    {
      id: rootId,
      name: "EnclosureV2",
      frame: model.frame.id,
      parts: model.members.map((member) => member.id),
      children: [...doors, ...slider].map((assembly) => assembly.id),
      motions: [],
      states: [],
    },
    ...doors,
    ...slider,
  ];
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

export const evaluateEnclosureAssemblyPose = (
  model: EnclosureModel,
  stateId: string,
): MotionPose => {
  const pose: Record<string, number> = {};
  for (const assembly of buildEnclosureAssemblies(model)) {
    const state =
      assembly.states.find((candidate) => candidate.id === stateId) ??
      assembly.states.find((candidate) => candidate.id === "closed");
    if (!state) continue;
    const result = evaluateEnclosureAssemblyState(assembly, state);
    if (result.issues.length) throw new Error(`Invalid assembly state: ${stateId}`);
    Object.assign(pose, result.state.values);
  }
  return pose;
};

/** @deprecated Use evaluateEnclosureAssemblyPose. */
export const evaluateEnclosureDoorPose = evaluateEnclosureAssemblyPose;

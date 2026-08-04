import { type Group, type Object3D } from "three";
import type { Shape3D } from "replicad";
import { cloneShape, transformShapeToWorld } from "../geometry/replicadTransform";
import {
  checkSolidClearance,
  solidCheckStatusIsBlocking,
  type SolidCheckResult,
} from "./solidChecks";

export type DoorMotionState = Readonly<{
  "left-door.angle": number;
  "right-door.angle": number;
}>;
export type MotionSolidCheckOptions = Readonly<{
  doors: readonly Group[];
  staticMeshes: readonly Object3D[];
  samples?: number;
  maxStates?: number;
  minimumClearance?: number;
}>;
export type MotionSolidCheckResult = {
  status: "clear" | "collision" | "insufficient-clearance" | "incomplete";
  verified: boolean;
  states: readonly DoorMotionState[];
  checkedStates: number;
  checkedPairs: readonly { subject: string; target: string }[];
  firstFailure?: SolidCheckResult & { state: DoorMotionState };
  diagnostics: string[];
};

const normaliseSamples = (value: number | undefined): number =>
  Number.isFinite(value) ? Math.max(2, Math.floor(value as number)) : 9;
const normaliseMaxStates = (value: number | undefined, fallback: number): number =>
  value === undefined || !Number.isFinite(value) ? fallback : Math.max(0, Math.floor(value));
const angleGrid = (samples: number, end: number): number[] =>
  Array.from({ length: samples }, (_, index) => (index === 0 ? 0 : (end * index) / (samples - 1)));

export const cartesianDoorStates = (options: { samples?: number; maxStates?: number } = {}) => {
  const samples = normaliseSamples(options.samples);
  const all: DoorMotionState[] = [];
  for (const left of angleGrid(samples, -Math.PI / 2))
    for (const right of angleGrid(samples, Math.PI / 2))
      all.push({ "left-door.angle": left, "right-door.angle": right });
  return all.slice(0, normaliseMaxStates(options.maxStates, all.length));
};

type SolidItem = { id: string; door?: string; shape: Shape3D };
const meshes = (door: Group): SolidItem[] => {
  door.updateMatrixWorld(true);
  const result: SolidItem[] = [];
  door.traverse((child) => {
    if (child.userData.solid) {
      result.push({
        id: child.name,
        door: door.name,
        shape: transformShapeToWorld(child.userData.solid as Shape3D, child),
      });
    }
  });
  return result;
};

export const checkDoorMotionSolids = (options: MotionSolidCheckOptions): MotionSolidCheckResult => {
  const samples = normaliseSamples(options.samples);
  const requested = cartesianDoorStates({ samples, maxStates: options.maxStates });
  const totalStates = samples * samples;
  const minimum = options.minimumClearance ?? 2;
  const checkedPairs: { subject: string; target: string }[] = [];
  let firstFailure: MotionSolidCheckResult["firstFailure"];
  let firstClearanceFailure: MotionSolidCheckResult["firstFailure"];
  let kernelError: string | undefined;
  let checkedStates = 0;
  const initialRotations = options.doors.map((door) => door.rotation.clone());
  try {
    for (const state of requested) {
      options.doors.forEach((door, index) => {
        // Angles are absolute: never accumulate a previous sampled state.
        door.rotation.y = index === 0 ? state["left-door.angle"] : state["right-door.angle"];
      });
      options.doors[0]?.parent?.updateMatrixWorld(true);
      options.doors[0]?.updateMatrixWorld(true);
      options.doors[1]?.updateMatrixWorld(true);
      const moving = options.doors.flatMap(meshes);
      const statics: SolidItem[] = options.staticMeshes.flatMap((object) =>
        object.userData.solid
          ? [
              {
                id: object.name,
                shape: transformShapeToWorld(object.userData.solid as Shape3D, object),
              },
            ]
          : [],
      );
      const items = [...moving, ...statics];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i],
            b = items[j];
          if (a.door && b.door && a.door === b.door) continue;
          if (!a.door && !b.door) continue;
          const pair = { subject: a.id, target: b.id };
          if (
            !checkedPairs.some(
              (candidate) => candidate.subject === pair.subject && candidate.target === pair.target,
            )
          )
            checkedPairs.push(pair);
          const check = checkSolidClearance(
            new Map([
              [a.id, cloneShape(a.shape)],
              [b.id, cloneShape(b.shape)],
            ]),
            {
              id: `motion.${a.id}.${b.id}`,
              subject: a.id,
              target: b.id,
              minimum,
            },
          );
          if (solidCheckStatusIsBlocking(check.status)) {
            const failure = { ...check, state };
            if (check.status === "insufficient-clearance") {
              firstClearanceFailure ??= failure;
              continue;
            }
            firstFailure = failure;
            return {
              // The sweep stopped at the first proven collision, so the complete
              // state space is not verified even though this collision is real.
              status: "collision",
              verified: false,
              states: requested,
              checkedStates: checkedStates + 1,
              checkedPairs,
              firstFailure,
              diagnostics: [
                ...(firstClearanceFailure
                  ? [
                      `insufficient clearance was found earlier between ${firstClearanceFailure.subject} and ${firstClearanceFailure.target}; the sweep continued to check for collision`,
                    ]
                  : []),
                ...check.diagnostics,
                `collision found before all ${totalStates} states were checked; collision is a blocking sampled-state result`,
              ],
            };
          }
          if (check.status === "indeterminate") kernelError = check.diagnostics.join("; ");
        }
      }
      checkedStates++;
    }
  } catch (error) {
    kernelError = error instanceof Error ? error.message : String(error);
  } finally {
    options.doors.forEach((door, index) => door.rotation.copy(initialRotations[index]));
    options.doors[0]?.parent?.updateMatrixWorld(true);
    options.doors.forEach((door) => door.updateMatrixWorld(true));
  }
  if (kernelError) {
    return {
      status: "incomplete",
      verified: false,
      states: requested,
      checkedStates,
      checkedPairs,
      firstFailure: firstClearanceFailure,
      diagnostics: [
        `Replicad/OpenCascade indéterminé: ${kernelError}`,
        ...(firstClearanceFailure
          ? [
              `un dégagement insuffisant avait été observé entre ${firstClearanceFailure.subject} et ${firstClearanceFailure.target} avant l'erreur noyau`,
              ...firstClearanceFailure.diagnostics,
            ]
          : []),
      ],
    };
  }
  if (firstClearanceFailure) {
    return {
      status: "insufficient-clearance",
      verified: false,
      states: requested,
      checkedStates,
      checkedPairs,
      firstFailure: firstClearanceFailure,
      diagnostics: [
        ...firstClearanceFailure.diagnostics,
        "insufficient clearance is a blocking sampled-state result; the sweep found no positive-volume collision",
      ],
    };
  }
  const incomplete = Boolean(kernelError) || requested.length < totalStates;
  return {
    status: incomplete ? "incomplete" : "clear",
    verified: !incomplete,
    states: requested,
    checkedStates,
    checkedPairs,
    diagnostics: [
      ...(kernelError ? [`Replicad/OpenCascade indéterminé: ${kernelError}`] : []),
      `clear signifie uniquement que les états échantillonnés ont été vérifiés; ce n'est PAS une preuve continue de l'absence de collision`,
      ...(requested.length < totalStates
        ? [
            `budget maxStates=${options.maxStates ?? totalStates}: ${requested.length}/${totalStates} états couverts`,
          ]
        : []),
    ],
  };
};

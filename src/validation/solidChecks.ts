import { measureDistanceBetween, measureVolume, type Shape3D } from "replicad";
import { cloneShape } from "../geometry/replicadTransform";

export type SolidCheckStatus = "clear" | "collision" | "insufficient-clearance" | "indeterminate";
export type SolidCheckResult = {
  id: string;
  status: SolidCheckStatus;
  minimum?: number;
  distance?: number;
  intersection?: boolean;
  diagnostics: string[];
  subject: string;
  target: string;
};
export type SolidPair = { id: string; shape: Shape3D };
export type ClearanceCheck = {
  id: string;
  subject: string;
  target: string;
  minimum: number;
  volumeTolerance?: number;
};

export const checkSolidClearance = (
  solids: ReadonlyMap<string, Shape3D>,
  check: ClearanceCheck,
): SolidCheckResult => {
  const subject = solids.get(check.subject);
  const target = solids.get(check.target);
  if (!subject || !target)
    return {
      id: check.id,
      status: "indeterminate",
      minimum: check.minimum,
      diagnostics: ["subject or target solid is unavailable"],
      subject: check.subject,
      target: check.target,
    };
  try {
    const intersection = cloneShape(subject).intersect(cloneShape(target));
    const volume = intersection.isNull ? 0 : measureVolume(intersection);
    const distance = measureDistanceBetween(cloneShape(subject), cloneShape(target));
    const collided = volume > (check.volumeTolerance ?? 1e-6);
    return {
      id: check.id,
      status: collided
        ? "collision"
        : distance < check.minimum
          ? "insufficient-clearance"
          : "clear",
      minimum: check.minimum,
      distance,
      intersection: collided,
      diagnostics: collided
        ? [`positive-volume intersection: ${volume}`]
        : distance < check.minimum
          ? [`distance ${distance} is below ${check.minimum}`]
          : [],
      subject: check.subject,
      target: check.target,
    };
  } catch (error) {
    return {
      id: check.id,
      status: "indeterminate",
      minimum: check.minimum,
      diagnostics: [error instanceof Error ? error.message : String(error)],
      subject: check.subject,
      target: check.target,
    };
  }
};

export const checkSolidPairs = (solids: readonly SolidPair[], checks: readonly ClearanceCheck[]) =>
  checks.map((check) =>
    checkSolidClearance(new Map(solids.map((solid) => [solid.id, cloneShape(solid.shape)])), check),
  );

export type BroadPhaseBox = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};
export const boxesOverlap = (a: BroadPhaseBox, b: BroadPhaseBox) =>
  a.min.x <= b.max.x &&
  a.max.x >= b.min.x &&
  a.min.y <= b.max.y &&
  a.max.y >= b.min.y &&
  a.min.z <= b.max.z &&
  a.max.z >= b.min.z;
export const solidCheckStatusIsBlocking = (status: SolidCheckStatus) =>
  status === "collision" || status === "insufficient-clearance";

export type GeometryCheckInput = { id: string; subject: Shape3D; target: Shape3D; minimum: number };
export const checkGeometry = (input: GeometryCheckInput) =>
  checkSolidClearance(
    new Map([
      ["subject", input.subject],
      ["target", input.target],
    ]),
    {
      id: input.id,
      subject: "subject",
      target: "target",
      minimum: input.minimum,
    },
  );

export type { Shape3D };

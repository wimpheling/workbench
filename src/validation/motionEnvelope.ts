import type { MotionDefinition } from "./kinematics";
import { evaluateMotions } from "./kinematics";
export type MotionEnvelopeOptions = Readonly<{
  samples?: number;
  minimumClearance?: number;
  maxRefinements?: number;
}>;
export type MotionEnvelopeResult = {
  status: "clear" | "collision" | "incomplete";
  samples: number[];
  minimum: { value: number; clearance: number };
  diagnostics: string[];
  verified: boolean;
};
export type ClearanceAt = (value: number) => number;
export const sampleMotionEnvelope = (
  motion: MotionDefinition,
  clearanceAt: ClearanceAt,
  options: MotionEnvelopeOptions = {},
): MotionEnvelopeResult => {
  const samples = Math.max(2, options.samples ?? 9);
  const minimumClearance = options.minimumClearance ?? 0;
  const values = Array.from(
    { length: samples },
    (_, index) =>
      motion.motion.min + ((motion.motion.max - motion.motion.min) * index) / (samples - 1),
  );
  const measured = values.map((value) => ({ value, clearance: clearanceAt(value) }));
  const maxRefinements = Math.max(0, options.maxRefinements ?? 0);
  const refined = [...measured];
  for (let pass = 0; pass < maxRefinements; pass++) {
    const ordered = [...refined].sort((a, b) => a.value - b.value);
    let inserted = false;
    for (let index = 0; index < ordered.length - 1; index++) {
      const left = ordered[index];
      const right = ordered[index + 1];
      if (left.clearance < minimumClearance !== right.clearance < minimumClearance) {
        const value = (left.value + right.value) / 2;
        refined.push({ value, clearance: clearanceAt(value) });
        inserted = true;
        break;
      }
    }
    if (!inserted) break;
  }
  const finalMinimum = refined.reduce((best, current) =>
    current.clearance < best.clearance ? current : best,
  );
  const diagnostics = refined
    .filter((item) => item.clearance < minimumClearance)
    .map((item) => `clearance ${item.clearance} at ${item.value}`);
  return {
    status: diagnostics.length ? "collision" : "clear",
    samples: refined.map((item) => item.value).sort((a, b) => a - b),
    minimum: finalMinimum,
    diagnostics,
    verified: true,
  };
};
export const validateMotionState = (motion: MotionDefinition, value: number) =>
  evaluateMotions([motion], { [motion.id]: value });

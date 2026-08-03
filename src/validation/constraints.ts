import type { Anchor } from "../domain/anchors";
import type { Point3, Vector3 } from "../domain/frames";
import type { EnclosureModel } from "../domain/enclosureV2";

export type ConstraintSeverity = "error" | "warning";
export type ConstraintResult = {
  id: string;
  severity: ConstraintSeverity;
  passed: boolean;
  message: string;
  references: string[];
  measured?: number;
  expected?: number;
};
const EPS = 1e-6;
const result = (
  id: string,
  passed: boolean,
  message: string,
  references: string[] = [],
  measured?: number,
  expected?: number,
  severity: ConstraintSeverity = "error",
): ConstraintResult => ({
  id,
  severity,
  passed,
  message,
  references,
  ...(measured === undefined ? {} : { measured }),
  ...(expected === undefined ? {} : { expected }),
});
const scalar = (
  id: string,
  passed: boolean,
  measured: number,
  expected: number,
  text: string,
  refs: string[] = [],
) =>
  result(
    id,
    passed,
    `${text}: measured ${measured}, expected ${expected}`,
    refs,
    measured,
    expected,
  );
const mag = (v: Vector3) => Math.hypot(v.x, v.y, v.z);
const sub = (a: Point3, b: Point3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Vector3, b: Vector3) => a.x * b.x + a.y * b.y + a.z * b.z;
const crossMag = (a: Vector3, b: Vector3) =>
  Math.hypot(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

export const PositiveLength = (id: string, length: number, references: string[] = []) =>
  result(
    id,
    Number.isFinite(length) && length > 0,
    `length must be positive: measured ${length}`,
    references,
    length,
    0,
  );
export const Equal = (
  id: string,
  a: number,
  b: number,
  references: string[] = [],
  tolerance = EPS,
) =>
  scalar(id, Math.abs(a - b) <= tolerance, Math.abs(a - b), 0, "values must be equal", references);
export const CenteredOn = (
  id: string,
  value: number,
  start: number,
  end: number,
  references: string[] = [],
  tolerance = EPS,
) =>
  scalar(
    id,
    Math.abs(value - (start + end) / 2) <= tolerance,
    value,
    (start + end) / 2,
    "value must be centered",
    references,
  );
export const Between = (
  id: string,
  value: number,
  min: number,
  max: number,
  references: string[] = [],
  tolerance = EPS,
) =>
  result(
    id,
    value >= min - tolerance && value <= max + tolerance,
    `${value} must be between ${min} and ${max}`,
    references,
    value,
    (min + max) / 2,
  );
export const Coincident = (
  id: string,
  a: Point3,
  b: Point3,
  references: string[] = [],
  tolerance = EPS,
) => scalar(id, mag(sub(a, b)) <= tolerance, mag(sub(a, b)), 0, "points must coincide", references);
export const Parallel = (
  id: string,
  a: Vector3,
  b: Vector3,
  references: string[] = [],
  tolerance = EPS,
) =>
  scalar(
    id,
    crossMag(a, b) <= tolerance * mag(a) * mag(b),
    crossMag(a, b),
    0,
    "vectors must be parallel",
    references,
  );
export const Perpendicular = (
  id: string,
  a: Vector3,
  b: Vector3,
  references: string[] = [],
  tolerance = EPS,
) =>
  scalar(
    id,
    Math.abs(dot(a, b)) <= tolerance * mag(a) * mag(b),
    Math.abs(dot(a, b)),
    0,
    "vectors must be perpendicular",
    references,
  );
export const Distance = (
  id: string,
  a: Point3,
  b: Point3,
  expectedDistance: number,
  references: string[] = [],
  tolerance = EPS,
) =>
  scalar(
    id,
    Math.abs(mag(sub(a, b)) - expectedDistance) <= tolerance,
    mag(sub(a, b)),
    expectedDistance,
    "distance mismatch",
    references,
  );
export const FitsWithin = (
  id: string,
  item: Point3,
  container: Point3,
  references: string[] = [],
  tolerance = EPS,
) => {
  const measured = Math.max(item.x - container.x, item.y - container.y, item.z - container.z);
  return scalar(id, measured <= tolerance, measured, 0, "item exceeds bounds by", references);
};
export const ClearanceAtLeast = (
  id: string,
  clearance: number,
  minimum: number,
  references: string[] = [],
) =>
  scalar(
    id,
    clearance >= minimum - EPS,
    clearance,
    minimum,
    "clearance must be at least",
    references,
  );
export const SymmetricAbout = (
  id: string,
  a: number,
  b: number,
  center: number,
  references: string[] = [],
  tolerance = EPS,
) =>
  scalar(
    id,
    Math.abs((a + b) / 2 - center) <= tolerance,
    (a + b) / 2,
    center,
    "pair must be symmetric about",
    references,
  );
export const SupportedBy = (
  id: string,
  point: Point3,
  supports: readonly Point3[],
  references: string[] = [],
  tolerance = EPS,
) => {
  const supported = supports.some(
    (s) =>
      Math.abs(point.y - s.y) <= tolerance &&
      Math.abs(point.z - s.z) <= tolerance &&
      point.x >= s.x - tolerance,
  );
  return result(
    id,
    supported,
    supported ? "point is supported" : "point is not supported",
    references,
  );
};

const anchorPoint = (model: EnclosureModel, ref: string) =>
  model.anchors[ref] ?? Object.values(model.anchors).find((a) => a.id === ref);
export function validateModel(model: EnclosureModel): ConstraintResult[] {
  const out: ConstraintResult[] = [];
  for (const member of model.members)
    out.push(PositiveLength(`member.${member.id}.positive-length`, member.length, [member.id]));
  const sides = model.members.filter(
    (m) =>
      String(m.id).endsWith(":side-middle-left") || String(m.id).endsWith(":side-middle-right"),
  );
  for (const member of sides) {
    const from = anchorPoint(model, member.from),
      to = anchorPoint(model, member.to);
    const midpoint = from && to ? (from.position.z + to.position.z) / 2 : NaN;
    const expected = -model.dimensions!.z / 2;
    out.push(
      scalar(
        `enclosure.${member.id}.depth-midpoint`,
        Number.isFinite(midpoint) && Math.abs(midpoint - expected) <= EPS,
        midpoint,
        expected,
        "side support depth midpoint",
        [member.id, member.from, member.to],
      ),
    );
  }
  out.push(
    result(
      "enclosure.front.no-middle-support",
      !model.members.some((m) => m.id.includes("front-middle")),
      "front opening has no middle support",
      model.members.filter((m) => m.id.includes("front-middle")).map((m) => m.id),
    ),
  );
  for (const id of ["front-top", "front-left-post", "front-right-post"]) {
    const m = model.members.find(
      (member) => String(member.id).endsWith(`:${id}`) || String(member.id) === id,
    );
    if (m)
      out.push(
        result(
          `enclosure.front.${id}.profile`,
          Boolean(m) && m.profile === "profile:aluminium-3060",
          `${id} must use aluminium-3060`,
          m ? [String(m.id)] : [id],
        ),
      );
    else out.push(result(`enclosure.front.${id}.required`, false, `${id} is required`, [id]));
  }
  if (model.doors) {
    const [a, b] = model.doors;
    if (a && b) {
      out.push(Equal("enclosure.doors.equal-width", a.nominalWidth, b.nominalWidth, [a.id, b.id]));
      const opening = model.dimensions?.x ?? 0;
      out.push(
        result(
          "enclosure.doors.cover-opening",
          a.nominalWidth + b.nominalWidth >= opening - EPS,
          `doors cover opening: total ${a.nominalWidth}, expected at least ${opening}`,
          [a.id, b.id],
          a.nominalWidth + b.nominalWidth,
          opening,
        ),
      );
    }
  }
  if (model.panels)
    for (const panel of model.panels) {
      const anchor = anchorPoint(model, panel.anchor);
      const wideFace = panel.orientation?.wideFace;
      const extents =
        wideFace === "left" || wideFace === "right"
          ? { x: panel.size.z, y: panel.size.y, z: panel.size.x }
          : wideFace === "top" || wideFace === "bottom"
            ? { x: panel.size.x, y: panel.size.z, z: panel.size.y }
            : { x: panel.size.x, y: panel.size.y, z: panel.size.z };
      const panelBounds = anchor
        ? {
            x: anchor.position.x + extents.x,
            y: anchor.position.y + extents.y,
            z: anchor.position.z + extents.z,
          }
        : extents;
      out.push(
        FitsWithin(
          `panel.${panel.id}.bounds`,
          panelBounds,
          model.dimensions ?? { x: Infinity, y: Infinity, z: Infinity },
          [panel.id],
        ),
      );
      out.push(
        result(
          `panel.${panel.id}.anchor`,
          Boolean(anchorPoint(model, panel.anchor)),
          `panel requires anchor ${panel.anchor}`,
          [panel.id, panel.anchor],
        ),
      );
      out.push(
        result(
          `panel.${panel.id}.orientation`,
          Boolean(panel.orientation),
          `panel requires orientation`,
          [panel.id],
        ),
      );
    }
  return out;
}

export const validateOrThrow = (model: EnclosureModel) => {
  const failures = validateModel(model).filter((r) => !r.passed && r.severity === "error");
  if (failures.length) throw new Error(failures.map((r) => r.message).join("; "));
  return model;
};
export type { Anchor };
export { result as constraintResult };

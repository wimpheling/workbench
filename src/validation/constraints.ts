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
type Bounds = { min: Point3; max: Point3 };
const fitsWithinBounds = (
  id: string,
  bounds: Bounds,
  container: Bounds,
  references: string[] = [],
) => {
  const overflow = Math.max(
    container.min.x - bounds.min.x,
    bounds.max.x - container.max.x,
    container.min.y - bounds.min.y,
    bounds.max.y - container.max.y,
    container.min.z - bounds.min.z,
    bounds.max.z - container.max.z,
  );
  return scalar(id, overflow <= EPS, overflow, 0, "item exceeds bounds by", references);
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
  if (!model.dimensions) {
    out.push(result("enclosure.dimensions.required", false, "enclosure dimensions are required"));
    return out;
  }
  const referencedAnchors = new Set(model.members.flatMap((member) => [member.from, member.to]));
  for (const [id, anchor] of Object.entries(model.anchors)) {
    if (id !== anchor.id && id.startsWith("anchor:") && !referencedAnchors.has(anchor.id))
      out.push(
        result(`anchor.${anchor.id}.orphaned`, false, `anchor ${anchor.id} is not referenced`, [
          anchor.id,
        ]),
      );
  }
  for (const member of model.members) {
    out.push(PositiveLength(`member.${member.id}.positive-length`, member.length, [member.id]));
    if (
      member.orientation?.wideFace &&
      !["front", "back", "left", "right", "top", "bottom"].includes(member.orientation.wideFace)
    )
      out.push(
        result(
          `member.${member.id}.orientation`,
          false,
          `invalid profile orientation: ${member.orientation.wideFace}`,
          [member.id],
        ),
      );
  }
  const sides = model.members.filter(
    (m) =>
      String(m.id).endsWith(":side-middle-left") || String(m.id).endsWith(":side-middle-right"),
  );
  for (const member of sides) {
    const from = anchorPoint(model, member.from),
      to = anchorPoint(model, member.to);
    const midpoint = from && to ? (from.position.z + to.position.z) / 2 : NaN;
    // Legacy enclosure supports sit 30 mm behind the clear-depth midpoint so
    // their 3060 profile clears the side rails. The input depth is the clear
    // dimension, not the outer profile envelope.
    const expected = -model.dimensions.z / 2 - 30;
    out.push(
      scalar(
        `enclosure.${member.id}.depth-midpoint`,
        Number.isFinite(midpoint) && Math.abs(midpoint - expected) <= EPS,
        midpoint,
        expected,
        "side support historical depth axis",
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
      const seamClearance = model.doorSeamClearance ?? 0;
      out.push(
        result(
          "enclosure.doors.seam-clearance",
          seamClearance >= 0,
          `door seam clearance must be non-negative: measured ${seamClearance}`,
          [a.id, b.id],
          seamClearance,
          0,
        ),
      );
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
      const validFaces = ["front", "back", "left", "right", "top", "bottom"] as const;
      const validOrientation = wideFace === undefined || validFaces.includes(wideFace);
      const offset =
        wideFace === "front"
          ? { x: panel.size.x, y: panel.size.y, z: -panel.size.z }
          : wideFace === "back"
            ? { x: panel.size.x, y: panel.size.y, z: panel.size.z }
            : wideFace === "left"
              ? { x: -panel.size.z, y: panel.size.y, z: panel.size.x }
              : wideFace === "right"
                ? { x: panel.size.z, y: panel.size.y, z: panel.size.x }
                : wideFace === "top"
                  ? { x: panel.size.x, y: panel.size.z, z: panel.size.y }
                  : wideFace === "bottom"
                    ? { x: panel.size.x, y: -panel.size.z, z: panel.size.y }
                    : { x: panel.size.x, y: panel.size.y, z: panel.size.z };
      const origin = anchor?.position ?? { x: 0, y: 0, z: 0 };
      const panelBounds = {
        min: {
          x: Math.min(origin.x, origin.x + offset.x),
          y: Math.min(origin.y, origin.y + offset.y),
          z: Math.min(origin.z, origin.z + offset.z),
        },
        max: {
          x: Math.max(origin.x, origin.x + offset.x),
          y: Math.max(origin.y, origin.y + offset.y),
          z: Math.max(origin.z, origin.z + offset.z),
        },
      };
      out.push(
        fitsWithinBounds(
          `panel.${panel.id}.bounds`,
          panelBounds,
          {
            min: { x: 0, y: 0, z: -model.dimensions.z },
            max: { x: model.dimensions.x, y: model.dimensions.y, z: 0 },
          },
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
          validOrientation && Boolean(panel.orientation),
          validOrientation
            ? `panel requires orientation`
            : `invalid panel orientation: ${String(wideFace)}`,
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

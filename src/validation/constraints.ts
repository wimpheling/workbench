import type { Anchor } from "../domain/anchors";
import type { Point3, Vector3 } from "../domain/frames";
import type { EnclosureModel } from "../domain/enclosureV2";
import {
  centeredNominalBounds,
  transformedNominalBounds,
  type NominalBounds,
} from "../domain/nominalBounds";
import { getProfile } from "../domain/profiles";
import { connectionIssues } from "../domain/connections";
import { evaluateEnclosureV2DesignConstraints } from "../domain/enclosureV2DesignConstraints";
import { enclosureV2StartingStructuralProfileAssignments } from "../domain/enclosureV2Design";
import { evaluateFit, requiredFitPolicy } from "./fitPolicies";

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
const EXPECTED_ENCLOSURE_V2_STRUCTURAL_CONNECTION_COUNT = 24;
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
const sub = (a: Point3, b: Point3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
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

const readablePartName = (id: string): string =>
  id
    .replace(/^(?:part:|door:)/, "")
    .replaceAll("-", " ")
    .replace(/^./, (character) => character.toLocaleUpperCase());

type EnvelopeBoundary = Readonly<{
  axis: "X" | "Y" | "Z";
  side: "minimum" | "maximum";
  measured: number;
  permitted: number;
  overflow: number;
}>;

const envelopeOverflows = (
  bounds: NominalBounds,
  envelope: NominalBounds,
): readonly EnvelopeBoundary[] =>
  [
    {
      axis: "X",
      side: "minimum",
      measured: bounds.min.x,
      permitted: envelope.min.x,
      overflow: envelope.min.x - bounds.min.x,
    },
    {
      axis: "X",
      side: "maximum",
      measured: bounds.max.x,
      permitted: envelope.max.x,
      overflow: bounds.max.x - envelope.max.x,
    },
    {
      axis: "Y",
      side: "minimum",
      measured: bounds.min.y,
      permitted: envelope.min.y,
      overflow: envelope.min.y - bounds.min.y,
    },
    {
      axis: "Y",
      side: "maximum",
      measured: bounds.max.y,
      permitted: envelope.max.y,
      overflow: bounds.max.y - envelope.max.y,
    },
    {
      axis: "Z",
      side: "minimum",
      measured: bounds.min.z,
      permitted: envelope.min.z,
      overflow: envelope.min.z - bounds.min.z,
    },
    {
      axis: "Z",
      side: "maximum",
      measured: bounds.max.z,
      permitted: envelope.max.z,
      overflow: bounds.max.z - envelope.max.z,
    },
  ].filter((boundary) => boundary.overflow > EPS);

const envelopeResult = (
  id: string,
  partDescription: string,
  references: string[],
  bounds: NominalBounds,
  envelope: NominalBounds,
): ConstraintResult => {
  const overflows = envelopeOverflows(bounds, envelope);
  if (overflows.length === 0)
    return result(
      id,
      true,
      `${partDescription} lies within the main enclosure envelope`,
      references,
    );
  const [primary, ...additional] = overflows.sort((a, b) => b.overflow - a.overflow);
  const describe = (overflow: EnvelopeBoundary) =>
    `${overflow.axis} ${overflow.side} by ${overflow.overflow} mm (measured ${overflow.measured} mm, permitted ${overflow.side === "minimum" ? ">=" : "<="} ${overflow.permitted} mm)`;
  return result(
    id,
    false,
    `${partDescription} exceeds the main enclosure envelope at ${describe(primary)}${additional.length ? `; also ${additional.map(describe).join(", ")}` : ""}`,
    references,
    primary.measured,
    primary.permitted,
  );
};

const memberNominalBounds = (member: EnclosureModel["members"][number]): NominalBounds => {
  const section = getProfile(member.profile).section;
  return transformedNominalBounds(
    centeredNominalBounds({ x: member.length, y: section.y, z: section.z }),
    member.transform,
  );
};

const closedDoorLeafBounds = (
  model: EnclosureModel,
  door: NonNullable<EnclosureModel["doors"]>[number],
): NominalBounds | undefined => {
  const hingeName =
    door.id === "left-door" ? "left-hinge" : door.id === "right-door" ? "right-hinge" : undefined;
  const hinge = hingeName ? anchorPoint(model, `anchor:${hingeName}`) : undefined;
  if (!hinge) return undefined;
  return transformedNominalBounds(
    { min: { x: 0, y: 0, z: -30 }, max: { x: door.nominalWidth, y: door.nominalHeight, z: 0 } },
    {
      position: hinge.position,
      rotation: { x: 0, y: 0, z: 0 },
      ...(door.id === "right-door" ? { basis: [-1, 0, 0, 0, 1, 0, 0, 0, 1] } : {}),
    },
  );
};
export function validateModel(model: EnclosureModel): ConstraintResult[] {
  const out: ConstraintResult[] = [];
  if (!model.dimensions) {
    out.push(result("enclosure.dimensions.required", false, "enclosure dimensions are required"));
    return out;
  }
  out.push(
    ...evaluateEnclosureV2DesignConstraints(model).map((evaluation) =>
      result(
        evaluation.constraint.id,
        evaluation.status === "satisfied",
        evaluation.message,
        evaluation.constraint.entities.map((entity) => entity.id),
        evaluation.measured ?? undefined,
        evaluation.expected ?? undefined,
      ),
    ),
  );
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
  const envelope = model.mainStructuralEnvelopeMm;
  for (const member of model.members)
    out.push(
      envelopeResult(
        `BOUND-001.structural.${member.id}`,
        `Structural member “${readablePartName(member.id)}”`,
        [member.id],
        memberNominalBounds(member),
        envelope,
      ),
    );
  for (const door of model.doors ?? []) {
    const bounds = closedDoorLeafBounds(model, door);
    out.push(
      bounds
        ? envelopeResult(
            `BOUND-001.closed-door.${door.id}`,
            `Closed door leaf “${readablePartName(door.id)}”`,
            [door.id],
            bounds,
            envelope,
          )
        : result(
            `BOUND-001.closed-door.${door.id}`,
            false,
            `Closed door leaf “${readablePartName(door.id)}” cannot be checked because its hinge anchor is missing`,
            [door.id],
          ),
    );
  }
  const memberIds = new Set(model.members.map((member) => String(member.id)));
  const connectionIds = new Set<string>();
  out.push(
    scalar(
      "JOINT-001.complete-structural-topology",
      model.connections.length === EXPECTED_ENCLOSURE_V2_STRUCTURAL_CONNECTION_COUNT,
      model.connections.length,
      EXPECTED_ENCLOSURE_V2_STRUCTURAL_CONNECTION_COUNT,
      "the enclosure must declare its complete structural joint topology",
      model.connections.map((connection) => connection.id),
    ),
    result(
      "JOINT-002.structural-joint-types",
      model.connections.every((connection) => connection.joint?.kind === "butt"),
      "every EnclosureV2 structural connection must declare a butt joint",
      model.connections.map((connection) => connection.id),
    ),
  );
  for (const connection of model.connections) {
    const duplicateId = connectionIds.has(connection.id);
    connectionIds.add(connection.id);
    out.push(
      result(
        `JOINT-001.${connection.id}.unique-id`,
        !duplicateId,
        duplicateId ? "connection IDs must be unique" : "connection ID is unique",
        [connection.id],
      ),
      result(
        `JOINT-001.${connection.id}.member-references`,
        connection.parts.every((part) => memberIds.has(part)),
        "connection parts must reference evaluated structural members",
        [connection.id, ...connection.parts],
      ),
    );
    for (const issue of connectionIssues([connection]))
      out.push(result(issue.id, false, issue.message, issue.references));
  }
  for (const memberId of memberIds)
    out.push(
      result(
        `JOINT-001.${memberId}.connected`,
        model.connections.some((connection) => connection.parts.includes(memberId)),
        `${memberId} must participate in the structural connection topology`,
        [memberId],
      ),
    );
  for (const assignment of enclosureV2StartingStructuralProfileAssignments) {
    const expectedProfile = `profile:aluminium-${assignment.profile}`;
    const member = model.members.find(
      (candidate) => candidate.id === `part:${assignment.memberId}`,
    );
    out.push(
      result(
        `PROFILE-004.part:${assignment.memberId}.assignment`,
        member?.profile === expectedProfile,
        `${assignment.memberId} must use the explicitly assigned ${assignment.profile} profile`,
        [`part:${assignment.memberId}`],
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
    const expected = -model.innerClearDimensionsMm.depthMm / 2;
    out.push(
      scalar(
        `enclosure.${member.id}.depth-midpoint`,
        Number.isFinite(midpoint) && Math.abs(midpoint - expected) <= EPS,
        midpoint,
        expected,
        "side support must be centred on the clear-depth span",
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
      const seamPolicy = requiredFitPolicy("door-seam-clearance");
      const seamClearance = model.doorSeamClearance ?? 0;
      const seamFit = evaluateFit(seamPolicy, seamClearance);
      out.push(
        result(
          "enclosure.doors.seam-clearance",
          seamFit.passed,
          seamFit.message,
          [a.id, b.id],
          seamClearance,
          seamFit.required,
        ),
      );
      const opening = model.frontOpeningClearDimensionsMm.widthMm;
      const covered =
        a.nominalWidth +
        b.nominalWidth +
        model.designInput.frontDoorSideClearanceMm * 2 +
        model.designInput.frontDoorCentreGapMm;
      out.push(
        scalar(
          "enclosure.doors.cover-opening",
          Math.abs(covered - opening) <= EPS,
          covered,
          opening,
          "door leaves and declared clearances partition the front opening",
          [a.id, b.id],
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
  const requiredAccess = model.designInput.requiredFrontAccessEnvelopeMm;
  if (requiredAccess) {
    const practicalAccess = model.practicalFrontAccessEnvelopeMm;
    out.push(
      ClearanceAtLeast("ACCESS-005.usable-width", practicalAccess.widthMm, requiredAccess.widthMm, [
        "practical-front-access-envelope",
        "required-front-access-envelope",
      ]),
      ClearanceAtLeast(
        "ACCESS-005.usable-height",
        practicalAccess.heightMm,
        requiredAccess.heightMm,
        ["practical-front-access-envelope", "required-front-access-envelope"],
      ),
      ClearanceAtLeast(
        "ACCESS-005.usable-thickness",
        practicalAccess.thicknessMm,
        requiredAccess.thicknessMm,
        ["practical-front-access-envelope", "required-front-access-envelope"],
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

import type { KinematicIssue } from "./kinematics";
import type { ConstraintResult } from "./constraints";
import type { FitResult } from "./fitPolicies";
import type { SolidCheckResult } from "./solidChecks";
import type { MotionSolidCheckResult } from "./motionSolidChecks";
export type ValidationIssue = {
  id: string;
  severity: "error" | "warning" | "info";
  category: "model" | "kinematics" | "clearance" | "fit" | "structural" | "manufacturing";
  message: string;
  references: string[];
  measured?: number;
  expected?: number;
};
export type ValidationAssertion = ValidationIssue & {
  status: "passed" | "failed";
  method: "deterministic constraint";
  /** A standalone, human-readable statement of what was checked. */
  sentence: string;
};

/**
 * A presentation-neutral datum that explains an assertion without forcing a
 * table, list, or any particular visual treatment on a consumer.
 */
export type ValidationAssertionDetail = Readonly<{
  kind: "detail";
  id: string;
  label: string;
  value: string | number;
}>;

/** A leaf assertion. Assertion details are hidden by default in a tree UI. */
export type ValidationAssertionLeaf = Readonly<{
  kind: "assertion";
  id: string;
  label: string;
  expandedByDefault: false;
  assertion: ValidationAssertion;
  children: readonly ValidationAssertionDetail[];
}>;

/**
 * A logical assertion group. Groups may contain other groups, allowing the
 * domain to express an arbitrary hierarchy independently from the UI.
 */
export type ValidationAssertionGroup = Readonly<{
  kind: "group";
  id: string;
  label: string;
  expandedByDefault: true;
  children: readonly ValidationAssertionTreeNode[];
}>;

export type ValidationAssertionTreeNode =
  | ValidationAssertionGroup
  | ValidationAssertionLeaf
  | ValidationAssertionDetail;

export type ValidationReport = {
  status: "valid" | "warnings" | "invalid" | "incomplete";
  issues: ValidationIssue[];
  assertions: ValidationAssertion[];
  /**
   * Hierarchical assertions for a tree UI. Groups start open; individual
   * assertions start closed so their measurement and reference details remain
   * available without overwhelming the initial view.
   */
  assertionTree: ValidationAssertionGroup;
  modelRevision: string;
};
const fromConstraint = (item: ConstraintResult): ValidationIssue => ({
  id: item.id,
  severity: item.severity,
  category: "model",
  message: item.message,
  references: item.references,
  measured: item.measured,
  expected: item.expected,
});
const sentenceFromMessage = (id: string, message: string): string => {
  const withoutId = message.startsWith(`${id}: `) ? message.slice(id.length + 2) : message;
  const withoutMeasurements = withoutId.split(/(?:; |: )measured /, 1)[0]?.trim() ?? withoutId;
  if (!withoutMeasurements) return "This assertion was evaluated.";
  const firstCharacter = withoutMeasurements[0];
  const sentence =
    firstCharacter === undefined
      ? withoutMeasurements
      : `${firstCharacter.toLocaleUpperCase()}${withoutMeasurements.slice(1)}`;
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
};

const assertionFromConstraint = (item: ConstraintResult): ValidationAssertion => ({
  ...fromConstraint(item),
  status: item.passed ? "passed" : "failed",
  method: "deterministic constraint",
  sentence: sentenceFromMessage(item.id, item.message),
});

const assertionDetails = (assertion: ValidationAssertion): readonly ValidationAssertionDetail[] =>
  [
    {
      kind: "detail" as const,
      id: `${assertion.id}.method`,
      label: "Verification method",
      value: assertion.method,
    },
    {
      kind: "detail" as const,
      id: `${assertion.id}.status`,
      label: "Status",
      value: assertion.status,
    },
    ...(assertion.measured === undefined
      ? []
      : [
          {
            kind: "detail" as const,
            id: `${assertion.id}.measured`,
            label: "Measured value",
            value: assertion.measured,
          },
        ]),
    ...(assertion.expected === undefined
      ? []
      : [
          {
            kind: "detail" as const,
            id: `${assertion.id}.expected`,
            label: "Expected value",
            value: assertion.expected,
          },
        ]),
    ...(assertion.references.length === 0
      ? []
      : [
          {
            kind: "detail" as const,
            id: `${assertion.id}.references`,
            label: "Affected entities",
            value: assertion.references.join(", "),
          },
        ]),
    {
      kind: "detail" as const,
      id: `${assertion.id}.diagnostic`,
      label: "Diagnostic",
      value: assertion.message,
    },
  ] as const;

const groupForAssertion = (assertion: ValidationAssertion): readonly string[] => {
  if (assertion.id.startsWith("FRAME-")) return ["Frame", "Member placement"];
  if (assertion.id.startsWith("PROFILE-003")) return ["Profiles", "Cut lengths"];
  if (assertion.id.startsWith("PROFILE-004")) return ["Profiles", "Profile assignments"];
  if (assertion.id.startsWith("PROFILE-")) return ["Profiles", "Profile requirements"];
  if (assertion.id.startsWith("DOOR-")) return ["Doors", "Sizing"];
  if (assertion.id.startsWith("ACCESS-")) return ["Access", "Practical front access"];
  if (assertion.id.startsWith("JOINT-")) return ["Joints", "Topology"];
  if (assertion.id.startsWith("member.")) return ["Members", "Basic validity"];
  if (assertion.id.startsWith("anchor.")) return ["Model integrity", "Anchors"];
  if (assertion.id.startsWith("panel.")) return ["Model integrity", "Panels"];
  if (assertion.id.startsWith("enclosure.doors.")) return ["Doors", "Sizing"];
  if (assertion.id.startsWith("enclosure.")) return ["Enclosure", "Requirements"];
  return ["Other assertions"];
};

type MutableAssertionGroup = {
  kind: "group";
  id: string;
  label: string;
  expandedByDefault: true;
  children: ValidationAssertionTreeNode[];
};

const groupId = (parentId: string, label: string) =>
  `${parentId}.${label
    .toLocaleLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "")}`;

/**
 * Builds a deterministic hierarchy without assigning any visual styling. A
 * UI can render this as nested <details>, a native tree, or an accessible
 * disclosure list using the default-expansion intent carried by each node.
 */
export const buildValidationAssertionTree = (
  assertions: readonly ValidationAssertion[],
): ValidationAssertionGroup => {
  const root: MutableAssertionGroup = {
    kind: "group",
    id: "assertions",
    label: "Assertions",
    expandedByDefault: true,
    children: [],
  };
  for (const assertion of assertions) {
    let group = root;
    for (const label of groupForAssertion(assertion)) {
      const id = groupId(group.id, label);
      const existing = group.children.find(
        (child): child is MutableAssertionGroup => child.kind === "group" && child.id === id,
      );
      if (existing) {
        group = existing;
        continue;
      }
      const created: MutableAssertionGroup = {
        kind: "group",
        id,
        label,
        expandedByDefault: true,
        children: [],
      };
      group.children.push(created);
      group = created;
    }
    group.children.push({
      kind: "assertion",
      id: assertion.id,
      label: assertion.sentence,
      expandedByDefault: false,
      assertion,
      children: assertionDetails(assertion),
    });
  }
  return root;
};
const fromSolidCheck = (item: SolidCheckResult): ValidationIssue => ({
  id: item.id,
  severity: item.status === "indeterminate" ? "warning" : "error",
  category: "clearance",
  message: item.diagnostics.join("; ") || `solid check ${item.status}`,
  references: [item.subject, item.target],
  measured: item.distance,
  expected: item.minimum,
});
export const buildValidationReport = (
  revision: string,
  constraints: readonly ConstraintResult[],
  kinematics: readonly KinematicIssue[] = [],
  fits: readonly FitResult[] = [],
  solidChecks: readonly SolidCheckResult[] = [],
  motion?: MotionSolidCheckResult,
): ValidationReport => {
  const issues: ValidationIssue[] = [
    ...constraints.filter((item) => !item.passed).map(fromConstraint),
    ...kinematics.map((item) => ({
      id: item.id,
      severity: "error" as const,
      category: "kinematics" as const,
      message: item.message,
      references: [item.motionId],
      measured: item.value,
      expected: item.expected.max,
    })),
    ...fits
      .filter((item) => !item.passed)
      .map((item) => ({
        id: `fit.${item.policyId}`,
        severity: "error" as const,
        category: "fit" as const,
        message: item.message,
        references: [item.policyId],
        measured: item.clearance,
        expected: item.required,
      })),
    ...solidChecks.filter((item) => item.status !== "clear").map(fromSolidCheck),
    ...(motion && motion.status !== "clear"
      ? [
          {
            id: "motion.solid",
            severity: motion.status === "collision" ? ("error" as const) : ("warning" as const),
            category: "clearance" as const,
            message: motion.diagnostics.join("; ") || `motion solid check ${motion.status}`,
            references: motion.firstFailure
              ? [motion.firstFailure.subject, motion.firstFailure.target]
              : ["left-door.angle", "right-door.angle"],
          },
        ]
      : []),
  ];
  const hasIndeterminate =
    solidChecks.some((item) => item.status === "indeterminate") || motion?.status === "incomplete";
  const assertions = constraints.map(assertionFromConstraint);
  return {
    status: issues.some((item) => item.severity === "error")
      ? "invalid"
      : hasIndeterminate
        ? "incomplete"
        : issues.length
          ? "warnings"
          : "valid",
    issues,
    assertions,
    assertionTree: buildValidationAssertionTree(assertions),
    modelRevision: revision,
  };
};

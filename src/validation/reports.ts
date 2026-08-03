import type { KinematicIssue } from "./kinematics";
import type { ConstraintResult } from "./constraints";
import type { FitResult } from "./fitPolicies";
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
};
export type ValidationReport = {
  status: "valid" | "warnings" | "invalid" | "incomplete";
  issues: ValidationIssue[];
  assertions: ValidationAssertion[];
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
const assertionFromConstraint = (item: ConstraintResult): ValidationAssertion => ({
  ...fromConstraint(item),
  status: item.passed ? "passed" : "failed",
  method: "deterministic constraint",
});
export const buildValidationReport = (
  revision: string,
  constraints: readonly ConstraintResult[],
  kinematics: readonly KinematicIssue[] = [],
  fits: readonly FitResult[] = [],
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
  ];
  return {
    status: issues.some((item) => item.severity === "error")
      ? "invalid"
      : issues.length
        ? "warnings"
        : "valid",
    issues,
    assertions: constraints.map(assertionFromConstraint),
    modelRevision: revision,
  };
};

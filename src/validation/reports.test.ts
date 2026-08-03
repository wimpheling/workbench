import { describe, expect, it } from "vitest";
import { buildValidationReport } from "./reports";
import type { ConstraintResult } from "./constraints";

const constraints: ConstraintResult[] = [
  {
    id: "member.length",
    severity: "error",
    passed: true,
    message: "length is positive",
    references: ["part:front-top"],
    measured: 1734,
    expected: 0,
  },
  {
    id: "door.coverage",
    severity: "error",
    passed: false,
    message: "doors do not cover opening",
    references: ["left-door", "right-door"],
    measured: 1600,
    expected: 1674,
  },
];

describe("validation reports", () => {
  it("retains passed and failed assertions with their verification method", () => {
    const report = buildValidationReport("revision", constraints);

    expect(report.assertions).toEqual([
      expect.objectContaining({
        id: "member.length",
        status: "passed",
        method: "deterministic constraint",
        measured: 1734,
        expected: 0,
      }),
      expect.objectContaining({
        id: "door.coverage",
        status: "failed",
        method: "deterministic constraint",
      }),
    ]);
    expect(report.issues).toHaveLength(1);
  });
});

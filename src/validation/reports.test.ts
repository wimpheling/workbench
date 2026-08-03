import { beforeAll, describe, expect, it } from "vitest";
import { makeBaseBox } from "replicad";
import { initializeOpenCascade } from "../rendering/enclosureScene";
import { checkSolidPairs, type SolidCheckResult } from "./solidChecks";
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

beforeAll(async () => {
  await initializeOpenCascade();
});

const solids = (subjectX: number, targetX: number) =>
  checkSolidPairs(
    [
      { id: "frame", shape: makeBaseBox(10, 10, 10).translate(subjectX, 0, 0) },
      { id: "door", shape: makeBaseBox(10, 10, 10).translate(targetX, 0, 0) },
    ],
    [{ id: "frame-door", subject: "frame", target: "door", minimum: 5 }],
  );

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

  it("reports collision and insufficient clearance as invalid issues with measurements", () => {
    const collision = buildValidationReport("revision", [], [], [], solids(0, 5));
    expect(collision.status).toBe("invalid");
    expect(collision.issues[0]).toMatchObject({
      id: "frame-door",
      category: "clearance",
      references: ["frame", "door"],
      measured: 0,
      expected: 5,
    });

    const insufficient = buildValidationReport("revision", [], [], [], solids(0, 12));
    expect(insufficient.status).toBe("invalid");
    expect(insufficient.issues[0]).toMatchObject({
      id: "frame-door",
      category: "clearance",
      references: ["frame", "door"],
      expected: 5,
    });
    expect(insufficient.issues[0]?.measured).toBeLessThan(5);
  });

  it("reports a lone indeterminate check as incomplete with diagnostics", () => {
    const result: SolidCheckResult = {
      id: "missing",
      status: "indeterminate",
      subject: "frame",
      target: "door",
      diagnostics: ["solid unavailable"],
    };
    const report = buildValidationReport("revision", [], [], [], [result]);
    expect(report.status).toBe("incomplete");
    expect(report.issues[0]).toMatchObject({
      id: "missing",
      category: "clearance",
      references: ["frame", "door"],
      message: "solid unavailable",
    });
  });

  it("does not generate an issue for clear checks", () => {
    const report = buildValidationReport("revision", [], [], [], solids(0, 20));
    expect(report.status).toBe("valid");
    expect(report.issues).toHaveLength(0);
  });
});

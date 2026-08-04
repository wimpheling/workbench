import { beforeAll, describe, expect, it } from "vitest";
import { makeBaseBox } from "replicad";
import { initializeOpenCascade } from "../rendering/enclosureScene";
import { makeEnclosureV2 } from "../domain/enclosureV2";
import { checkSolidPairs, type SolidCheckResult } from "./solidChecks";
import { validateModel } from "./constraints";
import { buildValidationAssertionTree, buildValidationReport } from "./reports";
import type { ConstraintResult } from "./constraints";
import type { MotionSolidCheckResult } from "./motionSolidChecks";

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
        sentence: "Length is positive.",
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

  it("builds an open semantic assertion tree with collapsed assertion details", () => {
    const report = buildValidationReport("revision", constraints);
    const root = report.assertionTree;
    expect(root).toMatchObject({
      kind: "group",
      id: "assertions",
      label: "Assertions",
      expandedByDefault: true,
    });

    const members = root.children.find(
      (child) => child.kind === "group" && child.label === "Members",
    );
    expect(members).toMatchObject({ kind: "group", expandedByDefault: true });
    const validity =
      members?.kind === "group"
        ? members.children.find(
            (child) => child.kind === "group" && child.label === "Basic validity",
          )
        : undefined;
    const length =
      validity?.kind === "group"
        ? validity.children.find(
            (child) => child.kind === "assertion" && child.id === "member.length",
          )
        : undefined;
    expect(length).toMatchObject({
      kind: "assertion",
      label: "Length is positive.",
      expandedByDefault: false,
    });
    expect(length?.kind === "assertion" && length.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Measured value", value: 1734 }),
        expect.objectContaining({ label: "Expected value", value: 0 }),
      ]),
    );
  });

  it("uses nested semantic groups for frame, profiles, joints, doors, and access assertions", () => {
    const tree = buildValidationAssertionTree(
      [
        "FRAME-006.part:front-top.center",
        "PROFILE-003.part:front-top.cut-length",
        "PROFILE-004.part:front-top.assignment",
        "JOINT-001.complete-structural-topology",
        "DOOR-006.equal-leaf-width",
        "ACCESS-005.usable-width",
      ].map((id) => ({
        id,
        severity: "error" as const,
        status: "passed" as const,
        method: "deterministic constraint" as const,
        sentence: "The requirement is satisfied.",
        category: "model" as const,
        message: "The requirement is satisfied.",
        references: [],
      })),
    );
    expect(tree.children.map((child) => child.label)).toEqual([
      "Frame",
      "Profiles",
      "Joints",
      "Doors",
      "Access",
    ]);
    const profiles = tree.children[1];
    expect(profiles?.kind === "group" && profiles.children.map((child) => child.label)).toEqual([
      "Cut lengths",
      "Profile assignments",
    ]);
  });

  it("gives every EnclosureV2 assertion a standalone human-readable sentence", () => {
    const model = makeEnclosureV2({ width: 1200, height: 800, depth: 600 });
    const assertions = buildValidationReport(model.frame.id, validateModel(model)).assertions;

    expect(assertions.length).toBeGreaterThan(0);
    for (const assertion of assertions) {
      expect(assertion.sentence).toMatch(/^[A-Z].*[.!?]$/);
      expect(assertion.sentence).not.toContain(assertion.id);
      expect(assertion.sentence).not.toMatch(/(?:^|[;:]) measured /i);
    }
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

  it("reports insufficient motion clearance as a warning rather than a collision", () => {
    const motion: MotionSolidCheckResult = {
      status: "insufficient-clearance",
      verified: false,
      states: [],
      checkedStates: 4,
      checkedPairs: [{ subject: "door", target: "post" }],
      firstFailure: {
        id: "motion.door.post",
        status: "insufficient-clearance",
        subject: "door",
        target: "post",
        intersection: false,
        distance: 1,
        minimum: 2,
        diagnostics: ["clearance 1 is below required 2"],
        state: { "left-door.angle": 0, "right-door.angle": 0 },
      },
      diagnostics: ["insufficient clearance; no collision"],
    };

    const report = buildValidationReport("revision", [], [], [], [], motion);
    expect(report.status).toBe("warnings");
    expect(report.issues[0]).toMatchObject({ severity: "warning", category: "clearance" });
    expect(report.issues[0]?.message).not.toMatch(/collision found/i);
  });
});

import { describe, expect, it } from "vitest";
import { buildValidationAssertionTree, type ValidationReport } from "../validation/reports";
import { resolveRuntimeValidationState } from "./runtimeValidation";

const report: ValidationReport = {
  status: "valid",
  issues: [],
  assertions: [],
  assertionTree: buildValidationAssertionTree([]),
  modelRevision: "runtime-test-report",
};

const otherReport: ValidationReport = {
  status: "valid",
  issues: [],
  assertions: [],
  assertionTree: buildValidationAssertionTree([]),
  modelRevision: "runtime-test-other-report",
};

describe("resolveRuntimeValidationState", () => {
  it("returns no report while loading", () => {
    const state = resolveRuntimeValidationState({
      loading: true,
      error: undefined,
      scene: undefined,
    });

    expect(state).toEqual({ status: "loading", message: "Validation is running…" });
    expect("report" in state).toBe(false);
  });

  it("returns no report after an error and exposes a message", () => {
    const state = resolveRuntimeValidationState({
      loading: false,
      error: new Error("OpenCascade unavailable"),
      scene: undefined,
    });

    expect(state).toEqual({
      status: "unavailable",
      message: "Runtime validation is unavailable because the scene could not be built.",
    });
    expect("report" in state).toBe(false);
  });

  it("uses the exact validation report belonging to the scene", () => {
    const state = resolveRuntimeValidationState({
      loading: false,
      error: undefined,
      scene: { validationReport: report },
    });

    expect(state).toEqual({ status: "ready", report });
    expect(state.status === "ready" && state.report).toBe(report);
    expect(state.status === "ready" && state.report).not.toBe(otherReport);
  });

  it("does not expose stale data after dimensions change", () => {
    const state = resolveRuntimeValidationState({
      loading: true,
      error: undefined,
      scene: { validationReport: otherReport },
    });

    expect(state.status).toBe("loading");
    expect("report" in state).toBe(false);
  });
});

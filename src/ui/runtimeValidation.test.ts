import { describe, expect, it } from "vitest";
import type { ValidationReport } from "../validation/reports";
import { resolveRuntimeValidationState } from "./runtimeValidation";

const report: ValidationReport = {
  status: "valid",
  issues: [],
  assertions: [],
  modelRevision: "runtime-test-report",
};

const otherReport: ValidationReport = {
  status: "valid",
  issues: [],
  assertions: [],
  modelRevision: "runtime-test-other-report",
};

describe("resolveRuntimeValidationState", () => {
  it("ne retourne aucun rapport pendant le chargement", () => {
    const state = resolveRuntimeValidationState({
      loading: true,
      error: undefined,
      scene: undefined,
    });

    expect(state).toEqual({ status: "loading", message: "Validation runtime en cours…" });
    expect("report" in state).toBe(false);
  });

  it("ne retourne aucun rapport en cas d'erreur et expose un message", () => {
    const state = resolveRuntimeValidationState({
      loading: false,
      error: new Error("OpenCascade indisponible"),
      scene: undefined,
    });

    expect(state).toEqual({
      status: "unavailable",
      message: "Validation runtime indisponible : la scène n’a pas pu être construite.",
    });
    expect("report" in state).toBe(false);
  });

  it("utilise exactement le rapport de validation de la scène", () => {
    const state = resolveRuntimeValidationState({
      loading: false,
      error: undefined,
      scene: { validationReport: report },
    });

    expect(state).toEqual({ status: "ready", report });
    expect(state.status === "ready" && state.report).toBe(report);
    expect(state.status === "ready" && state.report).not.toBe(otherReport);
  });

  it("n'affiche pas une donnée stale après un changement de dimensions", () => {
    const state = resolveRuntimeValidationState({
      loading: true,
      error: undefined,
      scene: { validationReport: otherReport },
    });

    expect(state.status).toBe("loading");
    expect("report" in state).toBe(false);
  });
});

import type { EnclosureScene } from "../rendering/enclosureScene";
import type { ValidationReport } from "../validation/reports";

type RuntimeValidationInput = {
  loading: boolean;
  error: unknown;
  scene: EnclosureScene | undefined;
};

export type RuntimeValidationState =
  | { status: "loading"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "ready"; report: ValidationReport };

export const resolveRuntimeValidationState = ({
  loading,
  error,
  scene,
}: RuntimeValidationInput): RuntimeValidationState => {
  if (loading) {
    return { status: "loading", message: "Validation is running…" };
  }

  if (error || !scene) {
    return {
      status: "unavailable",
      message: "Runtime validation is unavailable because the scene could not be built.",
    };
  }

  return { status: "ready", report: scene.validationReport };
};

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
    return { status: "loading", message: "Validation runtime en cours…" };
  }

  if (error || !scene) {
    return {
      status: "unavailable",
      message: "Validation runtime indisponible : la scène n’a pas pu être construite.",
    };
  }

  return { status: "ready", report: scene.validationReport };
};

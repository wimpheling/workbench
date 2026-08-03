import { defaultProfileCatalog, type ProfileCatalog } from "./profiles";
import type { ParameterId } from "./ids";

export type ParameterValue = number | string | boolean;
export type DesignParameters = Record<string | ParameterId, ParameterValue>;
export type TolerancePolicy = { defaultClearance: number };

export type ProjectDefinition = { id: string; name: string; parameters: DesignParameters };
export type EvaluationContext = {
  project: ProjectDefinition;
  parameters: DesignParameters;
  profiles: ProfileCatalog;
  tolerances: TolerancePolicy;
};

export function createEvaluationContext(project: ProjectDefinition): EvaluationContext {
  return {
    project,
    parameters: { ...project.parameters },
    profiles: defaultProfileCatalog(),
    tolerances: { defaultClearance: 0 },
  };
}

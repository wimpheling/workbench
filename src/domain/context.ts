import {
  defaultMaterialCatalog,
  defaultProfileCatalog,
  type MaterialCatalog,
  type ProfileCatalog,
} from "./profiles";
import type { ParameterId, ProjectId } from "./ids";
export type ParameterValue = number | string | boolean;
export type DesignParameters = Readonly<Record<ParameterId, ParameterValue>>;
export type TolerancePolicy = Readonly<{ defaultClearance: number }>;
export type ProjectDefinition = Readonly<{
  id: ProjectId;
  name: string;
  parameters: DesignParameters;
}>;
export type EvaluationContext = Readonly<{
  project: ProjectDefinition;
  parameters: DesignParameters;
  profiles: ProfileCatalog;
  materials: MaterialCatalog;
  tolerances: TolerancePolicy;
}>;
const copy = (value: DesignParameters): DesignParameters => Object.freeze({ ...value });
export function createEvaluationContext(project: ProjectDefinition): EvaluationContext {
  const parameters = copy(project.parameters);
  return Object.freeze({
    project: Object.freeze({ ...project, parameters }),
    parameters,
    profiles: defaultProfileCatalog(),
    materials: defaultMaterialCatalog(),
    tolerances: Object.freeze({ defaultClearance: 0 }),
  });
}

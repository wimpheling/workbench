import { buildEnclosureAssemblies } from "../domain/assemblies";
import { defaultConfiguration, type Configuration } from "../domain/configurations";
import { makeEnclosureV2, type EnclosureModel } from "../domain/enclosureV2";
import { validateModel } from "../validation/constraints";
import { buildValidationReport, type ValidationReport } from "../validation/reports";
import { toMillimetres } from "../domain/units";

export type EditableDimensions = { width: number; height: number; depth: number };
export type RegeneratedModel = {
  model: EnclosureModel;
  report: ValidationReport;
  revision: string;
};

// Legacy EnclosureV2 documents these as the *internal* envelope in centimetres.
// The authoring UI and rendering domain use millimetres, so convert at this boundary.
export const legacyInnerDimensionsCm = { width: 167.4, height: 74, depth: 164.9 } as const;
export const defaultDimensions: EditableDimensions = {
  width: toMillimetres(legacyInnerDimensionsCm.width, "cm"),
  height: toMillimetres(legacyInnerDimensionsCm.height, "cm"),
  depth: toMillimetres(legacyInnerDimensionsCm.depth, "cm"),
};
export const dimensionsFromParameters = (
  parameters: Readonly<Record<string, number | string | boolean>>,
): EditableDimensions => ({
  width: Number(parameters.width ?? defaultDimensions.width),
  height: Number(parameters.height ?? defaultDimensions.height),
  depth: Number(parameters.depth ?? defaultDimensions.depth),
});

export const regenerateModel = (dimensions: EditableDimensions): RegeneratedModel => {
  const model = makeEnclosureV2(dimensions);
  const report = buildValidationReport(model.frame.id, validateModel(model));
  const revision = JSON.stringify({ dimensions: model.dimensions, members: model.members });
  return { model, report, revision };
};

export const defaultConfigurations = (dimensions: EditableDimensions): Configuration[] => [
  defaultConfiguration(dimensions),
];

export const motionStatesForModel = (model: EnclosureModel) =>
  buildEnclosureAssemblies(model).flatMap((assembly) =>
    assembly.states.map((state) => ({ assembly, state })),
  );

export const updateDimension = (
  dimensions: EditableDimensions,
  key: keyof EditableDimensions,
  rawValue: string,
): EditableDimensions | undefined => {
  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? { ...dimensions, [key]: value } : undefined;
};

export const modelRevision = (dimensions: EditableDimensions) =>
  regenerateModel(dimensions).revision;

export const serializeAuthoringParameters = (dimensions: EditableDimensions) =>
  JSON.stringify({ width: dimensions.width, height: dimensions.height, depth: dimensions.depth });

export const motionStateIds = (model: EnclosureModel) => [
  ...new Set(motionStatesForModel(model).map(({ state }) => state.id)),
];

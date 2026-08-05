import { buildEnclosureAssemblies } from "../domain/assemblies";
import { defaultConfiguration, type Configuration } from "../domain/configurations";
import { makeEnclosureV2, type EnclosureModel } from "../domain/enclosureV2";
import {
  defaultEnclosureV2Variables,
  type EnclosureV2Variables,
} from "../domain/enclosureV2Design";
import { validateModel } from "../validation/constraints";
import { buildValidationReport, type ValidationReport } from "../validation/reports";
import { toMillimetres } from "../domain/units";

export type EditableDimensions = { width: number; height: number; depth: number };
/** Stakeholder-authored values. Evaluated model values never belong here. */
export type EditableEnclosureV2Variables = EnclosureV2Variables;
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
export const defaultEnclosureV2VariablesForAuthoring: EditableEnclosureV2Variables =
  defaultEnclosureV2Variables({
    innerClearWidthMm: defaultDimensions.width,
    innerClearHeightMm: defaultDimensions.height,
    innerClearDepthMm: defaultDimensions.depth,
  });
export const dimensionsFromParameters = (
  parameters: Readonly<Record<string, number | string | boolean>>,
): EditableDimensions => ({
  width: Number(parameters.width ?? defaultDimensions.width),
  height: Number(parameters.height ?? defaultDimensions.height),
  depth: Number(parameters.depth ?? defaultDimensions.depth),
});

export const variablesFromParameters = (
  parameters: Readonly<Record<string, number | string | boolean>>,
): EditableEnclosureV2Variables => {
  const dimensions = dimensionsFromParameters(parameters);
  return {
    innerClearWidthMm: Number(parameters.innerClearWidthMm ?? dimensions.width),
    innerClearHeightMm: Number(parameters.innerClearHeightMm ?? dimensions.height),
    innerClearDepthMm: Number(parameters.innerClearDepthMm ?? dimensions.depth),
    frontDoorSideClearanceMm: Number(
      parameters.frontDoorSideClearanceMm ??
        defaultEnclosureV2VariablesForAuthoring.frontDoorSideClearanceMm,
    ),
    frontDoorTopClearanceMm: Number(
      parameters.frontDoorTopClearanceMm ??
        defaultEnclosureV2VariablesForAuthoring.frontDoorTopClearanceMm,
    ),
    frontDoorBottomClearanceMm: Number(
      parameters.frontDoorBottomClearanceMm ??
        defaultEnclosureV2VariablesForAuthoring.frontDoorBottomClearanceMm,
    ),
    frontDoorCentreGapMm: Number(
      parameters.frontDoorCentreGapMm ??
        defaultEnclosureV2VariablesForAuthoring.frontDoorCentreGapMm,
    ),
  };
};

export const regenerateModel = (variables: EditableEnclosureV2Variables): RegeneratedModel => {
  const model = makeEnclosureV2(variables);
  const report = buildValidationReport(model.frame.id, validateModel(model));
  const revision = JSON.stringify({ dimensions: model.dimensions, members: model.members });
  return { model, report, revision };
};

export const defaultConfigurations = (variables: EditableEnclosureV2Variables): Configuration[] => [
  defaultConfiguration(variables),
];

export const motionStatesForModel = (model: EnclosureModel) =>
  buildEnclosureAssemblies(model).flatMap((assembly) =>
    assembly.states.map((state) => ({ assembly, state })),
  );

export const updateVariable = (
  variables: EditableEnclosureV2Variables,
  key: keyof EditableEnclosureV2Variables,
  rawValue: string,
): EditableEnclosureV2Variables | undefined => {
  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? { ...variables, [key]: value } : undefined;
};

export const modelRevision = (variables: EditableEnclosureV2Variables) =>
  regenerateModel(variables).revision;

export const serializeAuthoringParameters = (variables: EditableEnclosureV2Variables) =>
  JSON.stringify(variables);

export const motionStateIds = (model: EnclosureModel) => [
  ...new Set(motionStatesForModel(model).map(({ state }) => state.id)),
];

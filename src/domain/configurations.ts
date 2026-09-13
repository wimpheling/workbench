import type { DesignParameters } from "./context";
export type Configuration = Readonly<{
  id: string;
  name: string;
  parameters: DesignParameters;
  states?: readonly { id: string; motions: Readonly<Record<string, number>> }[];
  enabledFeatures?: readonly string[];
}>;
export type ProjectFile = Readonly<{
  version: 1;
  projectId: string;
  projectName: string;
  configurations: readonly Configuration[];
}>;
export const createConfiguration = (
  id: string,
  name: string,
  parameters: DesignParameters,
  enabledFeatures: readonly string[] = [],
): Configuration =>
  Object.freeze({
    id,
    name,
    parameters: Object.freeze({ ...parameters }),
    enabledFeatures: Object.freeze([...enabledFeatures]),
  });
export const serializeProject = (project: ProjectFile) => JSON.stringify(project, null, 2);
export const parseProject = (json: string): ProjectFile => {
  const value = JSON.parse(json) as ProjectFile;
  if (value.version !== 1 || !value.projectId || !Array.isArray(value.configurations))
    throw new Error("Unsupported project definition");
  return value;
};
export const compareConfigurations = (a: Configuration, b: Configuration) => ({
  parameterChanges: [
    ...new Set([...Object.keys(a.parameters), ...Object.keys(b.parameters)]),
  ].filter((key) => a.parameters[key] !== b.parameters[key]),
  featureChanges: [...new Set([...(a.enabledFeatures ?? []), ...(b.enabledFeatures ?? [])])].filter(
    (feature) =>
      (a.enabledFeatures ?? []).includes(feature) !== (b.enabledFeatures ?? []).includes(feature),
  ),
});
export const defaultConfiguration = (parameters: DesignParameters): Configuration =>
  createConfiguration("default", "Default", parameters, ["frame", "double-doors"]);

export type StableId<Namespace extends string = string> = `${Namespace}:${string}`;
export type PartId = StableId<"part">;
export type FeatureId = StableId<"feature">;
export type ParameterId = StableId<"parameter">;

export function stableId<Namespace extends string>(
  namespace: Namespace,
  value: string,
): StableId<Namespace> {
  if (!value.trim() || value.includes(":"))
    throw new Error("Stable ID values must be non-empty and contain no colon");
  return `${namespace}:${value}` as StableId<Namespace>;
}

export const partId = (value: string): PartId => stableId("part", value);
export const featureId = (value: string): FeatureId => stableId("feature", value);
export const parameterId = (value: string): ParameterId => stableId("parameter", value);

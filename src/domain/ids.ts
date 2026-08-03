export type StableId<Namespace extends string = string> = `${Namespace}:${string}`;
export type PartId = StableId<"part">;
export type FeatureId = StableId<"feature">;
export type ParameterId = StableId<"parameter">;
export type ProjectId = StableId<"project">;
export type FrameId = StableId<"frame">;
export type ProfileId = StableId<"profile">;
export type MaterialId = StableId<"material">;
export type CatalogId = StableId<"catalog">;
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
export const projectId = (value: string): ProjectId => stableId("project", value);
export const frameId = (value: string): FrameId => stableId("frame", value);
export const profileId = (value: string): ProfileId => stableId("profile", value);
export const materialId = (value: string): MaterialId => stableId("material", value);
export const catalogId = (value: string): CatalogId => stableId("catalog", value);
// Branded IDs are runtime strings, but constructors are the only supported boundary.
export type AnyStableId =
  | PartId
  | FeatureId
  | ParameterId
  | ProjectId
  | FrameId
  | ProfileId
  | MaterialId
  | CatalogId;
export const isStableId = (value: string): value is AnyStableId => /^[a-z-]+:[^:]+$/.test(value);

// IDs in the public model are branded; this helper is intentionally explicit for catalog lookup.
export const profileKey = profileId;

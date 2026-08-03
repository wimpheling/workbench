import type { Dimensions } from "./units";

export type Profile = {
  id: string;
  label: string;
  section: Dimensions;
  geometry: "tSlot" | "box" | "custom";
  material: "aluminium";
  slotWidth: number;
  stockLengths?: number[];
};

export type ProfileCatalog = ReadonlyMap<string, Profile>;

export const aluminiumProfiles: readonly Profile[] = [
  { id: "aluminium-3030", label: "Aluminium 3030", section: { x: 30, y: 30, z: 30 }, geometry: "tSlot", material: "aluminium", slotWidth: 8 },
  { id: "aluminium-3060", label: "Aluminium 3060", section: { x: 30, y: 60, z: 30 }, geometry: "tSlot", material: "aluminium", slotWidth: 8 },
];

const profileCatalog: ProfileCatalog = new Map(aluminiumProfiles.map((profile) => [profile.id, profile]));

export function getProfile(id: string): Profile {
  const profile = profileCatalog.get(id);
  if (!profile) throw new Error(`Unknown profile: ${id}`);
  return profile;
}

export const defaultProfileCatalog = (): ProfileCatalog => new Map(profileCatalog);

import type { Dimensions } from "./units";
import { materialId, profileId, type MaterialId, type ProfileId } from "./ids";
export type Profile = {
  id: ProfileId;
  label: string;
  section: Dimensions;
  geometry: "tSlot" | "box" | "custom";
  material: "aluminium";
  slotWidth: number;
  /** Traceable supplier catalogue data for the selected physical extrusion. */
  supplier: Readonly<{
    manufacturer: string;
    distributor: string;
    productCode: string;
    productUrl: string;
    alloyTemper: string;
    slotCount: number;
  }>;
  /** The rendered section is parametric until vendor CAD is imported. */
  sectionGeometryFidelity: "parametric-slot-opening";
  stockLengths?: readonly number[];
  pricePerLength?: number;
  currency?: string;
};
export type ProfileCatalog = ReadonlyMap<ProfileId, Profile>;
const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
export const aluminiumProfiles: readonly Profile[] = Object.freeze([
  {
    id: profileId("aluminium-3030"),
    label: "Wolweiss 30×30, 4 slots (AST03003004)",
    section: freeze({ x: 30, y: 30, z: 30 }),
    geometry: "tSlot",
    material: "aluminium",
    slotWidth: 8.2,
    supplier: freeze({
      manufacturer: "Wolweiss",
      distributor: "Reiman",
      productCode: "AST03003004",
      productUrl: "https://reiman.pt/pt/ast03003004-aluminium-profile-30x30-4-slots/",
      alloyTemper: "EN AW-6063 T5",
      slotCount: 4,
    }),
    sectionGeometryFidelity: "parametric-slot-opening",
    stockLengths: [6000],
    pricePerLength: 0.018,
    currency: "EUR",
  },
  {
    id: profileId("aluminium-3060"),
    label: "Wolweiss 30×60, 6 slots (AST03006006)",
    section: freeze({ x: 30, y: 60, z: 30 }),
    geometry: "tSlot",
    material: "aluminium",
    slotWidth: 8.2,
    supplier: freeze({
      manufacturer: "Wolweiss",
      distributor: "Reiman",
      productCode: "AST03006006",
      productUrl: "https://reiman.pt/pt/ast03006006-aluminium-profile-30x60-6-slots/",
      alloyTemper: "EN AW-6063 T5",
      slotCount: 6,
    }),
    sectionGeometryFidelity: "parametric-slot-opening",
    stockLengths: [6000],
    pricePerLength: 0.027,
    currency: "EUR",
  },
]);
class ImmutableMap<K, V> implements ReadonlyMap<K, V> {
  constructor(private readonly map: ReadonlyMap<K, V>) {}
  get size() {
    return this.map.size;
  }
  get(key: K) {
    return this.map.get(key);
  }
  has(key: K) {
    return this.map.has(key);
  }
  forEach(cb: (value: V, key: K) => void) {
    this.map.forEach(cb);
  }
  entries() {
    return this.map.entries();
  }
  keys() {
    return this.map.keys();
  }
  values() {
    return this.map.values();
  }
  [Symbol.iterator]() {
    return this.map[Symbol.iterator]();
  }
  set() {
    throw new Error("Catalog is immutable");
  }
  delete() {
    throw new Error("Catalog is immutable");
  }
  clear() {
    throw new Error("Catalog is immutable");
  }
}
const catalog: ProfileCatalog = new ImmutableMap(new Map(aluminiumProfiles.map((p) => [p.id, p])));
export function getProfile(id: ProfileId): Profile {
  const profile = catalog.get(id);
  if (!profile) throw new Error(`Unknown profile: ${id}`);
  return profile;
}
export const defaultProfileCatalog = (): ProfileCatalog => catalog;
export type Material = {
  id: MaterialId;
  label: string;
  classification: "wood" | "compact-polycarbonate" | "aluminium";
};
export type MaterialCatalog = ReadonlyMap<MaterialId, Material>;
export const defaultMaterialCatalog = (): MaterialCatalog =>
  new ImmutableMap(
    new Map([
      [
        materialId("wood"),
        freeze({ id: materialId("wood"), label: "Wood", classification: "wood" }),
      ],
      [
        materialId("compact-polycarbonate"),
        freeze({
          id: materialId("compact-polycarbonate"),
          label: "Compact polycarbonate",
          classification: "compact-polycarbonate",
        }),
      ],
      [
        materialId("aluminium"),
        freeze({ id: materialId("aluminium"), label: "Aluminium", classification: "aluminium" }),
      ],
    ]),
  );

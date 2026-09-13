import { hardwareId, profileId, type HardwareId, type ProfileId } from "./ids";
import type { DoorLeafId } from "./doorInterfaces";

/** Catalogue facts for the removable long hinge selected for evaluation. */
export type LongHingeCatalogItem = Readonly<{
  id: HardwareId;
  label: string;
  manufacturer: "Wolweiss";
  distributor: "Reiman";
  productCode: "GLR3030";
  productUrl: string;
  compatibleProfile: ProfileId;
  maximumRatedLoadN: number;
  overallHeightMm: number;
  mountingHoleSpanMm: number;
  mountingHoleDiameterMm: number;
  barrelDiameterMm: number;
  plateThicknessMm: number;
  plateWidthMm: number;
  geometryFidelity: "technical-drawing-envelope";
  requiredFasteners: readonly string[];
}>;

/**
 * This is deliberately an envelope rather than an imported hinge CAD model.
 * The source drawing establishes its height, barrel and plate thickness, but
 * its pivot plane and removal direction still need the supplier STEP file.
 */
export const wolweissGlr3030: LongHingeCatalogItem = Object.freeze({
  id: hardwareId("wolweiss-glr3030"),
  label: "Wolweiss GLR3030 removable long hinge",
  manufacturer: "Wolweiss",
  distributor: "Reiman",
  productCode: "GLR3030",
  productUrl: "https://reiman.pt/pt/wlw-glr3030-glr3030-30-30-removable-long-hinge/",
  compatibleProfile: profileId("aluminium-3030"),
  maximumRatedLoadN: 500,
  overallHeightMm: 600,
  mountingHoleSpanMm: 500,
  mountingHoleDiameterMm: 6.5,
  barrelDiameterMm: 16,
  plateThicknessMm: 6,
  plateWidthMm: 28,
  geometryFidelity: "technical-drawing-envelope",
  requiredFasteners: Object.freeze(["4× ISO 10642 M6×10", "4× slot-8 M6 T-nuts"]),
});

export type DoorHingeInstallation = Readonly<{
  leafId: DoorLeafId;
  hardware: LongHingeCatalogItem;
  /** Bottom offset in the leaf coordinate system, centred vertically by policy. */
  leafBottomOffsetMm: number | undefined;
  fitStatus: "fits-leaf-height" | "incompatible-leaf-height";
  /** GLR3030 STEP barrel axis coincides with the door's hinge anchor. */
  pivotAxis: "supplier-step-barrel-axis";
  pivotPlacementStatus: "verified-from-supplier-step";
}>;

export const makeCentredGlr3030Installations = (
  leaves: readonly Readonly<{ id: DoorLeafId; nominalHeight: number }>[],
): readonly DoorHingeInstallation[] =>
  Object.freeze(
    leaves.map((leaf) => {
      const fitsLeafHeight = leaf.nominalHeight >= wolweissGlr3030.overallHeightMm;
      return Object.freeze({
        leafId: leaf.id,
        hardware: wolweissGlr3030,
        leafBottomOffsetMm: fitsLeafHeight
          ? (leaf.nominalHeight - wolweissGlr3030.overallHeightMm) / 2
          : undefined,
        fitStatus: fitsLeafHeight ? "fits-leaf-height" : "incompatible-leaf-height",
        pivotAxis: "supplier-step-barrel-axis",
        pivotPlacementStatus: "verified-from-supplier-step",
      });
    }),
  );

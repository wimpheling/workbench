import type { ProfileId } from "./ids";

export type DoorInfillSurface = "hard-coated-candidate" | "uncoated";
export type UnconfiguredSlotRetainer = Readonly<{ status: "unconfigured" }>;

/**
 * A panel cut ready to be inserted into the four 3030 door-frame slots.
 *
 * The slot retainer/seal remains deliberately unconfigured: an 8 mm profile
 * slot does not retain a 4 mm panel without a selected liner or gasket.
 */
export type DoorInfillPanel = Readonly<{
  id: `${"left-door" | "right-door"}-infill`;
  leafId: "left-door" | "right-door";
  material: "material:compact-polycarbonate";
  surface: DoorInfillSurface;
  thicknessMm: number;
  installation: "slot-in";
  frameProfile: ProfileId;
  slotWidthMm: number;
  slotEngagementMm: number;
  edgeClearanceMm: number;
  cutSizeMm: Readonly<{ widthMm: number; heightMm: number }>;
  slotRetainer: UnconfiguredSlotRetainer;
  installationNote: string;
}>;

export type DoorInfillLeaf = Readonly<{
  id: "left-door" | "right-door";
  nominalWidthMm: number;
  nominalHeightMm: number;
}>;

export type DoorInfillPanelStandard = Readonly<{
  thicknessMm: number;
  slotWidthMm: number;
  slotEngagementMm: number;
  edgeClearanceMm: number;
  frameProfile: ProfileId;
  frameProfileSectionMm: number;
}>;

const unconfiguredSlotRetainer: UnconfiguredSlotRetainer = Object.freeze({
  status: "unconfigured",
});

export const makeProvisionalDoorInfillPanels = (
  leaves: readonly DoorInfillLeaf[],
  standard: DoorInfillPanelStandard,
): readonly DoorInfillPanel[] =>
  Object.freeze(
    leaves.map((leaf) => {
      const frameOpeningReductionMm = standard.frameProfileSectionMm * 2;
      const clearWidthMm = leaf.nominalWidthMm - frameOpeningReductionMm;
      const clearHeightMm = leaf.nominalHeightMm - frameOpeningReductionMm;
      const retainedEdgeMm = standard.slotEngagementMm - standard.edgeClearanceMm;
      return Object.freeze({
        id: `${leaf.id}-infill`,
        leafId: leaf.id,
        material: "material:compact-polycarbonate",
        surface: "hard-coated-candidate",
        thicknessMm: standard.thicknessMm,
        installation: "slot-in",
        frameProfile: standard.frameProfile,
        slotWidthMm: standard.slotWidthMm,
        slotEngagementMm: standard.slotEngagementMm,
        edgeClearanceMm: standard.edgeClearanceMm,
        cutSizeMm: Object.freeze({
          widthMm: clearWidthMm + retainedEdgeMm * 2,
          heightMm: clearHeightMm + retainedEdgeMm * 2,
        }),
        slotRetainer: unconfiguredSlotRetainer,
        installationNote:
          "Insert the panel before closing the final door-frame rail; select a compatible slot liner or gasket before manufacture.",
      });
    }),
  );

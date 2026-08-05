/**
 * Engineering and catalogue facts for EnclosureV2.
 *
 * These values are deliberately separate from `EnclosureV2Variables`: a
 * project stakeholder chooses variables, while a selected construction system
 * supplies standards.  They may become selectable catalog entries later, but
 * they are not silently authored dimensions.
 */
export type EnclosureV2Standards = Readonly<{
  profiles: Readonly<{
    aluminium3030: Readonly<{ sideMm: number }>;
    aluminium3060: Readonly<{ narrowSideMm: number; wideSideMm: number }>;
  }>;
  frame: Readonly<{
    structuralEnvelopeOffsetMm: number;
    frontOpeningReductionMm: Readonly<{ widthMm: number; heightMm: number }>;
  }>;
  construction: Readonly<{
    symmetricDoorLeafCount: number;
    structuralJointToleranceMm: number;
  }>;
  geometry: Readonly<{ halfSpanDivisor: number }>;
  doorInfill: Readonly<{
    thicknessMm: number;
    slotWidthMm: number;
    slotEngagementMm: number;
    edgeClearanceMm: number;
  }>;
  access: Readonly<{
    fullyOpenDoorAngleDeg: 90;
    hingeSideKeepOutMm: number;
    internalDepthKeepOutMm: number;
  }>;
  validation: Readonly<{ sampledDoorMotionMinimumClearanceMm: number }>;
}>;

export const defaultEnclosureV2Standards: EnclosureV2Standards = Object.freeze({
  profiles: Object.freeze({
    aluminium3030: Object.freeze({ sideMm: 30 }),
    aluminium3060: Object.freeze({ narrowSideMm: 30, wideSideMm: 60 }),
  }),
  frame: Object.freeze({
    structuralEnvelopeOffsetMm: 30,
    frontOpeningReductionMm: Object.freeze({ widthMm: 60, heightMm: 30 }),
  }),
  construction: Object.freeze({
    symmetricDoorLeafCount: 2,
    structuralJointToleranceMm: 0.1,
  }),
  geometry: Object.freeze({ halfSpanDivisor: 2 }),
  doorInfill: Object.freeze({
    thicknessMm: 4,
    slotWidthMm: 8.2,
    slotEngagementMm: 5,
    edgeClearanceMm: 0.5,
  }),
  access: Object.freeze({
    fullyOpenDoorAngleDeg: 90,
    hingeSideKeepOutMm: 5,
    internalDepthKeepOutMm: 0,
  }),
  validation: Object.freeze({ sampledDoorMotionMinimumClearanceMm: 2 }),
});

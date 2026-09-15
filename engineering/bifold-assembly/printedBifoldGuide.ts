/** Standalone revision C prototype; no load rating or manufacturing release. */
export const printedBifoldGuide = Object.freeze({
  status: "petg-fit-and-wear-prototype" as const,
  printer: "Bambu A1 mini",
  bedSideMm: 180,
  brimMm: 5,
  moduleLimitMm: 150,
  outerWidthMm: 46,
  channelWidthMm: 23,
  roofThicknessMm: 4,
  cavityHeightMm: 21,
  keeperStripThicknessMm: 4,
  throatWidthMm: 10,
  mountingRowOffsetMm: 15,
  mountingHoleDiameterMm: 4.5,
  mountingEndInsetMm: 12,
  seamGapMm: 0.2,
  keyLengthMm: 30,
  keyWidthMm: 3,
  keyThicknessMm: 1.8,
  keyPocketLengthMm: 15.2,
  keyPocketWidthMm: 3.4,
  keyPocketDepthMm: 2,
  keyRowOffsetMm: 20,
  rollerDiameterMm: 22,
  rollerWidthMm: 7,
  rollerCentreBelowHeaderMm: 15,
  rollerInnerRaceWidthMm: 5,
  bearingBushLengthMm: 3,
  axleHeadHeightMm: 3,
  keeperWasherDiameterMm: 18,
  keeperWasherBoreMm: 6.4,
  keeperWasherThicknessMm: 1.6,
  axleDiameterMm: 4,
  stemSpacerDiameterMm: 8,
  stemSpacerLengthMm: 10,
  carrierShelfThicknessMm: 6,
  carrierBottomWasherThicknessMm: 1,
  axleLocknutHeightMm: 5,
  axleScrewLengthMm: 40,
  provisionalHeadAllowanceMm: 55,
  couponLengthMm: 60,
});

export const evaluatePrintedGuide = (
  openingWidthMm: number,
  guideTravelMinMm: number,
  guideTravelMaxMm: number,
) => {
  const p = printedBifoldGuide;
  if (
    ![openingWidthMm, guideTravelMinMm, guideTravelMaxMm].every(Number.isFinite) ||
    openingWidthMm <= 0 ||
    guideTravelMinMm < 0 ||
    guideTravelMaxMm <= guideTravelMinMm ||
    guideTravelMaxMm > openingWidthMm
  )
    throw new Error("Invalid guide travel/opening dimensions");
  // Sixteen mm includes the 11 mm wheel radius and a 5 mm initial end margin.
  const endAllowanceMm = p.rollerDiameterMm / 2 + 5;
  const railStartMm = Math.floor((guideTravelMinMm - endAllowanceMm) / 5) * 5;
  const railEndMm = openingWidthMm;
  if (railStartMm < 0 || railEndMm - guideTravelMaxMm < endAllowanceMm)
    throw new Error("Guide rail has insufficient end clearance");
  const railLengthMm = railEndMm - railStartMm;
  const moduleCount = Math.ceil(railLengthMm / p.moduleLimitMm);
  const moduleLengthMm = (railLengthMm - (moduleCount - 1) * p.seamGapMm) / moduleCount;
  if (moduleLengthMm < p.keyLengthMm + 2 * p.mountingEndInsetMm)
    throw new Error("Guide modules are too short for mounting and alignment keys");
  const bodyHeightMm = p.roofThicknessMm + p.cavityHeightMm;
  const stackHeightMm = bodyHeightMm + p.keeperStripThicknessMm;
  const bodyMountingStationsMm = [
    p.mountingEndInsetMm,
    moduleLengthMm / 2,
    moduleLengthMm - p.mountingEndInsetMm,
  ];
  const keeperTopMm =
    p.rollerCentreBelowHeaderMm + p.rollerInnerRaceWidthMm / 2 + p.bearingBushLengthMm;
  const keeperBottomMm = keeperTopMm + p.keeperWasherThicknessMm;
  const screwHeadBottomMm =
    p.rollerCentreBelowHeaderMm - p.rollerInnerRaceWidthMm / 2 - p.bearingBushLengthMm;
  const screwHeadTopMm = screwHeadBottomMm - p.axleHeadHeightMm;
  const carrierTopMm = keeperBottomMm + p.stemSpacerLengthMm;
  const carrierBottomMm = carrierTopMm + p.carrierShelfThicknessMm;
  const locknutBottomMm =
    carrierBottomMm + p.carrierBottomWasherThicknessMm + p.axleLocknutHeightMm;
  const axleEndMm = screwHeadBottomMm + p.axleScrewLengthMm;
  const washerWorstEccentricityMm = (p.keeperWasherBoreMm - p.axleDiameterMm) / 2;
  const rollerSideFloatMm = (p.channelWidthMm - p.rollerDiameterMm) / 2;
  return {
    status: p.status,
    railStartMm,
    railEndMm,
    railLengthMm,
    moduleCount,
    moduleLengthMm,
    bodyHeightMm,
    stackHeightMm,
    bodyMountingStationsMm,
    moduleStartsMm: Array.from(
      { length: moduleCount },
      (_, i) => railStartMm + i * (moduleLengthMm + p.seamGapMm),
    ),
    mountingScrewCount: moduleCount * bodyMountingStationsMm.length * 2,
    keeperStripCount: moduleCount * 2,
    alignmentKeyCount: (moduleCount - 1) * 2,
    fitsBedWithBrim:
      moduleLengthMm + p.brimMm * 2 <= p.bedSideMm && p.outerWidthMm + p.brimMm * 2 <= p.bedSideMm,
    rollerSideFloatMm,
    keeperWorstOverlapMm:
      (p.keeperWasherDiameterMm - p.throatWidthMm) / 2 -
      washerWorstEccentricityMm -
      rollerSideFloatMm,
    throatStemClearanceEachSideMm: (p.throatWidthMm - p.stemSpacerDiameterMm) / 2,
    axleStackMm: {
      screwHeadTopMm,
      screwHeadBottomMm,
      keeperTopMm,
      keeperBottomMm,
      carrierTopMm,
      carrierBottomMm,
      locknutBottomMm,
      axleEndMm,
    },
    upwardFloatMm: Math.min(screwHeadTopMm - p.roofThicknessMm, carrierTopMm - stackHeightMm),
    downwardFloatMm: bodyHeightMm - keeperBottomMm,
    axleEndToLeafTopMm: p.provisionalHeadAllowanceMm - axleEndMm,
    screwProjectionBeyondLocknutMm: axleEndMm - locknutBottomMm,
  };
};

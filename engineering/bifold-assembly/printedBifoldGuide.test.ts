import { describe, expect, it } from "vitest";
import { evaluatePrintedGuide, printedBifoldGuide } from "./printedBifoldGuide";
import { bifoldAssemblyStudyDefaults, evaluateBifoldAssemblyStudy } from "./bifoldAssemblyStudy";

describe("A1 mini printed bifold guide prototype", () => {
  for (const width of [750, 824.5]) {
    it(`covers the complete ${width} mm opening guide travel with printable modules`, () => {
      const study = evaluateBifoldAssemblyStudy({
        ...bifoldAssemblyStudyDefaults,
        openingWidthMm: width,
        availableOutwardSpaceMm: 450,
        targetOutwardSweepMm: 400,
      });
      const plan = evaluatePrintedGuide(width, study.guideTravelMinMm, study.guideTravelMaxMm);
      expect(plan.moduleCount).toBe(5);
      expect(plan.fitsBedWithBrim).toBe(true);
      expect(plan.moduleStartsMm.at(-1)! + plan.moduleLengthMm).toBeCloseTo(plan.railEndMm);
      expect(plan.railEndMm - study.guideTravelMaxMm).toBeGreaterThan(16);
      expect(study.guideTravelMinMm - plan.railStartMm).toBeGreaterThan(16);
      expect(plan.mountingScrewCount).toBe(30);
    });
  }

  it("allows normal vertical float and keeper overlap despite washer/roller eccentricity", () => {
    const plan = evaluatePrintedGuide(750, 99.7271, 733.3301);
    expect(plan.upwardFloatMm).toBe(2.5);
    expect(plan.downwardFloatMm).toBeCloseTo(2.9);
    expect(plan.keeperWorstOverlapMm).toBeCloseTo(2.3);
    expect(plan.throatStemClearanceEachSideMm).toBe(1);
    expect(plan.axleEndToLeafTopMm).toBeGreaterThan(5);
    expect(plan.screwProjectionBeyondLocknutMm).toBeGreaterThan(1.4);
    expect(plan.stackHeightMm).toBe(29);
  });

  it("rejects reversed travel, missing end clearance and oversized assumptions", () => {
    expect(() => evaluatePrintedGuide(750, 100, 99)).toThrow("Invalid");
    expect(() => evaluatePrintedGuide(750, 100, 749)).toThrow("end clearance");
    expect(() => evaluatePrintedGuide(Number.NaN, 100, 730)).toThrow("Invalid");
    expect(printedBifoldGuide.couponLengthMm + 2 * printedBifoldGuide.brimMm).toBeLessThan(180);
  });
});

import { describe, expect, it } from "vitest";
import { bifoldAssemblyStudyDefaults, evaluateBifoldAssemblyStudy } from "./bifoldAssemblyStudy";

const rear = {
  ...bifoldAssemblyStudyDefaults,
  openingWidthMm: 750,
  availableOutwardSpaceMm: 450,
  targetOutwardSweepMm: 400,
};

describe("retained-frame bifold assembly design study", () => {
  it("closes with the specified jamb/meeting gaps and keeps the guide on its line", () => {
    const result = evaluateBifoldAssemblyStudy(rear);
    const closed = result.poses[0];
    expect(closed.primaryPolygon[0].x).toBeCloseTo(5);
    expect(closed.secondaryPolygon[1].x).toBeCloseTo(745);
    expect(closed.secondaryPolygon[0].x - closed.primaryPolygon[1].x).toBeCloseTo(5);
    for (const pose of result.poses) {
      expect(pose.guideCentre.y).toBeCloseTo(-15, 8);
      expect(pose.foldAngleDeg).toBeGreaterThanOrEqual(0);
      expect(pose.foldAngleDeg).toBeLessThanOrEqual(180);
    }
  });

  it("screens the smaller rear opening and measures actual parked obstruction", () => {
    const result = evaluateBifoldAssemblyStudy(rear);
    expect(result.primaryWidthMm).toBe(347.5);
    expect(result.secondaryWidthMm).toBe(387.5);
    expect(result.reservedSweepMm).toBeLessThan(400);
    expect(result.remainingOutwardSpaceMm).toBeGreaterThan(50);
    expect(result.minimumSampledLeafClearanceMm).toBeGreaterThan(2);
    expect(result.parkedUsableWidthMm).toBeGreaterThan(600);
    expect(result.parkedUsableWidthMm).toBeLessThan(650);
    expect(result.poses.at(-1)?.primaryAngleDeg).toBe(88);
  });

  it("detects the 180-degree hinge limit before an assumed 90-degree park", () => {
    expect(() => evaluateBifoldAssemblyStudy({ ...rear, parkedAngleDeg: 90 })).toThrow(
      "Interleaf hinge rotation exceeded",
    );
  });

  it("reserves the guide overtravel beyond closure and includes the parking endpoint", () => {
    const result = evaluateBifoldAssemblyStudy({ ...rear, sampleStepDeg: 0.3 });
    expect(result.guideTravelMaxMm - result.poses[0].guideCentre.x).toBeGreaterThan(3);
    expect(result.poses.at(-1)?.primaryAngleDeg).toBe(88);
  });

  it("shows why the previous rear opening misses the requested 400 mm sweep target", () => {
    const result = evaluateBifoldAssemblyStudy({ ...rear, openingWidthMm: 837 });
    expect(result.meetsSweepTarget).toBe(false);
    expect(result.reservedSweepMm).toBeGreaterThan(410);
  });

  it("does not approve a sweep just because the bare leaves fit the available space", () => {
    const result = evaluateBifoldAssemblyStudy({ ...rear, hardwareEnvelopeAllowanceMm: 100 });
    expect(result.meetsSweepTarget).toBe(false);
    expect(result.remainingOutwardSpaceMm).toBeLessThan(0);
  });

  it("rejects impossible frames and unbounded sampling requests", () => {
    expect(() => evaluateBifoldAssemblyStudy({ ...rear, openingWidthMm: 100 })).toThrow(
      "too small",
    );
    expect(() => evaluateBifoldAssemblyStudy({ ...rear, sampleStepDeg: 0 })).toThrow(
      "sampleStepDeg",
    );
    expect(() => evaluateBifoldAssemblyStudy({ ...rear, sampleStepDeg: 0.00001 })).toThrow("10000");
    expect(() => evaluateBifoldAssemblyStudy({ ...rear, openingWidthMm: Number.NaN })).toThrow(
      "finite",
    );
  });
});

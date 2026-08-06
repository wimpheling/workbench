import { readFile } from "node:fs/promises";
import { describe, expect, it, beforeAll } from "vitest";
import { importSTEP } from "replicad";
import { initializeOpenCascade } from "./enclosureScene";
import { loadManufacturerCad } from "./manufacturerCad";

const importStepAt = async (relativePath: string) =>
  importSTEP(new Blob([await readFile(new URL(relativePath, import.meta.url))]));

describe("supplier STEP assets", () => {
  beforeAll(async () => {
    await initializeOpenCascade();
  });

  it("imports the supplied profile, hinges, and guided bi-fold hardware", async () => {
    const [profile, profile3060, hinge, guide, interLeafHinge] = await Promise.all([
      importStepAt("../../AST03003004.step"),
      importStepAt("../../AST03006006.step"),
      importStepAt("../../GLR3030.step"),
      importStepAt("../../GSD082.3000KIT.step"),
      importStepAt("../../Hinges CFG.30_30 SH-6-C33 (0).stp"),
    ]);
    expect(profile.boundingBox.bounds).toHaveLength(2);
    expect(profile3060.boundingBox.bounds).toHaveLength(2);
    expect(hinge.boundingBox.bounds).toHaveLength(2);
    expect(guide.boundingBox.bounds).toHaveLength(2);
    expect(interLeafHinge.boundingBox.bounds).toHaveLength(2);
  });

  it("preserves the GLR3030 supplier shells and CFG supplier solids", async () => {
    const cad = await loadManufacturerCad();
    expect(cad.glr3030LeafGeometries).toHaveLength(1);
    expect(cad.glr3030StationaryGeometries).toHaveLength(6);
    expect(
      [...cad.glr3030LeafGeometries, ...cad.glr3030StationaryGeometries].every(
        (geometry) => geometry.getIndex()!.count > 0,
      ),
    ).toBe(true);
    expect(cad.glr3030PivotToMountingPlaneMm).toBe(8);
    cad.glr3030LeafGeometries[0]!.computeBoundingBox();
    expect(cad.glr3030LeafGeometries[0]!.boundingBox!.min.x).toBeCloseTo(-8);
    expect(cad.glr3030LeafGeometries[0]!.boundingBox!.max.x).toBeCloseTo(28);
    expect(cad.gsd082GuideGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.cfg3030PrimaryWingGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.cfg3030PinGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.cfg3030SecondaryWingGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.cfg3030PivotToMountingPlaneMm).toBe(8);
    cad.cfg3030PrimaryWingGeometry.computeBoundingBox();
    cad.cfg3030PinGeometry.computeBoundingBox();
    cad.cfg3030SecondaryWingGeometry.computeBoundingBox();
    expect(cad.cfg3030PrimaryWingGeometry.boundingBox!.min.x).toBeCloseTo(-27);
    expect(cad.cfg3030PrimaryWingGeometry.boundingBox!.max.x).toBeCloseTo(8);
    expect(cad.cfg3030PinGeometry.boundingBox!.min.x).toBeCloseTo(-4);
    expect(cad.cfg3030PinGeometry.boundingBox!.max.x).toBeCloseTo(4);
    expect(cad.cfg3030SecondaryWingGeometry.boundingBox!.min.x).toBeCloseTo(-8);
    expect(cad.cfg3030SecondaryWingGeometry.boundingBox!.max.x).toBeCloseTo(27);
  });
});

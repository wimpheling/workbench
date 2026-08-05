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

  it("splits the GLR3030 at its supplier STEP barrel axis", async () => {
    const cad = await loadManufacturerCad();
    expect(cad.glr3030LeafGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.glr3030StationaryGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.gsd082GuideGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.cfg3030PrimaryGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.cfg3030SecondaryGeometry.getIndex()!.count).toBeGreaterThan(0);
  });
});

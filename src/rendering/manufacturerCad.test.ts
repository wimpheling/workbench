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

  it("imports the supplied Wolweiss profile and GLR3030 hinge", async () => {
    const [profile, profile3060, hinge] = await Promise.all([
      importStepAt("../../AST03003004.step"),
      importStepAt("../../AST03006006.step"),
      importStepAt("../../GLR3030.step"),
    ]);
    expect(profile.boundingBox.bounds).toHaveLength(2);
    expect(profile3060.boundingBox.bounds).toHaveLength(2);
    expect(hinge.boundingBox.bounds).toHaveLength(2);
  });

  it("splits the GLR3030 at its supplier STEP barrel axis", async () => {
    const cad = await loadManufacturerCad();
    expect(cad.glr3030LeafGeometry.getIndex()!.count).toBeGreaterThan(0);
    expect(cad.glr3030StationaryGeometry.getIndex()!.count).toBeGreaterThan(0);
  });
});

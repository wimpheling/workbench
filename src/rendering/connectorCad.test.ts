import { readFile } from "node:fs/promises";
import { describe, expect, it, beforeAll } from "vitest";
import { importSTEP } from "replicad";
import { initializeOpenCascade } from "./enclosureScene";
import { loadManufacturerCad } from "./manufacturerCad";

const importStepAt = async (relativePath: string) =>
  importSTEP(new Blob([await readFile(new URL(relativePath, import.meta.url))]));

describe("supplier connector STEP assets", () => {
  beforeAll(async () => {
    await initializeOpenCascade();
  });

  it("imports the selected Wolweiss CBR connectors", async () => {
    const [cbr3030, cbr3060] = await Promise.all([
      importStepAt("../../CBR3030.step"),
      importStepAt("../../CBR3060.step"),
    ]);
    expect(cbr3030.boundingBox.bounds).toHaveLength(2);
    expect(cbr3060.boundingBox.bounds).toHaveLength(2);
  });

  it("imports the supplied CIB08T internal bracket", async () => {
    const cib = await importStepAt("../../CIB08T.step");
    expect(cib.boundingBox.bounds).toHaveLength(2);
  });

  it("normalizes both supplier assets to their physical mounting-plane datum", async () => {
    const cad = await loadManufacturerCad();
    for (const [geometry, legLengthMm] of [
      [cad.cbr3030Geometry, 27],
      [cad.cbr3060Geometry, 57],
    ] as const) {
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox!;
      expect(bounds.min.x).toBeCloseTo(-13, 3);
      expect(bounds.max.x).toBeCloseTo(13, 3);
      expect(bounds.max.y).toBeCloseTo(legLengthMm, 3);
      expect(bounds.max.z).toBeCloseTo(legLengthMm, 3);
      // The ~2.1 mm excursions behind the Y=0/Z=0 contact planes are the
      // supplier's anti-rotation tabs that enter the extrusion slots.
      expect(bounds.min.y).toBeCloseTo(-2.121, 3);
      expect(bounds.min.z).toBeCloseTo(-2.121, 3);
    }
  });
});

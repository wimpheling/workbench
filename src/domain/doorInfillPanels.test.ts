import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "./enclosureV2";

describe("door infill panels", () => {
  it("derives vendor-cut hard-coated polycarbonate panels retained in the 3030 door slots", () => {
    const model = makeEnclosureV2({ width: 1200, height: 800, depth: 600 });

    expect(model.doorInfillPanels).toEqual([
      expect.objectContaining({
        id: "left-door-infill",
        leafId: "left-door",
        material: "material:compact-polycarbonate",
        surface: "hard-coated-candidate",
        thicknessMm: 4,
        installation: "slot-in",
        frameProfile: "profile:aluminium-3030",
        slotWidthMm: 8.2,
        slotEngagementMm: 5,
        edgeClearanceMm: 0.5,
        cutSizeMm: { widthMm: 514.5, heightMm: 713 },
        slotRetainer: { status: "unconfigured" },
      }),
      expect.objectContaining({
        id: "right-door-infill",
        cutSizeMm: { widthMm: 514.5, heightMm: 713 },
      }),
    ]);
  });
});

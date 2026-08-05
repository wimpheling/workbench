import { describe, expect, it } from "vitest";
import { makeCentredGlr3030Installations, wolweissGlr3030 } from "./doorHardware";

describe("Wolweiss GLR3030 hinge selection", () => {
  it("records supplier drawing dimensions and centres the long hinge on each leaf", () => {
    expect(wolweissGlr3030).toMatchObject({
      productCode: "GLR3030",
      compatibleProfile: "profile:aluminium-3030",
      overallHeightMm: 600,
      mountingHoleSpanMm: 500,
      mountingHoleDiameterMm: 6.5,
      barrelDiameterMm: 16,
      plateThicknessMm: 6,
      plateWidthMm: 28,
      maximumRatedLoadN: 500,
      geometryFidelity: "technical-drawing-envelope",
    });
    expect(
      makeCentredGlr3030Installations([
        { id: "left-door", nominalHeight: 704 },
        { id: "right-door", nominalHeight: 704 },
      ]),
    ).toMatchObject([
      {
        leafId: "left-door",
        leafBottomOffsetMm: 52,
        pivotPlacementStatus: "verified-from-supplier-step",
      },
      {
        leafId: "right-door",
        leafBottomOffsetMm: 52,
        pivotPlacementStatus: "verified-from-supplier-step",
      },
    ]);
  });

  it("retains an incompatible hinge selection as a visible design issue", () => {
    expect(makeCentredGlr3030Installations([{ id: "left-door", nominalHeight: 599 }])).toEqual([
      expect.objectContaining({
        leafBottomOffsetMm: undefined,
        fitStatus: "incompatible-leaf-height",
      }),
    ]);
  });
});

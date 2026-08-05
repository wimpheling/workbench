import { describe, expect, it } from "vitest";
import { buildCutPlan, buildManufacturingReport } from "./manufacturing";
import { makeEnclosureV2 } from "./enclosureV2";

describe("manufacturing", () => {
  it("plans cuts with kerf and reports waste", () => {
    const plan = buildCutPlan(
      [{ partId: "a", quantity: 2, material: "aluminium", profile: "3030", cutLength: 100 }],
      [250],
      3,
    );
    expect(plan.cuts).toHaveLength(2);
    expect(plan.cuts[1].offset).toBe(103);
    expect(plan.waste).toBe(44);
  });

  it("uses the profile catalog for stock lengths and the default estimate", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    const report = buildManufacturingReport(model);

    expect(report.cutPlan.stock.every((item) => item.length === 6000)).toBe(true);
    expect(report.estimatedCost).toBeGreaterThan(0);
  });
});

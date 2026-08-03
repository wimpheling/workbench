import { describe, expect, it } from "vitest";
import { buildCutPlan } from "./manufacturing";

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
});

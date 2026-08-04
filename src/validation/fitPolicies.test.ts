import { describe, expect, it } from "vitest";
import { defaultFitPolicies, evaluateFit, requiredFitPolicy } from "./fitPolicies";

describe("fit policies", () => {
  it("rejects clearance below the named minimum", () => {
    const policy = defaultFitPolicies.find((item) => item.id === "door-seam-clearance")!;
    expect(evaluateFit(policy, 0.5).passed).toBe(false);
  });
  it("includes thickness tolerance in panel-slot clearance", () => {
    const policy = defaultFitPolicies.find((item) => item.id === "polycarbonate-panel-slot")!;
    expect(evaluateFit(policy, 0.25).required).toBeCloseTo(0.3);
    expect(evaluateFit(policy, 0.25).passed).toBe(false);
    expect(evaluateFit(policy, 0.31).passed).toBe(true);
  });
  it("names the remaining enclosure allowance and manufacturing interfaces", () => {
    expect(defaultFitPolicies.map((policy) => policy.interface)).toEqual(
      expect.arrayContaining([
        "panel-installation",
        "hinge-side",
        "latch-side",
        "slot-depth",
        "fastener-hole",
        "saw-cut",
      ]),
    );
    expect(() => requiredFitPolicy("missing-policy")).toThrow("Unknown fit policy");
  });
});

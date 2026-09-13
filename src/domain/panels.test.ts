import { describe, expect, it } from "vitest";
import { evaluatePanel, type PanelDefinition } from "./panels";

describe("panels", () => {
  it("derives a clear cut size from a bounded rectangular panel", () => {
    const panel: PanelDefinition = {
      id: "p",
      boundary: {
        id: "b",
        corners: [
          { x: 0, y: 0, z: 0 },
          { x: 100, y: 0, z: 0 },
          { x: 100, y: 50, z: 0 },
          { x: 0, y: 50, z: 0 },
        ],
      },
      material: "polycarbonate",
      thickness: 4,
      installation: "slot-in",
      edgeClearance: 1,
      expansionAllowance: 0.5,
    };
    expect(evaluatePanel(panel).clearSize).toEqual({ width: 97, height: 47 });
  });
  it("rejects a panel whose clearance consumes its boundary", () => {
    const panel: PanelDefinition = {
      id: "p",
      boundary: {
        id: "b",
        corners: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
      },
      material: "polycarbonate",
      thickness: 4,
      installation: "slot-in",
      edgeClearance: 1,
      expansionAllowance: 0,
    };
    expect(evaluatePanel(panel).passed).toBe(false);
  });
});

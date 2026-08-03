import { describe, expect, it } from "vitest";
import { aluminiumProfiles, getProfile } from "./profiles";

describe("aluminium profile catalog", () => {
  it("contains canonical 3030 and 3060 t-slot sections", () => {
    expect(aluminiumProfiles).toHaveLength(2);
    expect(getProfile("aluminium-3030")).toMatchObject({
      id: "aluminium-3030",
      section: { x: 30, y: 30, z: 30 },
      geometry: "tSlot",
      material: "aluminium",
      slotWidth: 8,
    });
    expect(getProfile("aluminium-3060")).toMatchObject({
      id: "aluminium-3060",
      section: { x: 30, y: 60, z: 30 },
      geometry: "tSlot",
      material: "aluminium",
      slotWidth: 8,
    });
  });
});

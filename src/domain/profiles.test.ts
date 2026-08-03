import { describe, expect, it } from "vitest";
import { aluminiumProfiles, defaultProfileCatalog, getProfile } from "./profiles";
import { profileId } from "./ids";
describe("aluminium profile catalog", () => {
  it("contains canonical 3030 and 3060 t-slot sections", () => {
    expect(aluminiumProfiles).toHaveLength(2);
    expect(getProfile(profileId("aluminium-3030"))).toMatchObject({
      id: "profile:aluminium-3030",
      section: { x: 30, y: 30, z: 30 },
      geometry: "tSlot",
      material: "aluminium",
      slotWidth: 8,
    });
    expect(getProfile(profileId("aluminium-3060"))).toMatchObject({
      id: "profile:aluminium-3060",
      section: { x: 30, y: 60, z: 30 },
      geometry: "tSlot",
      material: "aluminium",
      slotWidth: 8,
    });
  });
  it("has immutable catalog entries and rejects unknown IDs", () => {
    expect(() => defaultProfileCatalog().set(profileId("x"), aluminiumProfiles[0])).toThrow();
    expect(() => getProfile(profileId("missing"))).toThrow("Unknown profile");
  });
});

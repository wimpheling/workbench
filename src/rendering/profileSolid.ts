import { draw, type Shape3D } from "replicad";
import { getProfile } from "../domain/profiles";
import type { ProfileId } from "../domain/ids";

/**
 * A local, manufactured extrusion solid.
 *
 * Its basis is deliberately independent from a member's world placement:
 * X is the cut length, Y is the visible section width, and Z is the profile
 * depth (and the normal of its nominal front face).  The geometric centre is
 * always at the local origin, so a domain placement can be applied directly.
 */
export type ProfileSolid = Shape3D;

const SLOT_LIP_MM = 11;
const PROFILE_3030_OPENING_MM = 8;
const PROFILE_3060_WIDE_OPENING_MM = 38;
const PROFILE_3060_SIDE_RUN_MM = 8;

const create3030Outline = () =>
  draw([-15, 15])
    .hLine(SLOT_LIP_MM)
    .vLine(-SLOT_LIP_MM)
    .hLine(PROFILE_3030_OPENING_MM)
    .vLine(SLOT_LIP_MM)
    .hLine(SLOT_LIP_MM)
    .vLine(-SLOT_LIP_MM)
    .hLine(-SLOT_LIP_MM)
    .vLine(-PROFILE_3030_OPENING_MM)
    .hLine(SLOT_LIP_MM)
    .vLine(-SLOT_LIP_MM)
    .hLine(-SLOT_LIP_MM)
    .vLine(SLOT_LIP_MM)
    .hLine(-PROFILE_3030_OPENING_MM)
    .vLine(-SLOT_LIP_MM)
    .hLine(-SLOT_LIP_MM)
    .vLine(SLOT_LIP_MM)
    .hLine(SLOT_LIP_MM)
    .vLine(PROFILE_3030_OPENING_MM)
    .hLine(-SLOT_LIP_MM)
    .vLine(SLOT_LIP_MM)
    .close();

// This is the retained legacy 3060 section, expressed directly in millimetres.
// The outline is intentionally not approximated with a box: its four exposed
// faces retain the slot relief used by the original enclosure model.
const create3060Outline = () =>
  draw([-30, 15])
    .hLine(SLOT_LIP_MM)
    .vLine(-SLOT_LIP_MM)
    .hLine(PROFILE_3060_WIDE_OPENING_MM)
    .vLine(SLOT_LIP_MM)
    .hLine(SLOT_LIP_MM)
    .vLine(-SLOT_LIP_MM)
    .hLine(-SLOT_LIP_MM)
    .vLine(-PROFILE_3060_SIDE_RUN_MM)
    .hLine(SLOT_LIP_MM)
    .vLine(-SLOT_LIP_MM)
    .hLine(-SLOT_LIP_MM)
    .vLine(SLOT_LIP_MM)
    .hLine(-PROFILE_3060_WIDE_OPENING_MM)
    .vLine(-SLOT_LIP_MM)
    .hLine(-SLOT_LIP_MM)
    .vLine(SLOT_LIP_MM)
    .hLine(SLOT_LIP_MM)
    .vLine(PROFILE_3060_SIDE_RUN_MM)
    .hLine(-SLOT_LIP_MM)
    .vLine(SLOT_LIP_MM)
    .close();

const outlineFor = (profileId: ProfileId) => {
  switch (profileId) {
    case "profile:aluminium-3030":
      return create3030Outline();
    case "profile:aluminium-3060":
      return create3060Outline();
    default:
      throw new Error(`Profile ${profileId} has no Replicad T-slot outline`);
  }
};

export function createProfileSolid(lengthMm: number, profileId: ProfileId): ProfileSolid {
  if (!Number.isFinite(lengthMm) || lengthMm <= 0) {
    throw new Error(`Profile length must be a positive finite millimetre value, got ${lengthMm}`);
  }
  const profile = getProfile(profileId);
  if (profile.geometry !== "tSlot") {
    throw new Error(`Profile ${profileId} is not a T-slot profile`);
  }

  // `YZ` gives the section its declared local axes.  A directed extrusion is
  // used rather than relying on the plane normal, which makes the longitudinal
  // X direction explicit and keeps the solid centred on X.
  return outlineFor(profileId)
    .sketchOnPlane("YZ", [-lengthMm / 2, 0, 0])
    .extrude(lengthMm, { extrusionDirection: [1, 0, 0] }) as ProfileSolid;
}

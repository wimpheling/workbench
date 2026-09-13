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

const create3030Outline = (slotOpeningMm: number) => {
  const faceRunMm = (getProfile("profile:aluminium-3030").section.y - slotOpeningMm) / 2;
  return draw([-15, 15])
    .hLine(faceRunMm)
    .vLine(-faceRunMm)
    .hLine(slotOpeningMm)
    .vLine(faceRunMm)
    .hLine(faceRunMm)
    .vLine(-faceRunMm)
    .hLine(-faceRunMm)
    .vLine(-slotOpeningMm)
    .hLine(faceRunMm)
    .vLine(-faceRunMm)
    .hLine(-faceRunMm)
    .vLine(faceRunMm)
    .hLine(-slotOpeningMm)
    .vLine(-faceRunMm)
    .hLine(-faceRunMm)
    .vLine(faceRunMm)
    .hLine(faceRunMm)
    .vLine(slotOpeningMm)
    .hLine(-faceRunMm)
    .vLine(faceRunMm)
    .close();
};

const create3060Outline = (slotOpeningMm: number) => {
  const profile = getProfile("profile:aluminium-3060");
  const faceRunMm = (profile.section.z - slotOpeningMm) / 2;
  const wideOpeningMm = profile.section.y - faceRunMm * 2;
  return draw([-profile.section.y / 2, profile.section.x / 2])
    .hLine(faceRunMm)
    .vLine(-faceRunMm)
    .hLine(wideOpeningMm)
    .vLine(faceRunMm)
    .hLine(faceRunMm)
    .vLine(-faceRunMm)
    .hLine(-faceRunMm)
    .vLine(-slotOpeningMm)
    .hLine(faceRunMm)
    .vLine(-faceRunMm)
    .hLine(-faceRunMm)
    .vLine(faceRunMm)
    .hLine(-wideOpeningMm)
    .vLine(-faceRunMm)
    .hLine(-faceRunMm)
    .vLine(faceRunMm)
    .hLine(faceRunMm)
    .vLine(slotOpeningMm)
    .hLine(-faceRunMm)
    .vLine(faceRunMm)
    .close();
};

/*
 * These outlines describe the declared outer section and vendor slot opening,
 * not the hidden internal web geometry.  Keeping that distinction explicit
 * prevents collision checks from being mistaken for imported manufacturer CAD.
 */
const outlineFor = (profileId: ProfileId) => {
  const profile = getProfile(profileId);
  switch (profileId) {
    case "profile:aluminium-3030":
      return create3030Outline(profile.slotWidth);
    case "profile:aluminium-3060":
      return create3060Outline(profile.slotWidth);
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

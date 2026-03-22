export enum EnclosureV2Groups {
  Structure = "Structure",
  Panels = "Panels",
  Internal = "internal",
}

export enum EnclosureV2Materials {
  AluminiumSingle = "aluminium-single",
  AluminiumDouble = "aluminium-double",
}

export const ENCLOSURE_INNER_HEIGHT = 74;
export const ENCLOSURE_INNER_WIDTH = 167.4;
export const ENCLOSURE_INNER_DEPTH = 164.9;
export const EXTRUSION_PROFILE_WIDTH = 2; // 20x20 aluminium extrusion
export const EXTRUSION_PROFILE_DEPTH = 2; // 20x20 aluminium extrusion
export const BIG_EXTRUSION_WIDTH = 4; // 40x20 aluminium extrusion
export const BIG_EXTRUSION_DEPTH = 2; // 40x20 aluminium extrusion

export const SIDE_HORIZONTAL_EXTRUSION_HEIGHT =
  ENCLOSURE_INNER_DEPTH / 2 - BIG_EXTRUSION_WIDTH / 2;

export const FRONT_HORIZONTAL_EXTRUSION_HEIGHT =
  ENCLOSURE_INNER_WIDTH / 2 - BIG_EXTRUSION_WIDTH / 2;

export const FRONT_BACK_MIDDLE_JOINT_HEIGHT = EXTRUSION_PROFILE_DEPTH * 6;

export const RIGHT_SIDE_X =
  ENCLOSURE_INNER_WIDTH + EXTRUSION_PROFILE_DEPTH * 1.5;

export const BACK_Z = 0 - ENCLOSURE_INNER_DEPTH - EXTRUSION_PROFILE_DEPTH * 1.5;

export const VERTICAL_BIG_EXTRUSION_HEIGHT =
  ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH;

export const ENCLOSURE_DEPTH = 189;
export const ENCLOSURE_HEIGHT = 75;
export const ENCLOSURE_WIDTH = 180;

export const ENCLOSURE_WALL_THICKNESS = 0.5;
export const ENCLOSURE_VIGA_THICKNESS = 1;
export const ENCLOSURE_FOAM_THICKNESS = 50;

export const SLIDING_PANEL_WIDTH =
  ENCLOSURE_VIGA_THICKNESS * 2 + ENCLOSURE_FOAM_THICKNESS;

export const STRUCTURE_JOINT_SIZE = 3;
export const STRUCTURE_BOX_SIZE = 5;

export const LATERAL_WIDTH_PIECE_1_WIDTH =
  Math.round((ENCLOSURE_WIDTH * 2) / 3) + STRUCTURE_JOINT_SIZE;

export const LATERAL_WIDTH_PIECE_2_WIDTH = Math.round(
  (ENCLOSURE_WIDTH * 1) / 3,
);

export enum Materials {
  Wood = "Wood",
}

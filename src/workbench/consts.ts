export const TABLE_WIDTH = 183;
export const TABLE_DEPTH = 193;
export const TABLE_TOP_THICKNESS = 1.9;

export const FOOT_DEPTH = 9.5;
export const FOOT_HEIGHT = 90;
export const FOOT_WIDTH = 9.5;

export const VIGA_HEIGHT = 2;
export const VIGA_WIDTH = 10;

export const SPACE_BETWEEN_SHELVES = 70;

export const ENCLOSURE_VIGA_WIDTH = 6;
export const ENCLOSURE_VIGA_THICKNESS = 1;
export const ENCLOSURE_WALL_THICKNESS = 1;

export const ENCLOSURE_HEIGHT = 75;
export const ENCLOSURE_FOAM_THICKNESS = 5;
export const ENCLOSURE_SOUND_INSULATOR_THICKNESS = 1;

export const ENCLOSURE_DOOR_THICKNESS = 5;

export const SMALL_VIGA_SIZE_WIDTH = TABLE_WIDTH - VIGA_HEIGHT * 2;
export const SMALL_VIGA_SIZE_DEPTH = TABLE_DEPTH - VIGA_HEIGHT * 2;

export const enclosureThicknessWithoutInnerWall =
  ENCLOSURE_FOAM_THICKNESS +
  ENCLOSURE_SOUND_INSULATOR_THICKNESS +
  ENCLOSURE_WALL_THICKNESS;
export const innerLateralEnclosureDepth =
  TABLE_DEPTH - enclosureThicknessWithoutInnerWall - ENCLOSURE_DOOR_THICKNESS;
export const innerLateralEnclosureWallHeight =
  ENCLOSURE_HEIGHT - enclosureThicknessWithoutInnerWall;
export const enclosureWallInnerTopWidth =
  TABLE_WIDTH - 2 * enclosureThicknessWithoutInnerWall;
export const enclouseOuterDepth = TABLE_DEPTH - ENCLOSURE_DOOR_THICKNESS;
export const enclosureInnerY =
  FOOT_HEIGHT + TABLE_TOP_THICKNESS + innerLateralEnclosureWallHeight / 2;
export const enclosureOuterY =
  FOOT_HEIGHT + TABLE_TOP_THICKNESS + ENCLOSURE_HEIGHT / 2;
export const enclosureInnerZ =
  0 -
  TABLE_DEPTH / 2 +
  innerLateralEnclosureDepth / 2 +
  enclosureThicknessWithoutInnerWall;
export const TABLE_TOP_Y = FOOT_HEIGHT + TABLE_TOP_THICKNESS / 2;

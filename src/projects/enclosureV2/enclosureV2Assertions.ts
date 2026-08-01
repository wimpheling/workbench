import type { Piece } from '../../lib/AbstractShapeMaker';
import { EnclosureV2Groups, EnclosureV2Materials } from './consts';
import type { EnclosureV2ShapeMaker } from './enclosureV2ShapeMaker';

function getStructurePiece(pieces: Piece[], name: string): Piece {
  const piece = pieces.find((candidate) => candidate.name === name);
  if (!piece) {
    throw new Error(`Enclosure V2 is missing structure piece: ${name}`);
  }
  return piece;
}

function assertProfile(piece: Piece, profileType: '3030' | '3060', material: string) {
  if (piece.geometry.type !== 'extrusion' || piece.geometry.profileType !== profileType) {
    throw new Error(`${piece.name} must use a ${profileType} extrusion`);
  }
  if (piece.material !== material) {
    throw new Error(`${piece.name} has the wrong aluminium material classification`);
  }
}

export function assertEnclosureV2(shapeMaker: EnclosureV2ShapeMaker) {
  const structure = shapeMaker.objectsByGroup[EnclosureV2Groups.Structure] ?? [];
  const single = EnclosureV2Materials.AluminiumSingle;
  const double = EnclosureV2Materials.AluminiumDouble;

  for (const name of [
    'Left Side Bottom extrusion',
    'Right Side Bottom front extrusion',
    'Front Bottom Horizontal extrusion',
    'Back Bottom Horizontal extrusion',
    'Left Side Top extrusion',
    'Right Side Top extrusion',
    'Back Top Horizontal extrusion',
    'Back Top Depth Tie',
    'Back Left Vertical extrusion',
    'Back Right Vertical extrusion',
  ]) {
    assertProfile(getStructurePiece(structure, name), '3030', single);
  }

  for (const name of [
    'Left Side Middle Support',
    'Right Side Middle Support',
    'Front Top Horizontal extrusion',
    'Front Left Vertical extrusion',
    'Front Right Vertical extrusion',
    'Back Middle Joint',
  ]) {
    assertProfile(getStructurePiece(structure, name), '3060', double);
  }

  const doors = shapeMaker.compoundsByGroup[EnclosureV2Groups.Doors] ?? [];
  if (doors.length !== 2 || doors.some((door) => !door.width || door.width <= 0)) {
    throw new Error('Enclosure V2 must define two positive-width doors');
  }
}

import {
  AbstractShapeMaker,
  CompoundPiece,
  Piece,
} from "../../lib/AbstractShapeMaker";
import {
  BIG_EXTRUSION_DEPTH,
  BIG_EXTRUSION_WIDTH,
  EnclosureV2Groups,
  EnclosureV2Materials,
  EXTRUSION_PROFILE_DEPTH,
  EXTRUSION_PROFILE_WIDTH,
} from "./consts";

export class EnclosureV2ShapeMaker extends AbstractShapeMaker {
  constructor() {
    super(["internal"]);
  }

  makeSingleExtrusion({
    height,
    name,
    group,
    assemble,
    color = "silver",
  }: {
    height: number;
    name: string;
    group: string;
    assemble: (obj: THREE.Object3D) => void;
    color?: string;
  }) {
    // Create a 20x20 aluminium extrusion piece
    return this.makeShape({
      geometry: {
        height,
        width: EXTRUSION_PROFILE_WIDTH,
        depth: EXTRUSION_PROFILE_DEPTH,
        type: "box",
      },
      color,
      name,
      group,
      material: EnclosureV2Materials.AluminiumSingle,
      assemble,
    });
  }

  makeDoubleExtrusion({
    height,
    name,
    group,
    assemble,
    color = "silver",
  }: {
    height: number;
    name: string;
    group: string;
    assemble: (obj: THREE.Object3D) => void;
    color?: string;
  }) {
    // Create a 20x40 aluminium extrusion piece
    return this.makeShape({
      geometry: {
        height,
        width: BIG_EXTRUSION_WIDTH,
        depth: BIG_EXTRUSION_DEPTH,
        type: "box",
      },
      color,
      name,
      group,
      material: EnclosureV2Materials.AluminiumDouble,
      assemble,
    });
  }

  makeDoor({
    width,
    height,
    name,
    hingePosition = "left",
    panelDepth = 0.5,
    panelColor = "clear",
    assemble,
  }: {
    width: number;
    height: number;
    name: string;
    hingePosition?: "left" | "right";
    panelDepth?: number;
    panelColor?: string;
    assemble: (obj: THREE.Object3D) => void;
  }) {
    const framePieces: Piece[] = [];

    const leftVertical: Piece = {
      name: `${name} Left Vertical`,
      geometry: {
        height,
        width: EXTRUSION_PROFILE_WIDTH,
        depth: EXTRUSION_PROFILE_DEPTH,
        type: "box",
      },
      color: "silver",
      group: EnclosureV2Groups.Doors,
      material: EnclosureV2Materials.AluminiumSingle,
      assemble: (obj) => {
        obj.position.set(
          -width / 2 + EXTRUSION_PROFILE_WIDTH / 2,
          height / 2,
          0,
        );
      },
    };
    framePieces.push(leftVertical);

    const rightVertical: Piece = {
      name: `${name} Right Vertical`,
      geometry: {
        height,
        width: EXTRUSION_PROFILE_WIDTH,
        depth: EXTRUSION_PROFILE_DEPTH,
        type: "box",
      },
      color: "silver",
      group: EnclosureV2Groups.Doors,
      material: EnclosureV2Materials.AluminiumSingle,
      assemble: (obj) => {
        obj.position.set(
          width / 2 - EXTRUSION_PROFILE_WIDTH / 2,
          height / 2,
          0,
        );
      },
    };
    framePieces.push(rightVertical);

    const topHorizontal: Piece = {
      name: `${name} Top Horizontal`,
      geometry: {
        height: width - EXTRUSION_PROFILE_WIDTH * 2,
        width: EXTRUSION_PROFILE_WIDTH,
        depth: EXTRUSION_PROFILE_DEPTH,
        type: "box",
      },
      color: "silver",
      group: EnclosureV2Groups.Doors,
      material: EnclosureV2Materials.AluminiumSingle,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.position.set(0, height - EXTRUSION_PROFILE_WIDTH / 2, 0);
      },
    };
    framePieces.push(topHorizontal);

    const bottomHorizontal: Piece = {
      name: `${name} Bottom Horizontal`,
      geometry: {
        height: width - EXTRUSION_PROFILE_WIDTH * 2,
        width: EXTRUSION_PROFILE_WIDTH,
        depth: EXTRUSION_PROFILE_DEPTH,
        type: "box",
      },
      color: "silver",
      group: EnclosureV2Groups.Doors,
      material: EnclosureV2Materials.AluminiumSingle,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.position.set(0, EXTRUSION_PROFILE_WIDTH / 2, 0);
      },
    };
    framePieces.push(bottomHorizontal);

    const panel: Piece = {
      name: `${name} Panel`,
      geometry: {
        height: height - EXTRUSION_PROFILE_WIDTH * 2,
        width: width - EXTRUSION_PROFILE_WIDTH * 2,
        depth: panelDepth,
        type: "box",
      },
      color: panelColor,
      group: EnclosureV2Groups.Doors,
      material: "panel",
      assemble: (obj) => {
        obj.position.set(0, height / 2, 0);
      },
    };
    framePieces.push(panel);

    const door: CompoundPiece = {
      name,
      material: "door",
      group: EnclosureV2Groups.Doors,
      pieces: framePieces,
      hingePosition,
      assemble,
    };

    this.makeCompoundPiece(door);
  }
}

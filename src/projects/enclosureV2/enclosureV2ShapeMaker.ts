import {
  AbstractShapeMaker,
  CompoundPiece,
  Piece,
} from "../../lib/AbstractShapeMaker";
import {
  EnclosureV2Groups,
  EnclosureV2Materials,
  EXTRUSION_PROFILE_DEPTH,
  EXTRUSION_PROFILE_WIDTH,
  DOOR_PANEL_SLOT_DEPTH,
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
    return this.makeShape({
      geometry: {
        type: "extrusion",
        profileType: "3030",
        length: height,
      },
      color,
      name,
      group,
      material: EnclosureV2Materials.AluminiumSingle,
      assemble,
    });
  }
  makeSingleExtrusionBox({
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
    return this.makeShape({
      geometry: {
        type: "box",
        height,
        width: EXTRUSION_PROFILE_WIDTH,
        depth: EXTRUSION_PROFILE_DEPTH,
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
    return this.makeShape({
      geometry: {
        type: "extrusion",
        profileType: "3060",
        length: height,
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
    panelDepth = 0.4,
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
        length: height,
        profileType: "3030",
        type: "extrusion",
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
        length: height,
        profileType: "3030",
        type: "extrusion",
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
        length: width - EXTRUSION_PROFILE_WIDTH * 2,
        profileType: "3030",
        type: "extrusion",
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
        length: width - EXTRUSION_PROFILE_WIDTH * 2,
        profileType: "3030",
        type: "extrusion",
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
        height:
          height - EXTRUSION_PROFILE_WIDTH * 2 + DOOR_PANEL_SLOT_DEPTH * 2,
        width: width - EXTRUSION_PROFILE_WIDTH * 2 + DOOR_PANEL_SLOT_DEPTH * 2,
        depth: panelDepth,
        type: "box",
      },
      color: panelColor,
      opacity: 0.2,
      group: EnclosureV2Groups.Doors,
      material: "compact polycarbonate",
      assemble: (obj) => {
        obj.position.set(
          0 + DOOR_PANEL_SLOT_DEPTH / 2,
          height / 2 - DOOR_PANEL_SLOT_DEPTH,
          EXTRUSION_PROFILE_DEPTH / 2 - panelDepth / 2,
        );
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

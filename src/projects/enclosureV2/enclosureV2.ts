import * as THREE from "three";
import { EnclosureV2ShapeMaker } from "./enclosureV2ShapeMaker";
import { renderObject3D } from "../../lib/render";
import type { MyObject3D } from "../../lib/MyObject3D";
import {
  BACK_Z,
  BIG_EXTRUSION_DEPTH,
  BIG_EXTRUSION_WIDTH,
  ENCLOSURE_INNER_DEPTH,
  ENCLOSURE_INNER_HEIGHT,
  ENCLOSURE_INNER_WIDTH,
  EnclosureV2Groups,
  EnclosureV2Materials,
  EXTRUSION_PROFILE_DEPTH,
  FRONT_BACK_MIDDLE_JOINT_HEIGHT,
  FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
  RIGHT_SIDE_X,
  SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
  VERTICAL_BIG_EXTRUSION_HEIGHT,
} from "./consts";

function makeHorizontal(obj: THREE.Object3D) {
  obj.rotation.x = THREE.MathUtils.degToRad(90);
}

function makeVertical(obj: THREE.Object3D) {
  obj.rotation.y = THREE.MathUtils.degToRad(90);
}

export class EnclosureV2 implements MyObject3D {
  sm: EnclosureV2ShapeMaker;
  hiddenGroups: string[] = ["internal"];
  hiddenGroupsInSpecs: string[] = ["internal"];

  constructor() {
    this.sm = new EnclosureV2ShapeMaker();

    // Create aluminium extrusion pieces
    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Left Side Bottom front extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          EXTRUSION_PROFILE_DEPTH / 2,
          EXTRUSION_PROFILE_DEPTH,
          0 - SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });
    this.sm.makeDoubleExtrusion({
      height: VERTICAL_BIG_EXTRUSION_HEIGHT,
      name: "Left Side Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          0,
          VERTICAL_BIG_EXTRUSION_HEIGHT / 2,
          0 -
            SIDE_HORIZONTAL_EXTRUSION_HEIGHT -
            BIG_EXTRUSION_DEPTH -
            EXTRUSION_PROFILE_DEPTH,
        );
      },
    });
    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Left Side Bottom back extrusion",
      group: EnclosureV2Groups.Structure,
      color: "red",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          EXTRUSION_PROFILE_DEPTH / 2,
          EXTRUSION_PROFILE_DEPTH,
          0 -
            SIDE_HORIZONTAL_EXTRUSION_HEIGHT * 1.5 -
            BIG_EXTRUSION_WIDTH -
            EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Left Side Top front extrusion",
      group: EnclosureV2Groups.Structure,
      color: "green",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          EXTRUSION_PROFILE_DEPTH / 2,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH,
          0 - SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Left Side Top back extrusion",
      group: EnclosureV2Groups.Structure,
      color: "yellow",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          EXTRUSION_PROFILE_DEPTH / 2,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH,
          0 -
            SIDE_HORIZONTAL_EXTRUSION_HEIGHT * 1.5 -
            BIG_EXTRUSION_WIDTH -
            EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    // Right side
    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Right Side Bottom front extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          EXTRUSION_PROFILE_DEPTH,
          0 - SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });
    this.sm.makeDoubleExtrusion({
      height: VERTICAL_BIG_EXTRUSION_HEIGHT,
      name: "Right Side Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          RIGHT_SIDE_X - EXTRUSION_PROFILE_DEPTH / 2,
          VERTICAL_BIG_EXTRUSION_HEIGHT / 2,
          0 -
            SIDE_HORIZONTAL_EXTRUSION_HEIGHT -
            BIG_EXTRUSION_DEPTH -
            EXTRUSION_PROFILE_DEPTH,
        );
      },
    });
    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Right Side Bottom back extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          EXTRUSION_PROFILE_DEPTH,
          0 -
            SIDE_HORIZONTAL_EXTRUSION_HEIGHT * 1.5 -
            BIG_EXTRUSION_WIDTH -
            EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Right Side Top front extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH,
          0 - SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Right Side Top back extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH,
          0 -
            SIDE_HORIZONTAL_EXTRUSION_HEIGHT * 1.5 -
            BIG_EXTRUSION_WIDTH -
            EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    // Front
    this.sm.makeSingleExtrusion({
      height: VERTICAL_BIG_EXTRUSION_HEIGHT,
      name: "Front Left Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          0,
          VERTICAL_BIG_EXTRUSION_HEIGHT / 2,
          0 - EXTRUSION_PROFILE_DEPTH / 2,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: VERTICAL_BIG_EXTRUSION_HEIGHT,
      name: "Front Right Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          VERTICAL_BIG_EXTRUSION_HEIGHT / 2,
          0 - EXTRUSION_PROFILE_DEPTH / 2,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Front Left Bottom Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "blue",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          EXTRUSION_PROFILE_DEPTH / 2,
          0 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: FRONT_BACK_MIDDLE_JOINT_HEIGHT,
      name: "Front Middle Bottom Joint",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        obj.rotation.x = Math.PI / 2;
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT + BIG_EXTRUSION_WIDTH,
          EXTRUSION_PROFILE_DEPTH,
          0 - FRONT_BACK_MIDDLE_JOINT_HEIGHT / 2,
        );
      },
      color: "purple",
    });
    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Front Right Bottom Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "orange",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT +
            BIG_EXTRUSION_WIDTH +
            EXTRUSION_PROFILE_DEPTH +
            FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          EXTRUSION_PROFILE_DEPTH / 2,
          0 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Front Left Top Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "cyan",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH / 2,
          0 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: FRONT_BACK_MIDDLE_JOINT_HEIGHT,
      name: "Front Middle Top Joint",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        obj.rotation.x = Math.PI / 2;
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT + BIG_EXTRUSION_WIDTH,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH,
          0 - FRONT_BACK_MIDDLE_JOINT_HEIGHT / 2,
        );
      },
      color: "green",
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Front Right Top Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "magenta",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT +
            BIG_EXTRUSION_WIDTH +
            EXTRUSION_PROFILE_DEPTH +
            FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH / 2,
          0 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    // Back
    this.sm.makeSingleExtrusion({
      height: VERTICAL_BIG_EXTRUSION_HEIGHT,
      name: "Back Left Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(0, VERTICAL_BIG_EXTRUSION_HEIGHT / 2, BACK_Z);
      },
    });

    this.sm.makeSingleExtrusion({
      height: VERTICAL_BIG_EXTRUSION_HEIGHT,
      name: "Back Right Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          VERTICAL_BIG_EXTRUSION_HEIGHT / 2,
          BACK_Z,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Back Left Top Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "brown",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH / 2,
          BACK_Z - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: FRONT_BACK_MIDDLE_JOINT_HEIGHT,
      name: "Back Middle Top Joint",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        obj.rotation.x = Math.PI / 2;
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT + BIG_EXTRUSION_WIDTH,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH,
          BACK_Z - FRONT_BACK_MIDDLE_JOINT_HEIGHT / 2,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Back Right Top Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "brown",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT +
            BIG_EXTRUSION_WIDTH +
            EXTRUSION_PROFILE_DEPTH +
            FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH / 2,
          BACK_Z - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    // Back horizontal bottom extrusions
    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Back Left Bottom Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "gray",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          EXTRUSION_PROFILE_DEPTH / 2,
          BACK_Z - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: FRONT_BACK_MIDDLE_JOINT_HEIGHT,
      name: "Back Middle Bottom Joint",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        obj.rotation.x = Math.PI / 2;
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT + BIG_EXTRUSION_WIDTH,
          EXTRUSION_PROFILE_DEPTH,
          BACK_Z - FRONT_BACK_MIDDLE_JOINT_HEIGHT / 2,
        );
      },
      color: "purple",
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Back Right Bottom Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "gray",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT +
            BIG_EXTRUSION_WIDTH +
            EXTRUSION_PROFILE_DEPTH +
            FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          EXTRUSION_PROFILE_DEPTH / 2,
          BACK_Z - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    // Calculate and log total heights of pieces for each material

    const pieces = this.sm.objectsByGroup[EnclosureV2Groups.Structure];
    const singlePieces = pieces.filter(
      (p) => p.material === EnclosureV2Materials.AluminiumSingle,
    );
    const doublePieces = pieces.filter(
      (p) => p.material === EnclosureV2Materials.AluminiumDouble,
    );
    const singlePieceTotalHeight = singlePieces.reduce(
      (sum, p) => sum + p.geometry.height,
      0,
    );
    const doublePieceTotalHeight = doublePieces.reduce(
      (sum, p) => sum + p.geometry.height,
      0,
    );
    console.log("Single pieces total height:", singlePieceTotalHeight);
    const numberOfSinglePiecesHeightBelow40 = singlePieces.filter(
      (p) => p.geometry.height < 40,
    ).length;
    const numberOfSinglePiecesHeightBetween40And50 = singlePieces.filter(
      (p) => p.geometry.height >= 40 && p.geometry.height < 50,
    ).length;
    const numberOfSinglePiecesHeightBetween50And60 = singlePieces.filter(
      (p) => p.geometry.height >= 50 && p.geometry.height < 60,
    ).length;
    const numberOfSinglePiecesHeightBetween60And70 = singlePieces.filter(
      (p) => p.geometry.height >= 60 && p.geometry.height < 70,
    ).length;
    const numberOfSinglePiecesHeightBetween70And80 = singlePieces.filter(
      (p) => p.geometry.height >= 70 && p.geometry.height < 80,
    ).length;
    const numberOfSinglePiecesHeightBetween80And90 = singlePieces.filter(
      (p) => p.geometry.height >= 80 && p.geometry.height < 90,
    ).length;
    const numberOfSinglePiecesHeightBetween90And100 = singlePieces.filter(
      (p) => p.geometry.height >= 90 && p.geometry.height < 100,
    ).length;
    const numberOfSinglePiecesHeightBetween100And110 = singlePieces.filter(
      (p) => p.geometry.height >= 100 && p.geometry.height < 110,
    ).length;
    const numberOfSinglePiecesHeightBetween110And120 = singlePieces.filter(
      (p) => p.geometry.height >= 110 && p.geometry.height < 120,
    ).length;
    const numberOfSinglePiecesHeightBetween120And130 = singlePieces.filter(
      (p) => p.geometry.height >= 120 && p.geometry.height < 130,
    ).length;
    const numberOfSinglePiecesHeightBetween130And140 = singlePieces.filter(
      (p) => p.geometry.height >= 130 && p.geometry.height < 140,
    ).length;
    const numberOfSinglePiecesHeightBetween140And150 = singlePieces.filter(
      (p) => p.geometry.height >= 140 && p.geometry.height < 150,
    ).length;

    console.log({
      numberOfSinglePiecesHeightBelow40,
      numberOfSinglePiecesHeightBetween40And50,
      numberOfSinglePiecesHeightBetween50And60,
      numberOfSinglePiecesHeightBetween60And70,
      numberOfSinglePiecesHeightBetween70And80,
      numberOfSinglePiecesHeightBetween80And90,
      numberOfSinglePiecesHeightBetween90And100,
      numberOfSinglePiecesHeightBetween100And110,
      numberOfSinglePiecesHeightBetween110And120,
      numberOfSinglePiecesHeightBetween120And130,
      numberOfSinglePiecesHeightBetween130And140,
      numberOfSinglePiecesHeightBetween140And150,
    });

    // same for double pieces height distribution
    const numberOfDoublePiecesHeightBelow40 = doublePieces.filter(
      (p) => p.geometry.height < 40,
    ).length;
    const numberOfDoublePiecesHeightBetween40And50 = doublePieces.filter(
      (p) => p.geometry.height >= 40 && p.geometry.height < 50,
    ).length;
    const numberOfDoublePiecesHeightBetween50And60 = doublePieces.filter(
      (p) => p.geometry.height >= 50 && p.geometry.height < 60,
    ).length;
    const numberOfDoublePiecesHeightBetween60And70 = doublePieces.filter(
      (p) => p.geometry.height >= 60 && p.geometry.height < 70,
    ).length;
    const numberOfDoublePiecesHeightBetween70And80 = doublePieces.filter(
      (p) => p.geometry.height >= 70 && p.geometry.height < 80,
    ).length;
    const numberOfDoublePiecesHeightBetween80And90 = doublePieces.filter(
      (p) => p.geometry.height >= 80 && p.geometry.height < 90,
    ).length;
    const numberOfDoublePiecesHeightBetween90And100 = doublePieces.filter(
      (p) => p.geometry.height >= 90 && p.geometry.height < 100,
    ).length;
    const numberOfDoublePiecesHeightBetween100And110 = doublePieces.filter(
      (p) => p.geometry.height >= 100 && p.geometry.height < 110,
    ).length;
    const numberOfDoublePiecesHeightBetween110And120 = doublePieces.filter(
      (p) => p.geometry.height >= 110 && p.geometry.height < 120,
    ).length;
    const numberOfDoublePiecesHeightBetween120And130 = doublePieces.filter(
      (p) => p.geometry.height >= 120 && p.geometry.height < 130,
    ).length;
    const numberOfDoublePiecesHeightBetween130And140 = doublePieces.filter(
      (p) => p.geometry.height >= 130 && p.geometry.height < 140,
    ).length;
    const numberOfDoublePiecesHeightBetween140And150 = doublePieces.filter(
      (p) => p.geometry.height >= 140 && p.geometry.height < 150,
    ).length;

    console.log({
      numberOfDoublePiecesHeightBelow40,
      numberOfDoublePiecesHeightBetween40And50,
      numberOfDoublePiecesHeightBetween50And60,
      numberOfDoublePiecesHeightBetween60And70,
      numberOfDoublePiecesHeightBetween70And80,
      numberOfDoublePiecesHeightBetween80And90,
      numberOfDoublePiecesHeightBetween90And100,
      numberOfDoublePiecesHeightBetween100And110,
      numberOfDoublePiecesHeightBetween110And120,
      numberOfDoublePiecesHeightBetween120And130,
      numberOfDoublePiecesHeightBetween130And140,
      numberOfDoublePiecesHeightBetween140And150,
    });

    const singlePrice =
      numberOfSinglePiecesHeightBetween70And80 * 4.77 +
      numberOfSinglePiecesHeightBetween80And90 * 5.3 +
      numberOfDoublePiecesHeightBetween70And80 * 8.91 +
      numberOfDoublePiecesHeightBelow40 * 4.81;

    console.error("singlePrice", singlePrice);

    const price3030 =
      numberOfSinglePiecesHeightBetween70And80 * 7.59 * 1.23 +
      numberOfSinglePiecesHeightBetween80And90 * 8.54 * 1.23 +
      numberOfDoublePiecesHeightBetween70And80 * 13.43 * 1.23 +
      numberOfDoublePiecesHeightBelow40 * 3.86 * 1.23;

    console.error("price3030", price3030);

    console.log("Double pieces total height:", doublePieceTotalHeight);
  }
}

// Render the project
renderObject3D(EnclosureV2);

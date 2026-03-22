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
import { calculatePrices } from "./calculatePrices";

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
      color: "red",
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
          RIGHT_SIDE_X - EXTRUSION_PROFILE_DEPTH / 2,
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
          RIGHT_SIDE_X - EXTRUSION_PROFILE_DEPTH / 2,
          VERTICAL_BIG_EXTRUSION_HEIGHT / 2,
          BACK_Z,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Back Left Top Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      color: "yellow",
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          ENCLOSURE_INNER_HEIGHT + EXTRUSION_PROFILE_DEPTH / 2,
          BACK_Z - EXTRUSION_PROFILE_DEPTH / 2,
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
          BACK_Z - EXTRUSION_PROFILE_DEPTH / 2,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: VERTICAL_BIG_EXTRUSION_HEIGHT,
      name: "Back Middle Top Joint",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT + BIG_EXTRUSION_WIDTH,
          VERTICAL_BIG_EXTRUSION_HEIGHT / 2,
          BACK_Z - EXTRUSION_PROFILE_DEPTH / 2,
        );
      },
      color: "brown",
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
          BACK_Z - EXTRUSION_PROFILE_DEPTH / 2,
        );
      },
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
          BACK_Z - EXTRUSION_PROFILE_DEPTH / 2,
        );
      },
    });

    // Calculate and log total heights of pieces for each material
    calculatePrices(this.sm.objectsByGroup[EnclosureV2Groups.Structure]);
  }
}

// Render the project
renderObject3D(EnclosureV2);

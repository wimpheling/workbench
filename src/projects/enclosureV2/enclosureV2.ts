import * as THREE from "three";
import { EnclosureV2ShapeMaker } from "./enclosureV2ShapeMaker";
import { renderObject3D } from "../../lib/render";
import type { MyObject3D } from "../../lib/MyObject3D";
import {
  BACK_Z,
  BIG_EXTRUSION_DEPTH,
  ENCLOSURE_INNER_HEIGHT,
  ENCLOSURE_INNER_WIDTH,
  EnclosureV2Groups,
  EXTRUSION_PROFILE_DEPTH,
  FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
  RIGHT_SIDE_X,
  SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
  VERTICAL_FRONT_BIG_EXTRUSION_HEIGHT,
  VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT,
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
  hiddenGroups: string[] = [];
  hiddenGroupsInSpecs: string[] = ["internal"];

  constructor() {
    this.sm = new EnclosureV2ShapeMaker();

    // Create aluminium extrusion pieces
    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Left Side Bottom extrusion",
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
      height: VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT,
      name: "Left Side Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          0,
          VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          0 -
            SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 -
            BIG_EXTRUSION_DEPTH / 2 -
            EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Left Side Top extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          EXTRUSION_PROFILE_DEPTH / 2,
          EXTRUSION_PROFILE_DEPTH * 2 + VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT,
          0 - SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 - EXTRUSION_PROFILE_DEPTH,
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
      height: VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT,
      name: "Right Side Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          0 -
            SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 -
            BIG_EXTRUSION_DEPTH / 2 -
            EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Right Side Top extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          EXTRUSION_PROFILE_DEPTH * 2 + VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT,
          0 - SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    // Front
    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Front Bottom Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          EXTRUSION_PROFILE_DEPTH / 2,
          0 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Front Top Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          EXTRUSION_PROFILE_DEPTH * 2 + VERTICAL_FRONT_BIG_EXTRUSION_HEIGHT,
          0 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: VERTICAL_FRONT_BIG_EXTRUSION_HEIGHT,
      name: "Front Left Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.rotateY(THREE.MathUtils.degToRad(90));
        obj.position.set(
          EXTRUSION_PROFILE_DEPTH,
          VERTICAL_FRONT_BIG_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          0,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: VERTICAL_FRONT_BIG_EXTRUSION_HEIGHT,
      name: "Front Right Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.rotateY(THREE.MathUtils.degToRad(90));
        obj.position.set(
          RIGHT_SIDE_X - EXTRUSION_PROFILE_DEPTH / 2,
          VERTICAL_FRONT_BIG_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          0,
        );
      },
    });

    // Back
    this.sm.makeSingleExtrusion({
      height: VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT,
      name: "Back Left Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          0,
          VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          BACK_Z,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT,
      name: "Back Right Vertical extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.position.set(
          RIGHT_SIDE_X,
          VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          BACK_Z,
        );
      },
    });

    this.sm.makeDoubleExtrusion({
      height: VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT,
      name: "Back Middle Joint",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeVertical(obj);
        obj.rotateY(THREE.MathUtils.degToRad(90));
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          VERTICAL_SIDE_BIG_EXTRUSION_HEIGHT / 2 + EXTRUSION_PROFILE_DEPTH,
          BACK_Z,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Back Bottom Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          EXTRUSION_PROFILE_DEPTH / 2,
          BACK_Z - EXTRUSION_PROFILE_DEPTH / 2,
        );
      },
    });

    this.sm.makeSingleExtrusion({
      height: FRONT_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Back Top Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.rotation.set(0, 0, Math.PI / 2);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          ENCLOSURE_INNER_HEIGHT - EXTRUSION_PROFILE_DEPTH / 2,
          BACK_Z - EXTRUSION_PROFILE_DEPTH / 2,
        );
      },
    });

    // top-back tie for extra stability
    this.sm.makeSingleExtrusion({
      height: SIDE_HORIZONTAL_EXTRUSION_HEIGHT,
      name: "Back Top Horizontal extrusion",
      group: EnclosureV2Groups.Structure,
      assemble: (obj) => {
        makeHorizontal(obj);
        obj.position.set(
          FRONT_HORIZONTAL_EXTRUSION_HEIGHT / 2,
          ENCLOSURE_INNER_HEIGHT - EXTRUSION_PROFILE_DEPTH / 2,
          0 - SIDE_HORIZONTAL_EXTRUSION_HEIGHT / 2 - EXTRUSION_PROFILE_DEPTH,
        );
      },
    });

    // Doors
    // left door
    this.sm.makeDoor({
      width: ENCLOSURE_INNER_WIDTH / 2 - EXTRUSION_PROFILE_DEPTH,
      height: VERTICAL_FRONT_BIG_EXTRUSION_HEIGHT,
      name: "Front Door Left",
      hingePosition: "left",
      panelColor: "yellow",
      assemble: (obj) => {
        obj.rotation.y = Math.PI; // Rotate 180° so panel faces outward
        obj.position.set(
          0 + EXTRUSION_PROFILE_DEPTH * 3, // Left of Front Left Vertical (3 - 25)
          EXTRUSION_PROFILE_DEPTH,
          0, // At front of frame
        );
      },
    });

    // right door
    this.sm.makeDoor({
      width: ENCLOSURE_INNER_WIDTH / 2,
      height: VERTICAL_FRONT_BIG_EXTRUSION_HEIGHT,
      name: "Front Door",
      hingePosition: "right",
      panelColor: "yellow",
      assemble: (obj) => {
        obj.position.set(
          ENCLOSURE_INNER_WIDTH / 2 + EXTRUSION_PROFILE_DEPTH * 2, // Right of Front Right Vertical (25 - 47.5)
          EXTRUSION_PROFILE_DEPTH,
          0, // At front of frame
        );
      },
    });

    // Calculate and log total heights of pieces for each material
    calculatePrices(this.sm.objectsByGroup[EnclosureV2Groups.Structure]);
  }
}

// Render the project
renderObject3D(EnclosureV2);

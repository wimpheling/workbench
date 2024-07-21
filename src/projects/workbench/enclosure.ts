import * as THREE from "three";
import { AbstractShapeMaker } from "../../lib/AbstractShapeMaker";
import {
  ENCLOSURE_HEIGHT,
  TABLE_DEPTH,
  TABLE_TOP_Y,
  TABLE_WIDTH,
} from "./consts";

const ENCLOSURE_STRUCTURE_WIDTH = 20;
const ENCLOSURE_STRUCTURE_DEPTH = 1;

export class Enclosure {
  sm = new AbstractShapeMaker();

  createStructure(props: {
    height: number;
    name: string;
    group: string;
    assemble: (obj: THREE.Object3D) => void;
  }) {
    this.sm.makeShape({
      ...props,
      width: ENCLOSURE_STRUCTURE_WIDTH,
      depth: ENCLOSURE_STRUCTURE_DEPTH,
      material: "Madeira",
      color: "blue",
      opacity: 0.5,
    });
  }

  createPanel(props: {
    height: number;
    width: number;
    name: string;
    group: string;
    assemble: (obj: THREE.Object3D) => void;
  }) {
    this.sm.makeShape({
      ...props,
      depth: ENCLOSURE_STRUCTURE_DEPTH,
      material: "Madeira",
      color: "yellow",
      opacity: 0.6,
    });
  }
  constructor() {
    this.createStructure({
      height: ENCLOSURE_HEIGHT,
      name: "Middle Vertical Structure - Left Side",
      group: "Enclosure Structure",
      assemble: (obj) => {
        obj.rotation.y = THREE.MathUtils.degToRad(90);
        obj.position.x =
          0 +
          ENCLOSURE_STRUCTURE_DEPTH / 2 +
          ENCLOSURE_STRUCTURE_DEPTH -
          TABLE_WIDTH / 2;
        obj.position.y = TABLE_TOP_Y + ENCLOSURE_HEIGHT / 2;
        obj.position.z = 0;
      },
    });

    this.createStructure({
      height: ENCLOSURE_HEIGHT,
      name: "Left Vertical Structure - Left Side",
      group: "Enclosure Structure",
      assemble: (obj) => {
        obj.rotation.y = THREE.MathUtils.degToRad(90);
        obj.position.x =
          0 +
          ENCLOSURE_STRUCTURE_DEPTH / 2 +
          ENCLOSURE_STRUCTURE_DEPTH -
          TABLE_WIDTH / 2;
        obj.position.y = TABLE_TOP_Y + ENCLOSURE_HEIGHT / 2;
        obj.position.z = 0 - TABLE_DEPTH / 2 + ENCLOSURE_STRUCTURE_WIDTH / 2;
      },
    });

    const panelMargin = ENCLOSURE_STRUCTURE_WIDTH / 4;
    const lateralPanelWidth = TABLE_DEPTH / 2 - ENCLOSURE_STRUCTURE_WIDTH / 2;
    const lateralPanelHeight = ENCLOSURE_HEIGHT - panelMargin * 2;

    this.createStructure({
      height: ENCLOSURE_HEIGHT,
      name: "Right Vertical Structure - Left Side",
      group: "Enclosure Structure",
      assemble: (obj) => {
        obj.rotation.y = THREE.MathUtils.degToRad(90);
        obj.position.x =
          0 +
          ENCLOSURE_STRUCTURE_DEPTH / 2 -
          TABLE_WIDTH / 2 +
          ENCLOSURE_STRUCTURE_DEPTH;
        obj.position.y = TABLE_TOP_Y + ENCLOSURE_HEIGHT / 2;
        obj.position.z = TABLE_DEPTH / 2 - ENCLOSURE_STRUCTURE_WIDTH / 2;
      },
    });

    this.createPanel({
      height: lateralPanelHeight,
      width: lateralPanelWidth,
      name: "Left Panel - Left Side",
      group: "Enclosure Structure",
      assemble: (obj) => {
        obj.rotation.y = THREE.MathUtils.degToRad(90);
        obj.position.x = 0 + ENCLOSURE_STRUCTURE_DEPTH / 2 - TABLE_WIDTH / 2;
        obj.position.y = TABLE_TOP_Y + ENCLOSURE_HEIGHT / 2;
        obj.position.z = TABLE_DEPTH / 2 - lateralPanelWidth / 2 - panelMargin;
      },
    });
  }
}

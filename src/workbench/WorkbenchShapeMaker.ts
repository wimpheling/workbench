import { AbstractShapeMaker } from "../lib/AbstractShapeMaker";
import {
  ENCLOSURE_VIGA_THICKNESS,
  ENCLOSURE_VIGA_WIDTH,
  ENCLOSURE_WALL_THICKNESS,
  FOOT_DEPTH,
  FOOT_HEIGHT,
  FOOT_WIDTH,
  VIGA_HEIGHT,
  VIGA_WIDTH,
} from "./consts";

export class WorkBenchShapeMaker extends AbstractShapeMaker {
  foot({
    color,
    dimensions,
    name,
    assemble,
  }: {
    color?: string;
    dimensions?: boolean;
    name: string;
    assemble: (obj: THREE.Object3D) => void;
  }) {
    return this.makeShape({
      height: FOOT_HEIGHT,
      width: FOOT_WIDTH,
      depth: FOOT_DEPTH,
      color,
      dimensions,
      name,
      group: "legs",
      material: "wood",
      assemble,
    });
  }

  viga({
    height,
    color,
    dimensions,
    name,
    assemble,
    group,
  }: {
    height: number;
    color?: string;
    dimensions?: boolean;
    name: string;
    group: string;
    assemble: (obj: THREE.Object3D) => void;
  }) {
    return this.makeShape({
      height,
      width: VIGA_WIDTH,
      depth: VIGA_HEIGHT,
      color,
      dimensions,
      name,
      material: "wood",
      assemble,
      group,
    });
  }

  enclosureViga({
    height,
    color,
    dimensions,
    name,
    assemble,
  }: {
    height: number;
    color?: string;
    dimensions?: boolean;
    name: string;
    assemble: (obj: THREE.Object3D) => void;
  }) {
    return this.makeShape({
      height,
      width: ENCLOSURE_VIGA_WIDTH,
      depth: ENCLOSURE_VIGA_THICKNESS,
      color,
      dimensions,
      name,
      group: "enclosure",
      material: "wood",
      assemble,
    });
  }

  enclosureWall({
    height,
    width,
    color = "black",
    dimensions,
    opacity = 0.4,
    name,
    assemble,
    group,
  }: {
    height: number;
    width: number;
    color?: string;
    dimensions?: boolean;
    opacity?: number;
    name: string;
    assemble: (obj: THREE.Object3D) => void;
    group: string;
  }) {
    return this.makeShape({
      height,
      width,
      depth: ENCLOSURE_WALL_THICKNESS,
      color,
      dimensions,
      opacity,
      name,
      group,
      material: "wood",
      assemble,
    });
  }
}

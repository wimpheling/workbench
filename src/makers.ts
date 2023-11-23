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
import { ShapeMaker } from "./shapeMaker";

export class ShapeMakerSpecific extends ShapeMaker {
  foot({
    color,
    dimensions,
    name,
  }: {
    color?: string;
    dimensions?: boolean;
    name?: string;
  }) {
    return this.makeShape({
      height: FOOT_HEIGHT,
      width: FOOT_WIDTH,
      depth: FOOT_DEPTH,
      color,
      dimensions,
      name,
    });
  }

  viga({
    height,
    color,
    dimensions,
    name,
  }: {
    height: number;
    color?: string;
    dimensions?: boolean;
    name?: string;
  }) {
    return this.makeShape({
      height,
      width: VIGA_WIDTH,
      depth: VIGA_HEIGHT,
      color,
      dimensions,
      name,
    });
  }

  enclosureViga({
    height,
    color,
    dimensions,
    name,
  }: {
    height: number;
    color?: string;
    dimensions?: boolean;
    name?: string;
  }) {
    return this.makeShape({
      height,
      width: ENCLOSURE_VIGA_WIDTH,
      depth: ENCLOSURE_VIGA_THICKNESS,
      color,
      dimensions,
      name,
    });
  }

  enclosureWall({
    height,
    width,
    color = "black",
    dimensions,
    opacity = 0.4,
    name,
  }: {
    height: number;
    width: number;
    color?: string;
    dimensions?: boolean;
    opacity?: number;
    name?: string;
  }) {
    return this.makeShape({
      height,
      width,
      depth: ENCLOSURE_WALL_THICKNESS,
      color,
      dimensions,
      opacity,
      name,
    });
  }
}

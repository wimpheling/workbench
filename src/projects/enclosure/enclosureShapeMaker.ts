import { AbstractShapeMaker } from "../../lib/AbstractShapeMaker";
import { ENCLOSURE_VIGA_WIDTH } from "../workbench/consts";
import { Materials } from "./enclosureConst";

export class EnclosureShapeMaker extends AbstractShapeMaker {
  viga({
    height,
    depth,
    color,
    dimensions,
    name,
    assemble,
    group,
  }: {
    height: number;
    depth: number;
    color?: string;
    dimensions?: boolean;
    name: string;
    assemble: (obj: THREE.Object3D) => void;
    group: string;
  }) {
    return this.makeShape({
      geometry: {
        height,
        width: ENCLOSURE_VIGA_WIDTH,
        depth,
        type: "box",
      },
      color,
      dimensions,
      name,
      group,
      assemble,
      material: Materials.Wood,
    });
  }
}

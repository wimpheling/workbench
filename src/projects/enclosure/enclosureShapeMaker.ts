import { AbstractShapeMaker, PostProcessHandler, Sides } from "../../lib/AbstractShapeMaker";
import { ENCLOSURE_VIGA_THICKNESS, Materials } from "./enclosureConst";

export class EnclosureShapeMaker extends AbstractShapeMaker {
  viga({
    height,
    width,
    color,
    dimensions,
    name,
    assemble,
    group,
    sides,
    postProcess
  }: {
    height: number;
    width: number;
    color?: string;
    dimensions?: boolean;
    name: string;
    assemble: (obj: THREE.Object3D) => void;
    group: string;
    sides?: Sides;
    postProcess?: PostProcessHandler
  }) {
    return this.makeShape({
      geometry: {
        height,
        width,
        depth: ENCLOSURE_VIGA_THICKNESS,
        type: "box",
        sides,
        postProcess
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

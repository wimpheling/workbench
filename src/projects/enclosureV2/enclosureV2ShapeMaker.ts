import { AbstractShapeMaker } from "../../lib/AbstractShapeMaker";
import {
  BIG_EXTRUSION_DEPTH,
  BIG_EXTRUSION_WIDTH,
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
}

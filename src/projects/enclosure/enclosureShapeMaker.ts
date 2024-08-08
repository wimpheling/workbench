import { AbstractShapeMaker, Sides } from "../../lib/AbstractShapeMaker";
import { getGeometry } from "../../lib/pieceHelpers";
import { Materials } from "./enclosureConst";

export type AssembleCallback = (obj: THREE.Object3D) => void;
export class EnclosureShapeMaker extends AbstractShapeMaker {
  enclosureVigaThickness: number;
  constructor({ enclosureVigaThickness }: { enclosureVigaThickness: number }) {
    super();
    this.enclosureVigaThickness = enclosureVigaThickness;
  }
  viga({
    height,
    width,
    color,
    name,
    assemble,
    group,
    sides,
  }: {
    height: number;
    width: number;
    color?: string;
    name: string;
    assemble: AssembleCallback;
    group: string;
    sides?: Sides;
  }) {
    return this.makeShape({
      getGeometry: () =>
        getGeometry({
          height,
          width,
          depth: this.enclosureVigaThickness,
          type: "box",
          sides,
        }),
      color,
      name,
      group,
      assemble,
      material: Materials.Wood,
    });
  }
}

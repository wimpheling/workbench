import { AbstractShapeMaker } from "../../lib/AbstractShapeMaker";
import { MyObject3D } from "../../lib/MyObject3D";

export class MontessoriLibrary implements MyObject3D {
  sm: AbstractShapeMaker = new AbstractShapeMaker();

  hiddenGroups = [];
  hiddenGroupsInSpecs = [];

  constructor() {
    this.sm.makeShape({
      material: "Wood",
      group: "Side",
      assemble: (obj) => {
        obj.position.set(0, 0, 0);
      },
      height: 10,
      width: 100,
      depth: 100,
      name: "Sideleft",
    });
  }
}

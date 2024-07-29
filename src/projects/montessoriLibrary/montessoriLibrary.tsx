import { AbstractShapeMaker } from "../../lib/AbstractShapeMaker";
import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";

class MontessoriLibrary implements MyObject3D {
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
      geometry: {
        height: 10,
        width: 100,
        depth: 100,
        type: "box",
      },
      name: "Sideleft",
    });
  }
}

renderObject3D(MontessoriLibrary);

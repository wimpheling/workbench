import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { EnclosureShapeMaker } from "./enclosureShapeMaker";

class Enclosure implements MyObject3D {
  sm = new EnclosureShapeMaker();

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

renderObject3D(Enclosure);
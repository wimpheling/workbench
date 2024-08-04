import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { AbstractShapeMaker } from "../../lib/AbstractShapeMaker";

class Enclosure implements MyObject3D {
  sm = new AbstractShapeMaker();

  hiddenGroups = [];
  hiddenGroupsInSpecs = [];

  constructor() {
    this.sm.makeShape({
      group: "Structure ",
      assemble: (obj) => {
        console.log(obj);
      },
      material: "Wood",
      geometry: {
        depth: 10,
        height: 100,
        width: 100,
        type: "box",
        sides: {
          right: {
            joint: {
              jointType: "box",
              jointHeight: 10,
              male: false,
              numberOfJoints: 3,
            },
          },

          left: {
            joint: {
              jointType: "box",
              jointHeight: 10,
              male: false,
              numberOfJoints: 13,
            },
          },
        },
      },
      name: "Test",
    });
  }
}

renderObject3D(Enclosure);

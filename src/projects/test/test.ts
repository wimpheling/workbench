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
          back: {
            joint: {
              // jointType: "box",
              // jointHeight: 10,
              // male: true,
              // numberOfJoints: 2,

              jointType: "halfLap",
              size: 10,
              male: true,
            },
          },

          front: {
            joint: {
              jointType: "halfLap",
              size: 25,
              male: true,
            },
          },

          right: {
            joint: {
              jointType: "halfLap",
              size: 25,
              male: true,
            },
          },

          left: {
            joint: {
              jointType: "halfLap",
              size: 8,
              male: true,
            },
          },
        },
      },
      name: "Test",
    });
  }
}

renderObject3D(Enclosure);

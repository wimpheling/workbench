import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { AbstractShapeMaker } from "../../lib/AbstractShapeMaker";
import { getGeometry } from "../../lib/pieceHelpers";

class Enclosure implements MyObject3D {
  sm = new AbstractShapeMaker();

  hiddenGroups = [];

  constructor() {
    this.sm.makeShape({
      group: "Structure",
      assemble: (obj) => {
        console.log(obj);
      },
      material: "Wood",
      getGeometry: () =>
        getGeometry({
          depth: 10,
          height: 100,
          width: 100,
          type: "box",
          sides: {
            right: {
              joint: {
                jointType: "halfLap",
                male: true,
                size: 10,
                holes: {
                  numberOfHoles: 3,
                  radius: 1,
                },
              },
            },
            left: {
              joint: {
                jointType: "box",
                jointHeight: 10,
                male: true,
                numberOfJoints: 3,
              },
            },
          },
        }),
      name: "Test",
    });
  }
}

renderObject3D(Enclosure);

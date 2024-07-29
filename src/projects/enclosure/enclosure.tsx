import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { Materials } from "./enclosureConst";
import { EnclosureShapeMaker } from "./enclosureShapeMaker";

class Enclosure implements MyObject3D {
  sm = new EnclosureShapeMaker();

  hiddenGroups = [];
  hiddenGroupsInSpecs = [];

  constructor() {
    // this.sm.viga({
    //   group: "Side",
    //   assemble: (obj) => {
    //     obj.position.set(0, 0, 0);
    //   },
    //   height: 10,
    //   depth: 100,
    //   name: "Bottom",
    // });
    this.sm.makeShape({
      material: "Wood",
      group: "Side",
      assemble: (obj) => {
        obj.position.set(0, 0, 0);
      },
      geometry: {
        depth: 10,
        height: 100,
        width: 100,
        type: "box",
        sides: {
          left: {
            joint: {
              jointHeight: 10,
              jointType: "box",
              male: true,
              numberOfJoints: 2,
            },
          },
          front: {
            joint: {
              jointHeight: 10,
              jointType: "box",
              male: true,
              numberOfJoints: 12,
            },
          },
          back: {
            joint: {
              jointHeight: 3,
              jointType: "box",
              male: true,
              numberOfJoints: 22,
            },
          },
          right: {
            joint: {
              jointHeight: 10,
              jointType: "box",
              male: true,
              numberOfJoints: 122,
            },
          },
        },
      },
      name: "Sideleft",
    });
  }
}

renderObject3D(Enclosure);

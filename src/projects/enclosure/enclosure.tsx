import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { EnclosureShapeMaker } from "./enclosureShapeMaker";

type Piece<T extends string> = {
  group: T;
};

enum Groups {
  Side = "Side",
  Top = "Top",
  Bottom = "Bottom",
  Back = "Back",
}

class ListOfPieces<T extends string> {
  pieces: Piece<T>[] = [];
}

const list = new ListOfPieces<Groups>();

list.pieces.push({ group: Groups.Side });
list.pieces.push({ group: Groups.Top });
list.pieces.push({ group: Groups.Bottom });
list.pieces.push({ group: Groups.Back });

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
      material: Materials.Wood,
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

import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { EnclosureShapeMaker } from "./enclosureShapeMaker";
import * as THREE from "three";
import { makeBaseBox } from "replicad";

enum Groups {
  Structure = "Structure",
}

class Enclosure implements MyObject3D {
  sm = new EnclosureShapeMaker();

  hiddenGroups = [];
  hiddenGroupsInSpecs = [];

  constructor() {
    this.sm.viga({
      group: Groups.Structure,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        obj.position.set(100, 0, 0);
      },
      height: 100,
      width: 10,
      name: "Left Bottom Part 1",
      sides: {
        back: {
          joint: {
            jointHeight: 10,
            jointType: "box",
            male: true,
            numberOfJoints: 2,
          },
        },
      },
      postProcess: (obj) => {
        const box = makeBaseBox(5, 5, 3);
        return obj.cut(box);
      },
    });

    this.sm.viga({
      group: Groups.Structure,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        obj.position.set(-5, 0, 0);
      },
      sides: {
        front: {
          joint: {
            jointHeight: 10,
            jointType: "box",
            male: false,
            numberOfJoints: 2,
          },
        },
      },
      height: 89,
      width: 10,
      name: "Left Bottom Part 2",
    });
  }
}

renderObject3D(Enclosure);

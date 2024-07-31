import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { EnclosureShapeMaker } from "./enclosureShapeMaker";
import * as THREE from "three";

class Enclosure implements MyObject3D {
  sm = new EnclosureShapeMaker();

  hiddenGroups = [];
  hiddenGroupsInSpecs = [];

  constructor() {
    this.sm.viga({
      group: "Structure 2",
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
          }
        }
      },
      postProcess: (obj, mat) => {
        const brush = new Brush(obj.geometry, mat);
        brush.updateMatrixWorld();
        const box = new THREE.BoxGeometry(5, 5, 3)
        const hole = new Brush(box, mat);
        hole.updateMatrixWorld();
        
        const evaluator = new Evaluator();
        const result = evaluator.evaluate( brush, hole, SUBTRACTION );
        return result;
      }
    });

    this.sm.viga({
      group: "Structure",
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
          }
        }
      },
      height: 89,
      width: 10,
      name: "Left Bottom Part 2",
    });
  }
}

renderObject3D(Enclosure);

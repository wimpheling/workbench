import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { EnclosureShapeMaker } from "./enclosureShapeMaker";
import * as THREE from "three";
import {
  ENCLOSURE_VIGA_THICKNESS,
  LATERAL_WIDTH_PIECE_1_HEIGHT,
  LATERAL_WIDTH_PIECE_2_HEIGHT,
  STRUCTURE_JOINT_SIZE,
} from "./enclosureConst";
import { boxJoint } from "../../lib/boxJoint";

enum Groups {
  Structure = "Structure",
}

class Enclosure implements MyObject3D {
  sm = new EnclosureShapeMaker();

  hiddenGroups = [];
  hiddenGroupsInSpecs = [];

  constructor() {
    const STRUCTURE_BOX_JOINT_SIZE = 1;
    this.sm.viga({
      group: Groups.Structure,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        obj.position.set(0, 0, 0);
      },
      height: LATERAL_WIDTH_PIECE_2_HEIGHT,
      width: 10,
      name: "Left Bottom Part 2",
      sides: {
        back: {
          joint: {
            size: STRUCTURE_JOINT_SIZE,
            jointType: "halfLap",
            male: true,
            holes: { numberOfHoles: 2, radius: 0.3 },
          },
        },
      },
    });

    this.sm.viga({
      group: Groups.Structure,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI * 1.5);
        obj.position.set(
          0 -
            LATERAL_WIDTH_PIECE_2_HEIGHT / 2 -
            LATERAL_WIDTH_PIECE_1_HEIGHT / 2 +
            STRUCTURE_JOINT_SIZE,
          0 + ENCLOSURE_VIGA_THICKNESS,
          0,
        );
      },
      sides: {
        front: {
          joint: {
            size: STRUCTURE_JOINT_SIZE,
            jointType: "halfLap",
            male: false,
            holes: { numberOfHoles: 2, radius: 0.3 },
          },
        },
      },
      height: LATERAL_WIDTH_PIECE_1_HEIGHT,
      width: 10,
      name: "Left Bottom Part 1",
      postProcess: (obj) => {
        // cut holes for vertical viga
        return boxJoint({
          depth: ENCLOSURE_VIGA_THICKNESS,
          geo: obj,
          jointHeight: STRUCTURE_BOX_JOINT_SIZE,
          male: false,
          height: 1,
          width: 10,
          numberOfJoints: 3,
          orientation: { axis: "horizontal", cutDirection: "up" },
        });
      },
    });
  }
}

renderObject3D(Enclosure);

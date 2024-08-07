import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { EnclosureShapeMaker } from "./enclosureShapeMaker";
import * as THREE from "three";
import { getGeometry } from "../../lib/pieceHelpers";

enum Groups {
  Structure = "Structure",
}

class Enclosure implements MyObject3D {
  hiddenGroups = [];
  hiddenGroupsInSpecs = [];
  sm: EnclosureShapeMaker;

  constructor({
    enclosureWidth,
    enclosureHeight,
    enclosureDepth,
    enclosureVigaThickness,
    enclosureFoamThickness,
    enclosureWallThickness,
    structureBoxJointSize,
    structureHalflapJointSize,
    structureScrewSize,
  }: {
    enclosureWidth: number;
    enclosureHeight: number;
    enclosureDepth: number;
    enclosureVigaThickness: number;
    enclosureFoamThickness: number;
    enclosureWallThickness: number;
    structureBoxJointSize: number;
    structureHalflapJointSize: number;
    structureScrewSize: number;
  }) {
    this.sm = new EnclosureShapeMaker({
      enclosureVigaThickness,
    });

    const lateralWidthPiece1Height =
      (enclosureWidth * 2) / 3 + structureHalflapJointSize;

    const lateralWidthPiece2Height = (enclosureWidth * 1) / 3;
    const structureWidth = enclosureFoamThickness + enclosureVigaThickness * 2;

    const shape1Height = enclosureWidth / 2 + structureBoxJointSize / 2;
    const shape2Height = lateralWidthPiece1Height - shape1Height;

    const part1X = 0 + enclosureWidth / 2 - shape1Height / 2;
    const part2X =
      0 -
      enclosureWidth / 2 +
      shape2Height -
      structureHalflapJointSize +
      structureBoxJointSize / 2;
    const slidingPanelWidth =
      enclosureVigaThickness * 2 + enclosureFoamThickness;

    this.sm.makeShape({
      name: "Left Bottom Part 1",
      group: Groups.Structure,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI * 1.5);
        obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI);
        obj.position.set(part1X, 0, 0);
      },
      material: "Wood",
      getGeometry: () => {
        const shape1 = getGeometry({
          depth: enclosureVigaThickness,
          width: structureWidth,
          height: shape1Height,
          type: "box",
          sides: {
            front: {
              joint: {
                jointHeight: structureBoxJointSize,
                jointType: "box",
                male: false,
                numberOfJoints: 5,
              },
            },
          },
        });

        const shape2 = getGeometry({
          depth: enclosureVigaThickness,
          width: structureWidth,
          height: shape2Height,
          type: "box",
          sides: {
            front: {
              joint: {
                size: structureHalflapJointSize,
                jointType: "halfLap",
                male: false,
                holes: { numberOfHoles: 2, radius: structureScrewSize },
              },
            },
          },
        }).translateY(0 - shape1Height / 2 - shape2Height / 2);

        const shape3 = getGeometry({
          depth: enclosureVigaThickness,
          width: slidingPanelWidth,
          height: shape2Height,
          type: "box",
          sides: {
            front: {
              joint: {
                size: structureHalflapJointSize,
                jointType: "halfLap",
                male: false,
                holes: { numberOfHoles: 2, radius: structureScrewSize },
              },
            },
          },
        });
        return shape1.fuse(shape2);
      },
    });

    this.sm.viga({
      group: Groups.Structure,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI);
        obj.position.set(part2X, enclosureVigaThickness, 0);
      },
      height: lateralWidthPiece2Height,
      width: structureWidth,
      name: "Left Bottom Part 2",
      sides: {
        back: {
          joint: {
            size: structureHalflapJointSize,
            jointType: "halfLap",
            male: true,
            holes: { numberOfHoles: 2, radius: structureScrewSize },
          },
        },
      },
    });
  }
}

// renderObject3D(Enclosure, {
//   structureBoxJointSize: 1,
//   enclosureDepth: 189,
//   enclosureHeight: 75,
//   enclosureWidth: 180,
//   enclosureFoamThickness: 5,
//   enclosureWallThickness: 0.5,
//   enclosureVigaThickness: 1,
//   structureHalflapJointSize: 3,
//   structureScrewSize: 0.3
// });

renderObject3D(Enclosure, {
  structureBoxJointSize: 0.5,
  enclosureDepth: 24,
  enclosureHeight: 12,
  enclosureWidth: 31,
  enclosureFoamThickness: 3,
  enclosureWallThickness: 0.5,
  enclosureVigaThickness: 1,
  structureHalflapJointSize: 2,
  structureScrewSize: 0.3,
});

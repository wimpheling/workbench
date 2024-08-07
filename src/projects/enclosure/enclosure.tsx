import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { AssembleCallback, EnclosureShapeMaker } from "./enclosureShapeMaker";
import * as THREE from "three";
import { getGeometry } from "../../lib/pieceHelpers";
import { halfLapJoint } from "../../lib/halfLapJoint";

enum Groups {
  Structure = "Structure",
}

class Enclosure implements MyObject3D {
  hiddenGroups = [Groups.Structure];
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
      (enclosureWidth * 3) / 5 + structureHalflapJointSize;

    const lateralWidthPiece2Height = (enclosureWidth * 2) / 5;
    const structureWidth = enclosureFoamThickness + enclosureVigaThickness * 2;

    const columnHolderShapeHeight = structureWidth;
    const endShapeHeight = enclosureWidth / 2 - columnHolderShapeHeight / 2;
    const lapShapeHeight =
      lateralWidthPiece1Height - endShapeHeight - columnHolderShapeHeight;

    const part1X = 0 + endShapeHeight / 2 + columnHolderShapeHeight / 2;
    const part2X =
      0 -
      lateralWidthPiece2Height / 2 -
      columnHolderShapeHeight / 2 -
      lapShapeHeight +
      structureHalflapJointSize;
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
        const endShape = getGeometry({
          depth: enclosureVigaThickness,
          width: structureWidth,
          height: endShapeHeight,
          type: "box",
        });

        const columnHolderShape = getGeometry({
          depth: enclosureVigaThickness,
          width: structureWidth,
          height: columnHolderShapeHeight,
          type: "box",
          sides: {
            front: {
              joint: {
                jointHeight: structureBoxJointSize,
                jointType: "box",
                male: false,
                numberOfJoints: 2,
              },
            },
            back: {
              joint: {
                jointHeight: structureBoxJointSize,
                jointType: "box",
                male: false,
                numberOfJoints: 2,
              },
            },
            left: {
              joint: {
                jointHeight: structureBoxJointSize,
                jointType: "box",
                male: false,
                numberOfJoints: 2,
              },
            },
            right: {
              joint: {
                jointHeight: structureBoxJointSize,
                jointType: "box",
                male: false,
                numberOfJoints: 2,
              },
            },
          },
        }).translateY(0 - endShapeHeight / 2 - columnHolderShapeHeight / 2);

        const lapShape = getGeometry({
          depth: enclosureVigaThickness,
          width: structureWidth,
          height: lapShapeHeight,
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
        }).translateY(
          0 - columnHolderShapeHeight - endShapeHeight / 2 - lapShapeHeight / 2,
        );

        return endShape.fuse(columnHolderShape).fuse(lapShape);
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
    const panels: {
      side: string;
      assemble: AssembleCallback;
      color?: string;
      male: boolean;
    }[] = [
      {
        side: "Inside",
        assemble: (obj) => {
          obj.position.set(0, enclosureHeight / 2, 0 - structureWidth / 2);
        },
        male: true,
      },
      {
        side: "Back",
        assemble: (obj) => {
          obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
          obj.position.set(0 - structureWidth / 2, enclosureHeight / 2, 0);
        },
        color: "red",
        male: false,
      },
      {
        side: "Front",
        assemble: (obj) => {
          obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
          obj.position.set(
            0 + structureWidth / 2 - enclosureVigaThickness,
            enclosureHeight / 2,
            0,
          );
        },
        color: "green",
        male: false,
      },
    ];
    panels.forEach(({ side, assemble, color, male }) => {
      this.sm.viga({
        group: Groups.Structure + 1,
        assemble,
        height: enclosureHeight,
        width: structureWidth,
        name: `Left Pillar ${side}`,
        color,
        sides: {
          front: {
            joint: {
              jointHeight: structureBoxJointSize,
              jointType: "box",
              male: true,
              numberOfJoints: 2,
            },
          },
          left: {
            joint: {
              jointHeight: structureBoxJointSize,
              jointType: "box",
              male,
              numberOfJoints: 20,
            },
          },
          right: {
            joint: {
              jointHeight: structureBoxJointSize,
              jointType: "box",
              male,
              numberOfJoints: 20,
            },
          },
        },
      });
    });
  }
}

renderObject3D(Enclosure, {
  structureBoxJointSize: 1,
  enclosureDepth: 189,
  enclosureHeight: 75,
  enclosureWidth: 180,
  enclosureFoamThickness: 5,
  enclosureWallThickness: 0.5,
  enclosureVigaThickness: 1,
  structureHalflapJointSize: 3,
  structureScrewSize: 0.3,
});

// renderObject3D(Enclosure, {
//   structureBoxJointSize: 0.5,
//   enclosureDepth: 24,
//   enclosureHeight: 12,
//   enclosureWidth: 31,
//   enclosureFoamThickness: 3,
//   enclosureWallThickness: 0.5,
//   enclosureVigaThickness: 1,
//   structureHalflapJointSize: 2,
//   structureScrewSize: 0.3,
// });

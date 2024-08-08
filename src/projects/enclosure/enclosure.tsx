import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";
import { AssembleCallback, EnclosureShapeMaker } from "./enclosureShapeMaker";
import * as THREE from "three";
import { getGeometry } from "../../lib/pieceHelpers";

enum Groups {
  Structure = "Structure",
}

class Enclosure implements MyObject3D {
  hiddenGroups = [Groups.Structure + "1", Groups.Structure + "2"];
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
    slidingDoorGuardSize,
    baseCornerPieceMargin,
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
    slidingDoorGuardSize: number;
    baseCornerPieceMargin: number;
  }) {
    this.sm = new EnclosureShapeMaker({
      enclosureVigaThickness,
    });

    const lateralWidthPiece1Height =
      (enclosureWidth * 3) / 5 + structureHalflapJointSize;

    const lateralWidthPiece2Height =
      (enclosureWidth * 2) / 5 -
      baseCornerPieceMargin +
      structureHalflapJointSize;
    const structureWidth = enclosureFoamThickness + enclosureVigaThickness * 2;

    const columnHolderShapeHeight = structureWidth;
    const endShapeHeight = enclosureWidth / 2 - columnHolderShapeHeight / 2;
    const lapShapeHeight =
      lateralWidthPiece1Height - endShapeHeight - columnHolderShapeHeight;

    const part1X = 0 + endShapeHeight / 2 + columnHolderShapeHeight / 2;
    const part2X =
      0 -
      (lateralWidthPiece2Height - structureWidth) / 2 -
      columnHolderShapeHeight / 2 -
      lapShapeHeight +
      structureHalflapJointSize;
    const slidingPanelWidth =
      enclosureVigaThickness * 2 + enclosureFoamThickness;

    const baseCornerPieceLength = structureWidth + baseCornerPieceMargin;

    const getColumnHolder = () => {
      return getGeometry({
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
      });
    };

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

        const columnHolderShape = getColumnHolder().translateY(
          0 - endShapeHeight / 2 - columnHolderShapeHeight / 2,
        );

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

    this.sm.makeShape({
      name: "Left Bottom Part 2",
      group: Groups.Structure,
      assemble: (obj) => {
        obj.rotateZ(Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI);
        obj.position.set(part2X, enclosureVigaThickness, 0);
      },
      material: "Wood",
      getGeometry: () => {
        const mainShapeHeight = lateralWidthPiece2Height - structureWidth;
        const mainShape = getGeometry({
          depth: enclosureVigaThickness,
          height: mainShapeHeight,
          width: structureWidth,
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
          type: "box",
        });
        const jointShape = getGeometry({
          depth: enclosureVigaThickness,
          height: structureWidth,
          width: structureWidth,
          type: "box",
          sides: {
            front: {
              joint: {
                size: structureHalflapJointSize,
                jointType: "halfLap",
                male: true,
                holes: { numberOfHoles: 2, radius: structureScrewSize },
              },
            },
          },
        }).translateY(0 - mainShapeHeight / 2 - structureWidth / 2);
        return mainShape.fuse(jointShape);
      },
    });
    const panelsSide: {
      side: string;
      assemble: AssembleCallback;
      color?: string;
      male: boolean;
    }[] = [
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
    panelsSide.forEach(({ side, assemble, color, male }) => {
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

    const panelsFace: {
      side: string;
      assemble: AssembleCallback;
      color?: string;
    }[] = [
      {
        side: "Inside",
        color: "purple",
        assemble: (obj) => {
          obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
          obj.position.set(
            0,
            enclosureHeight / 2,
            0 - structureWidth / 2 + enclosureVigaThickness,
          );
        },
      },
      {
        side: "Outside",
        color: "fuchsia",
        assemble: (obj) => {
          obj.position.set(
            0,
            enclosureHeight / 2,
            0 + structureWidth / 2 - enclosureVigaThickness,
          );
        },
      },
    ];

    panelsFace.forEach(({ side, assemble, color }) => {
      this.sm.makeShape({
        name: `Left Pillar ${side}`,
        material: "Wood",
        color,
        group: Groups.Structure + 2,
        assemble,
        getGeometry() {
          const mainPart = getGeometry({
            depth: enclosureVigaThickness,
            height: enclosureHeight,
            width: structureWidth,
            type: "box",
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
                  male: true,
                  numberOfJoints: 20,
                },
              },
              right: {
                joint: {
                  jointHeight: structureBoxJointSize,
                  jointType: "box",
                  male: true,
                  numberOfJoints: 20,
                },
              },
            },
          });

          const leftPart = getGeometry({
            depth: enclosureVigaThickness,
            height: enclosureHeight - enclosureVigaThickness,
            width: slidingDoorGuardSize,
            type: "box",
            sides: {
              front: {
                joint: {
                  jointType: "halfLap",
                  male: true,
                  size: slidingDoorGuardSize,
                  holes: {
                    numberOfHoles: 1,
                    radius: structureScrewSize,
                  },
                },
              },
            },
          }).translate(
            0 - structureWidth / 2 - enclosureVigaThickness,
            0 + enclosureVigaThickness / 2,
            0,
          );

          const rightPart = getGeometry({
            depth: enclosureVigaThickness,
            height: enclosureHeight - enclosureVigaThickness,
            width: slidingDoorGuardSize,
            type: "box",
            sides: {
              front: {
                joint: {
                  jointType: "halfLap",
                  male: true,
                  size: slidingDoorGuardSize,
                  holes: {
                    numberOfHoles: 1,
                    radius: structureScrewSize,
                  },
                },
              },
            },
          }).translate(
            0 + structureWidth / 2 + enclosureVigaThickness,
            0 + enclosureVigaThickness / 2,
            0,
          );

          return mainPart.fuse(leftPart).fuse(rightPart);
        },
      });
    });

    this.sm.makeShape({
      name: "Base Corner Piece Left Back",
      material: "Wood",
      color: "blue",
      group: Groups.Structure + 3,
      assemble: (obj) => {
        obj.rotateZ(Math.PI * 1.5);
        obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI * 1.5);
        // obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI);
        // obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        // obj.position.set(
        //   0,
        //   enclosureHeight / 2,
        //   0 - structureWidth / 2 + enclosureVigaThickness,
        // );
      },
      getGeometry: () => {
        const columnHolder = getColumnHolder();
        const bottomLink = getGeometry({
          depth: enclosureVigaThickness,
          height: baseCornerPieceMargin,
          width: structureWidth,
          type: "box",
          sides: {
            front: {
              joint: {
                jointType: "halfLap",
                male: true,
                size: structureHalflapJointSize,
                holes: {
                  numberOfHoles: 2,
                  radius: structureScrewSize,
                },
              },
            },
          },
        }).translateY(-structureWidth / 2 - baseCornerPieceMargin / 2);
        return columnHolder.fuse(bottomLink);
      },
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
  slidingDoorGuardSize: 2,
  baseCornerPieceMargin: 6,
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
// slidingDoorGuardSize: 2,
// });

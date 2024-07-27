import { WorkBenchShapeMaker } from "./WorkbenchShapeMaker";

import * as THREE from "three";
import {
  TABLE_DEPTH,
  TABLE_TOP_THICKNESS,
  TABLE_WIDTH,
  ENCLOSURE_HEIGHT,
  ENCLOSURE_WALL_THICKNESS,
  ENCLOSURE_DOOR_THICKNESS,
  SMALL_VIGA_SIZE_DEPTH,
  innerLateralEnclosureWallHeight,
  innerLateralEnclosureDepth,
  enclosureWallInnerTopWidth,
  enclouseOuterDepth,
  TABLE_TOP_Y,
  FOOT_HEIGHT,
  FOOT_WIDTH,
  VIGA_HEIGHT,
  FOOT_DEPTH,
  VIGA_WIDTH,
  enclosureThicknessWithoutInnerWall,
  enclosureInnerY,
  enclosureInnerZ,
  enclosureOuterY,
  SPACE_BETWEEN_SHELVES,
} from "./consts";
import { MyObject3D } from "../../lib/MyObject3D";
import { renderObject3D } from "../../lib/render";

const vigaHelper =
  (i: number, y: number, xModificator = 0) =>
  (viga: THREE.Object3D) => {
    viga.position.y = y + FOOT_HEIGHT - VIGA_WIDTH / 2;
    viga.position.z = 0;
    viga.rotation.x = THREE.MathUtils.degToRad(90);
    viga.rotation.y = THREE.MathUtils.degToRad(90);
    if (i === 0) {
      viga.position.x = 0 - TABLE_WIDTH / 2 + VIGA_HEIGHT / 2 + xModificator;
    } else if (i === 1) {
      viga.position.x = TABLE_WIDTH / 2 - VIGA_HEIGHT / 2 - xModificator;
    } else if (i === 2) {
      viga.position.x = 0;
      viga.position.z = 0 - TABLE_DEPTH / 2 + VIGA_HEIGHT / 2;
      viga.rotateOnAxis(
        new THREE.Vector3(1, 0, 0),
        THREE.MathUtils.degToRad(90)
      );
    } else if (i === 3) {
      viga.position.x = 0;
      viga.position.z = TABLE_DEPTH / 2 - VIGA_HEIGHT / 2;
      viga.rotateOnAxis(
        new THREE.Vector3(1, 0, 0),
        THREE.MathUtils.degToRad(90)
      );
    }
  };

const vigaHelper2 =
  (i: number, y: number, xModificator = 0) =>
  (viga: THREE.Object3D) => {
    viga.position.y = y + FOOT_HEIGHT - VIGA_WIDTH / 2;
    viga.position.z = 0;
    viga.rotation.x = THREE.MathUtils.degToRad(90);
    viga.rotation.y = THREE.MathUtils.degToRad(90);
    viga.position.x =
      TABLE_WIDTH / 2 -
      xModificator -
      ((i + 1) * (TABLE_WIDTH - xModificator * 2)) / 4;
  };

class WorkBench implements MyObject3D {
  hiddenGroups = [
    // "Enclosure Outer",
    // "Enclosure Door",
    // "Enclosure Inner",
    // "Bottom Shelf",
    // "Bottom Shelf Structure",
    // "Legs",
    // "Top Shelf Structure",
    // "Top Shelf Structure Joins",
  ];
  hiddenGroupsInSpecs = [
    "Enclosure Outer",
    "Enclosure Door",
    "Enclosure Inner",
    // "Top Shelf Structure Joins",
  ];
  sm = new WorkBenchShapeMaker(this.hiddenGroupsInSpecs);

  constructor() {
    this.sm.makeShape({
      geometry: {
        height: TABLE_DEPTH,
        width: TABLE_WIDTH,
        depth: TABLE_TOP_THICKNESS,
        type: "box",
        // sides: {
        //   left: {
        //     joint: {
        //       jointHeight: 10,
        //       jointType: "box",
        //       male: true,
        //       numberOfJoints: 2,
        //     },
        //   },
        // },
      },
      name: "Table Top",
      group: "Table Top",
      material: "MDF",
      assemble: (obj) => {
        obj.rotation.x = THREE.MathUtils.degToRad(90);
        obj.position.x = 0;
        obj.position.y = TABLE_TOP_Y;
        obj.position.z = 0;
      },
    });

    this.sm.makeShape({
      geometry: {
        height: TABLE_DEPTH,
        width: TABLE_WIDTH - 2 * FOOT_WIDTH - 2 * VIGA_HEIGHT,
        depth: TABLE_TOP_THICKNESS,
        type: "box",
      },
      name: "Bottom Shelf",
      group: "Bottom Shelf",
      assemble: (bottomShelf) => {
        bottomShelf.rotation.x = THREE.MathUtils.degToRad(90);
        bottomShelf.position.x = 0;
        bottomShelf.position.y =
          0 + FOOT_HEIGHT - SPACE_BETWEEN_SHELVES + TABLE_TOP_THICKNESS / 2;
        bottomShelf.position.z = 0;
      },
      material: "OSB",
    });

    this.sm.foot({
      name: "Leg 1",
      assemble: (obj) => {
        obj.position.x = 0 - TABLE_WIDTH / 2 + FOOT_WIDTH / 2 + VIGA_HEIGHT;
        obj.position.y = 0 + FOOT_HEIGHT / 2;
        obj.position.z = 0 - TABLE_DEPTH / 2 + FOOT_DEPTH / 2 + VIGA_HEIGHT;
      },
    });
    this.sm.foot({
      name: "Leg 2",
      assemble: (obj) => {
        obj.position.x = TABLE_WIDTH / 2 - FOOT_WIDTH / 2 - VIGA_HEIGHT;
        obj.position.y = 0 + FOOT_HEIGHT / 2;
        obj.position.z = TABLE_DEPTH / 2 - FOOT_DEPTH / 2 - VIGA_HEIGHT;
      },
    });
    this.sm.foot({
      name: "Leg 3",
      assemble: (obj) => {
        obj.position.x = TABLE_WIDTH / 2 - FOOT_WIDTH / 2 - VIGA_HEIGHT;
        obj.position.y = 0 + FOOT_HEIGHT / 2;
        obj.position.z = 0 - TABLE_DEPTH / 2 + FOOT_DEPTH / 2 + VIGA_HEIGHT;
      },
    });
    this.sm.foot({
      name: "Leg 4",
      assemble: (obj) => {
        obj.position.x = 0 - TABLE_WIDTH / 2 + FOOT_WIDTH / 2 + VIGA_HEIGHT;
        obj.position.y = 0 + FOOT_HEIGHT / 2;
        obj.position.z = TABLE_DEPTH / 2 - FOOT_DEPTH / 2 - VIGA_HEIGHT;
      },
    });

    this.sm.foot({
      name: "Leg 5",
      assemble: (obj) => {
        obj.position.x = 0 - TABLE_WIDTH / 2 + FOOT_WIDTH / 2 + VIGA_HEIGHT;
        obj.position.y = 0 + FOOT_HEIGHT / 2;
        obj.position.z = 0;
      },
    });

    this.sm.foot({
      name: "Leg 6",
      assemble: (obj) => {
        obj.position.x = TABLE_WIDTH / 2 - FOOT_WIDTH / 2 - VIGA_HEIGHT;
        obj.position.y = 0 + FOOT_HEIGHT / 2;
        obj.position.z = 0;
      },
    });

    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga1",
      group: "Top Shelf Structure",
      assemble: vigaHelper(0, 0),
    });
    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga2",
      group: "Top Shelf Structure",
      assemble: vigaHelper(1, 0),
    });

    this.sm.viga({
      height: TABLE_WIDTH,
      name: "bigViga1",
      group: "Top Shelf Structure",
      assemble: vigaHelper(2, 0),
    });

    this.sm.viga({
      height: TABLE_WIDTH,
      name: "bigViga2",
      group: "Top Shelf Structure",
      assemble: vigaHelper(3, 0),
    });

    // make 4 others vigas
    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga5",
      group: "Top Shelf Structure",
      assemble: vigaHelper2(0, 0),
    });
    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga6",
      group: "Top Shelf Structure",
      assemble: vigaHelper2(1, 0),
    });
    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga7",
      group: "Top Shelf Structure",
      assemble: vigaHelper2(2, 0),
    });

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const height = (TABLE_WIDTH - 2 * VIGA_HEIGHT) / 4 - 2 * VIGA_HEIGHT;
        this.sm.viga({
          height,
          name: `vigah-${i}-${j}`,
          group: "Top Shelf Structure Joins",
          color: "red",
          assemble: (obj) => {
            obj.rotation.x = THREE.MathUtils.degToRad(90);
            obj.rotation.y = THREE.MathUtils.degToRad(90);
            obj.rotateOnAxis(
              new THREE.Vector3(1, 0, 0),
              THREE.MathUtils.degToRad(90)
            );

            obj.position.x =
              TABLE_WIDTH / 2 -
              FOOT_WIDTH / 2 -
              height / 2 -
              i * (height + 2 * VIGA_HEIGHT);
            obj.position.y = 0 + FOOT_HEIGHT - VIGA_WIDTH / 2;
            obj.position.z =
              TABLE_DEPTH / 2 -
              VIGA_HEIGHT * 2 -
              (j + 1) * ((TABLE_DEPTH - VIGA_HEIGHT * 2) / 5);
          },
        });
      }
    }

    // second platform

    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga8",
      group: "Bottom Shelf Structure",
      assemble: vigaHelper(0, -SPACE_BETWEEN_SHELVES, FOOT_WIDTH + VIGA_HEIGHT),
    });
    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga9",
      group: "Bottom Shelf Structure",
      assemble: vigaHelper(1, -SPACE_BETWEEN_SHELVES, FOOT_WIDTH + VIGA_HEIGHT),
    });
    this.sm.viga({
      height: TABLE_WIDTH,
      name: "viga10",
      group: "Bottom Shelf Structure",
      assemble: vigaHelper(2, -SPACE_BETWEEN_SHELVES, FOOT_WIDTH + VIGA_HEIGHT),
    });
    this.sm.viga({
      height: TABLE_WIDTH,
      name: "viga11",
      group: "Bottom Shelf Structure",
      assemble: vigaHelper(3, -SPACE_BETWEEN_SHELVES, FOOT_WIDTH + VIGA_HEIGHT),
    });
    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga12",
      group: "Bottom Shelf Structure",
      assemble: vigaHelper2(
        0,
        -SPACE_BETWEEN_SHELVES,
        FOOT_WIDTH + VIGA_HEIGHT / 2
      ),
    });
    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga13",
      group: "Bottom Shelf Structure",
      assemble: vigaHelper2(
        1,
        -SPACE_BETWEEN_SHELVES,
        FOOT_WIDTH + VIGA_HEIGHT / 2
      ),
    });

    this.sm.viga({
      height: SMALL_VIGA_SIZE_DEPTH,
      name: "viga14",
      group: "Bottom Shelf Structure",
      assemble: vigaHelper2(
        2,
        -SPACE_BETWEEN_SHELVES,
        FOOT_WIDTH + VIGA_HEIGHT / 2
      ),
    });

    // upper joinery

    // enclosure

    this.sm.enclosureWall({
      height: innerLateralEnclosureWallHeight,
      width: innerLateralEnclosureDepth,
      name: "Enclosure Wall Inner Right",
      dimensions: true,
      color: "yellow",
      group: "Enclosure Inner",
      assemble: (obj) => {
        obj.rotation.y = THREE.MathUtils.degToRad(90);
        obj.position.x =
          TABLE_WIDTH / 2 -
          enclosureThicknessWithoutInnerWall -
          ENCLOSURE_WALL_THICKNESS / 2;
        obj.position.y = enclosureInnerY;
        obj.position.z = enclosureInnerZ;
      },
    });

    this.sm.enclosureWall({
      height: innerLateralEnclosureWallHeight,
      width: innerLateralEnclosureDepth,
      name: "Enclosure Wall Inner Left",
      group: "Enclosure Inner",
      assemble: (enclosureWallInnerLeft) => {
        enclosureWallInnerLeft.rotation.y = THREE.MathUtils.degToRad(90);
        enclosureWallInnerLeft.position.x =
          0 -
          TABLE_WIDTH / 2 +
          enclosureThicknessWithoutInnerWall +
          ENCLOSURE_WALL_THICKNESS / 2;
        enclosureWallInnerLeft.position.y = enclosureInnerY;
        enclosureWallInnerLeft.position.z = enclosureInnerZ;
      },
    });

    this.sm.enclosureWall({
      height: innerLateralEnclosureDepth,
      width: enclosureWallInnerTopWidth,
      dimensions: true,
      name: "Enclosure Wall Inner Top",
      group: "Enclosure Inner",
      assemble: (enclosureWallInnerTop) => {
        enclosureWallInnerTop.rotation.x = THREE.MathUtils.degToRad(90);
        enclosureWallInnerTop.position.x =
          0 -
          TABLE_WIDTH / 2 +
          enclosureWallInnerTopWidth / 2 +
          enclosureThicknessWithoutInnerWall;
        enclosureWallInnerTop.position.y =
          TABLE_TOP_Y +
          TABLE_TOP_THICKNESS +
          innerLateralEnclosureWallHeight +
          ENCLOSURE_WALL_THICKNESS / 2;
        enclosureWallInnerTop.position.z = enclosureInnerZ;
      },
    });

    this.sm.enclosureWall({
      height: innerLateralEnclosureWallHeight,
      width: enclosureWallInnerTopWidth - 2 * ENCLOSURE_WALL_THICKNESS,
      name: "Enclosure Wall Inner Back",
      color: "red",
      dimensions: true,
      group: "Enclosure Inner",
      assemble: (enclosureWallInnerBack) => {
        enclosureWallInnerBack.rotation.x = THREE.MathUtils.degToRad(90);
        enclosureWallInnerBack.rotateOnAxis(
          new THREE.Vector3(1, 0, 0),
          THREE.MathUtils.degToRad(90)
        );
        enclosureWallInnerBack.position.x = 0;
        enclosureWallInnerBack.position.y = enclosureInnerY;
        enclosureWallInnerBack.position.z =
          0 -
          TABLE_DEPTH / 2 +
          ENCLOSURE_WALL_THICKNESS / 2 +
          enclosureThicknessWithoutInnerWall;
      },
    });

    this.sm.makeShape({
      geometry: {
        height: ENCLOSURE_HEIGHT,
        depth: ENCLOSURE_DOOR_THICKNESS,
        width: TABLE_WIDTH,
        type: "box",
      },
      name: "Enclosure Door",
      color: "darkgreen",
      opacity: 0.5,
      group: "Enclosure Door",
      material: "TEMP",
      assemble: (enclosureDoorDraft) => {
        enclosureDoorDraft.rotation.x = THREE.MathUtils.degToRad(90);
        enclosureDoorDraft.rotateOnAxis(
          new THREE.Vector3(1, 0, 0),
          THREE.MathUtils.degToRad(90)
        );
        enclosureDoorDraft.position.x = 0;
        enclosureDoorDraft.position.y = enclosureOuterY;
        enclosureDoorDraft.position.z =
          0 + TABLE_DEPTH / 2 - ENCLOSURE_DOOR_THICKNESS / 2;
      },
    });

    this.sm.enclosureWall({
      height: ENCLOSURE_HEIGHT,
      width: enclouseOuterDepth,
      name: "Enclosure Wall Outer Left",
      color: "black",
      opacity: 0.8,
      group: "Enclosure Outer",
      assemble: (enclosureWallOuterLeft) => {
        enclosureWallOuterLeft.rotation.y = THREE.MathUtils.degToRad(90);
        enclosureWallOuterLeft.position.x =
          0 - TABLE_WIDTH / 2 + ENCLOSURE_WALL_THICKNESS / 2;
        enclosureWallOuterLeft.position.y = enclosureOuterY;
        enclosureWallOuterLeft.position.z =
          0 - TABLE_DEPTH / 2 + enclouseOuterDepth / 2;
      },
    });
    this.sm.enclosureWall({
      height: ENCLOSURE_HEIGHT,
      width: enclouseOuterDepth,
      name: "Enclosure Wall Outer Right",
      color: "black",
      opacity: 0.8,
      group: "Enclosure Outer",
      assemble: (enclosureWallOuterRight) => {
        enclosureWallOuterRight.rotation.y = THREE.MathUtils.degToRad(90);
        enclosureWallOuterRight.position.x =
          0 + TABLE_WIDTH / 2 - ENCLOSURE_WALL_THICKNESS / 2;
        enclosureWallOuterRight.position.y = enclosureOuterY;
        enclosureWallOuterRight.position.z =
          0 - TABLE_DEPTH / 2 + enclouseOuterDepth / 2;
      },
    });
    this.sm.enclosureWall({
      height: ENCLOSURE_HEIGHT,
      width: TABLE_WIDTH - 2 * ENCLOSURE_WALL_THICKNESS,
      name: "Enclosure Wall Outer Back",
      color: "black",
      opacity: 0.8,
      group: "Enclosure Outer",
      assemble: (enclosureWallOuterBack) => {
        enclosureWallOuterBack.rotation.x = THREE.MathUtils.degToRad(90);
        enclosureWallOuterBack.rotateOnAxis(
          new THREE.Vector3(1, 0, 0),
          THREE.MathUtils.degToRad(90)
        );
        enclosureWallOuterBack.position.x = 0;
        enclosureWallOuterBack.position.y = enclosureOuterY;
        enclosureWallOuterBack.position.z =
          0 - TABLE_DEPTH / 2 + ENCLOSURE_WALL_THICKNESS / 2;
      },
    });
    this.sm.enclosureWall({
      height: TABLE_DEPTH,
      width: TABLE_WIDTH,
      name: "Enclosure Wall Outer Top",
      color: "pink",
      opacity: 0.5,
      group: "Enclosure Outer",
      assemble: (enclosureWallOuterTop) => {
        enclosureWallOuterTop.rotation.x = THREE.MathUtils.degToRad(90);
        enclosureWallOuterTop.position.x = 0;
        enclosureWallOuterTop.position.y =
          enclosureOuterY + ENCLOSURE_HEIGHT / 2;
        enclosureWallOuterTop.position.z = 0;
      },
    });
  }
}

renderObject3D(WorkBench);

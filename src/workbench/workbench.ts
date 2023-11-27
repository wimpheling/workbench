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
  tableTopY,
  FOOT_HEIGHT,
  FOOT_WIDTH,
  VIGA_HEIGHT,
  FOOT_DEPTH,
  VIGA_WIDTH,
  enclosureThicknessWithoutInnerWall,
  enclosureInnerY,
  enclosureInnerZ,
  enclosureOuterY,
} from "./consts";

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

export class WorkBench {
  sm = new WorkBenchShapeMaker();

  tableTop = this.sm.makeShape({
    height: TABLE_TOP_THICKNESS,
    width: TABLE_WIDTH,
    depth: TABLE_DEPTH,
    name: "tableTop",
    group: "tableTop",
    material: "MDF",
    assemble: (obj) => {
      obj.rotation.z = 0;
      obj.position.x = 0;
      obj.position.y = tableTopY;
      obj.position.z = 0;
    },
  });

  foot1 = this.sm.foot({
    name: "foot1",
    assemble: (obj) => {
      obj.position.x = 0 - TABLE_WIDTH / 2 + FOOT_WIDTH / 2 + VIGA_HEIGHT;
      obj.position.y = 0 + FOOT_HEIGHT / 2;
      obj.position.z = 0 - TABLE_DEPTH / 2 + FOOT_DEPTH / 2 + VIGA_HEIGHT;
    },
  });
  foot2 = this.sm.foot({
    name: "foot2",
    assemble: (obj) => {
      obj.position.x = TABLE_WIDTH / 2 - FOOT_WIDTH / 2 - VIGA_HEIGHT;
      obj.position.y = 0 + FOOT_HEIGHT / 2;
      obj.position.z = TABLE_DEPTH / 2 - FOOT_DEPTH / 2 - VIGA_HEIGHT;
    },
  });
  foot3 = this.sm.foot({
    name: "foot3",
    assemble: (obj) => {
      obj.position.x = TABLE_WIDTH / 2 - FOOT_WIDTH / 2 - VIGA_HEIGHT;
      obj.position.y = 0 + FOOT_HEIGHT / 2;
      obj.position.z = 0 - TABLE_DEPTH / 2 + FOOT_DEPTH / 2 + VIGA_HEIGHT;
    },
  });
  foot4 = this.sm.foot({
    name: "foot4",
    assemble: (obj) => {
      obj.position.x = 0 - TABLE_WIDTH / 2 + FOOT_WIDTH / 2 + VIGA_HEIGHT;
      obj.position.y = 0 + FOOT_HEIGHT / 2;
      obj.position.z = TABLE_DEPTH / 2 - FOOT_DEPTH / 2 - VIGA_HEIGHT;
    },
  });

  viga1 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga1",
    color: "green",
    group: "vigaTop",
    assemble: vigaHelper(0, 0),
  });
  viga2 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga2",
    group: "vigaTop",
    assemble: vigaHelper(1, 0),
  });

  bigViga1 = this.sm.viga({
    height: TABLE_WIDTH,
    name: "bigViga1",
    color: "red",
    group: "vigaTop",
    assemble: vigaHelper(2, 0),
  });

  bigViga2 = this.sm.viga({
    height: TABLE_WIDTH,
    name: "bigViga2",
    group: "vigaTop",
    assemble: vigaHelper(3, 0),
  });

  // make 4 others vigas
  viga5 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga5",
    group: "vigaTop",
    assemble: vigaHelper2(0, 0),
  });
  viga6 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga6",
    group: "vigaTop",
    assemble: vigaHelper2(1, 0),
  });
  viga7 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga7",
    group: "vigaTop",
    assemble: vigaHelper2(2, 0),
  });

  // second platform

  viga8 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga8",
    group: "vigaBottom",
    assemble: vigaHelper(0, -50, FOOT_WIDTH + VIGA_HEIGHT),
  });
  viga9 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga9",
    group: "vigaBottom",
    assemble: vigaHelper(1, -50, FOOT_WIDTH + VIGA_HEIGHT),
  });
  viga10 = this.sm.viga({
    height: TABLE_WIDTH,
    name: "viga10",
    group: "vigaBottom",
    assemble: vigaHelper(2, -50, FOOT_WIDTH + VIGA_HEIGHT),
  });
  viga11 = this.sm.viga({
    height: TABLE_WIDTH,
    name: "viga11",
    group: "vigaBottom",
    assemble: vigaHelper(3, -50, FOOT_WIDTH + VIGA_HEIGHT),
  });
  viga12 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga12",
    group: "vigaBottom",
    assemble: vigaHelper2(0, -50, FOOT_WIDTH + VIGA_HEIGHT / 2),
  });
  viga13 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga13",
    group: "vigaBottom",
    assemble: vigaHelper2(1, -50, FOOT_WIDTH + VIGA_HEIGHT / 2),
  });
  viga14 = this.sm.viga({
    height: SMALL_VIGA_SIZE_DEPTH,
    name: "viga14",
    group: "vigaBottom",
    assemble: vigaHelper2(2, -50, FOOT_WIDTH + VIGA_HEIGHT / 2),
  });

  // enclosure

  enclosureWallInnerRight = this.sm.enclosureWall({
    height: innerLateralEnclosureWallHeight,
    width: innerLateralEnclosureDepth,
    name: "enclosureWallInnerRight",
    dimensions: true,
    color: "yellow",
    group: "enclosure inner",
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

  enclosureWallInnerLeft = this.sm.enclosureWall({
    height: innerLateralEnclosureWallHeight,
    width: innerLateralEnclosureDepth,
    name: "enclosureWallInnerLeft",
    group: "enclosure inner",
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

  enclosureWallInnerTop = this.sm.enclosureWall({
    height: innerLateralEnclosureDepth,
    width: enclosureWallInnerTopWidth,
    dimensions: true,
    name: "enclosureWallInnerTop",
    group: "enclosure inner",
    assemble: (enclosureWallInnerTop) => {
      enclosureWallInnerTop.rotation.x = THREE.MathUtils.degToRad(90);
      enclosureWallInnerTop.position.x =
        0 -
        TABLE_WIDTH / 2 +
        enclosureWallInnerTopWidth / 2 +
        enclosureThicknessWithoutInnerWall;
      enclosureWallInnerTop.position.y =
        tableTopY +
        TABLE_TOP_THICKNESS +
        innerLateralEnclosureWallHeight +
        ENCLOSURE_WALL_THICKNESS / 2;
      enclosureWallInnerTop.position.z = enclosureInnerZ;
    },
  });

  enclosureWallInnerBack = this.sm.enclosureWall({
    height: innerLateralEnclosureWallHeight,
    width: enclosureWallInnerTopWidth - 2 * ENCLOSURE_WALL_THICKNESS,
    name: "enclosureWallInnerBack",
    color: "red",
    dimensions: true,
    group: "enclosure inner",
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

  enclosureDoorDraft = this.sm.makeShape({
    height: ENCLOSURE_HEIGHT,
    depth: ENCLOSURE_DOOR_THICKNESS,
    width: TABLE_WIDTH,
    name: "enclosureDoorDraft",
    color: "darkgreen",
    opacity: 0.5,
    group: "enclosure Door",
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

  enclosureWallOuterLeft = this.sm.enclosureWall({
    height: ENCLOSURE_HEIGHT,
    width: enclouseOuterDepth,
    name: "enclosureWallOuterLeft",
    color: "black",
    opacity: 0.8,
    group: "enclosure outer",
    assemble: (enclosureWallOuterLeft) => {
      enclosureWallOuterLeft.rotation.y = THREE.MathUtils.degToRad(90);
      enclosureWallOuterLeft.position.x =
        0 - TABLE_WIDTH / 2 + ENCLOSURE_WALL_THICKNESS / 2;
      enclosureWallOuterLeft.position.y = enclosureOuterY;
      enclosureWallOuterLeft.position.z =
        0 - TABLE_DEPTH / 2 + enclouseOuterDepth / 2;
    },
  });
  enclosureWallOuterRight = this.sm.enclosureWall({
    height: ENCLOSURE_HEIGHT,
    width: enclouseOuterDepth,
    name: "enclosureWallOuterRight",
    color: "black",
    opacity: 0.8,
    group: "enclosure outer",
    assemble: (enclosureWallOuterRight) => {
      enclosureWallOuterRight.rotation.y = THREE.MathUtils.degToRad(90);
      enclosureWallOuterRight.position.x =
        0 + TABLE_WIDTH / 2 - ENCLOSURE_WALL_THICKNESS / 2;
      enclosureWallOuterRight.position.y = enclosureOuterY;
      enclosureWallOuterRight.position.z =
        0 - TABLE_DEPTH / 2 + enclouseOuterDepth / 2;
    },
  });
  enclosureWallOuterBack = this.sm.enclosureWall({
    height: ENCLOSURE_HEIGHT,
    width: TABLE_WIDTH - 2 * ENCLOSURE_WALL_THICKNESS,
    name: "enclosureWallOuterBack",
    color: "black",
    opacity: 0.8,
    group: "enclosure outer",
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
  enclosureWallOuterTop = this.sm.enclosureWall({
    height: TABLE_DEPTH,
    width: TABLE_WIDTH,
    name: "enclosureWallOuterTop",
    color: "pink",
    opacity: 0.5,
    group: "enclosure outer",
    assemble: (enclosureWallOuterTop) => {
      enclosureWallOuterTop.rotation.x = THREE.MathUtils.degToRad(90);
      enclosureWallOuterTop.position.x = 0;
      enclosureWallOuterTop.position.y = enclosureOuterY + ENCLOSURE_HEIGHT / 2;
      enclosureWallOuterTop.position.z = 0;
    },
  });
}
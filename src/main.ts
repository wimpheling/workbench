import * as THREE from "three";
import {
  FOOT_DEPTH,
  FOOT_HEIGHT,
  FOOT_WIDTH,
  TABLE_DEPTH,
  TABLE_TOP_THICKNESS,
  TABLE_WIDTH,
  VIGA_HEIGHT,
  VIGA_WIDTH,
  SMALL_VIGA_HEIGHT,
  ENCLOSURE_HEIGHT,
  ENCLOSURE_FOAM_THICKNESS,
  ENCLOSURE_WALL_THICKNESS,
  ENCLOSURE_SOUND_INSULATOR_THICKNESS,
  ENCLOSURE_DOOR_THICKNESS,
} from "./consts";
import { init } from "./threeConfig";
import { ShapeMakerSpecific } from "./makers";

const { scene, camera, setAnimateCallback } = init();
const shapeMaker = new ShapeMakerSpecific(scene);

const tableTop = shapeMaker.makeShape({
  height: TABLE_TOP_THICKNESS,
  width: TABLE_WIDTH,
  depth: TABLE_DEPTH,
  // dimensions: true,
  // opacity: 0.8,
});

const foot1 = shapeMaker.foot({
  name: "foot1",
});
const foot2 = shapeMaker.foot({
  name: "foot2",
});
const foot3 = shapeMaker.foot({
  name: "foot3",
});
const foot4 = shapeMaker.foot({
  name: "foot4",
  // dimensions: true,
});

shapeMaker.newRow();

const bigViga1 = shapeMaker.viga({
  height: TABLE_WIDTH,
  name: "bigViga1",
});

const bigViga2 = shapeMaker.viga({
  height: TABLE_WIDTH,
  name: "bigViga2",
});

const viga8 = shapeMaker.viga({
  height: TABLE_WIDTH,
  name: "viga8",
});
const viga9 = shapeMaker.viga({
  height: TABLE_WIDTH,
  name: "viga9",
  // dimensions: true,
});
const viga1 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga1",
});
const viga2 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga2",
});
// make 4 others vigas
const viga5 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga5",
});
const viga6 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga6",
});
const viga7 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga7",
});

const vigasTop = [viga1, viga2, bigViga1, bigViga2, viga5, viga6, viga7];

const viga10 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga10",
});
const viga11 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga11",
});
const viga12 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga12",
});
const viga13 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga13",
});
const viga14 = shapeMaker.viga({
  height: SMALL_VIGA_HEIGHT,
  name: "viga14",
  // dimensions: true,
});

const vigasBottom = [viga8, viga9, viga10, viga11, viga12, viga13, viga14];

// enclosure
shapeMaker.newRow();

const enclosureThicknessWithoutInner =
  ENCLOSURE_FOAM_THICKNESS +
  ENCLOSURE_SOUND_INSULATOR_THICKNESS +
  ENCLOSURE_WALL_THICKNESS;
const innerLateralEnclosureWallWidth =
  TABLE_WIDTH - enclosureThicknessWithoutInner - ENCLOSURE_DOOR_THICKNESS;
const innerLateralEnclosureWallHeight =
  ENCLOSURE_HEIGHT - enclosureThicknessWithoutInner;

const enclosureWallInnerLeft = shapeMaker.enclosureWall({
  height: innerLateralEnclosureWallHeight,
  width: innerLateralEnclosureWallWidth,
  name: "enclosureWallInnerLeft",
  dimensions: true,
});

const enclosureWallInnerRight = shapeMaker.enclosureWall({
  height: innerLateralEnclosureWallHeight,
  width: innerLateralEnclosureWallWidth,
  name: "enclosureWallInnerRight",
});
const enclosureWallInnerTopWidth =
  TABLE_WIDTH - 2 * enclosureThicknessWithoutInner;

const enclosureWallInnerTop = shapeMaker.enclosureWall({
  height: innerLateralEnclosureWallWidth,
  width: enclosureWallInnerTopWidth,
  dimensions: true,
  name: "enclosureWallInnerTop",
});

const enclosureWallInnerBack = shapeMaker.enclosureWall({
  height: innerLateralEnclosureWallHeight,
  width: enclosureWallInnerTopWidth - 2 * ENCLOSURE_WALL_THICKNESS,
  name: "enclosureWallInnerBack",
  color: "red",
  dimensions: true,
});

const enclosureWallOuterLeft = shapeMaker.enclosureWall({
  height: ENCLOSURE_HEIGHT,
  width: TABLE_WIDTH - ENCLOSURE_DOOR_THICKNESS,
  name: "enclosureWallOuterLeft",
});
const enclosureWallOuterRight = shapeMaker.enclosureWall({
  height: ENCLOSURE_HEIGHT,
  width: TABLE_WIDTH - ENCLOSURE_DOOR_THICKNESS,
  name: "enclosureWallOuterRight",
});
const enclosureWallOuterTop = shapeMaker.enclosureWall({
  height: TABLE_WIDTH,
  width: TABLE_WIDTH - ENCLOSURE_DOOR_THICKNESS,
  name: "enclosureWallOuterTop",
});

// assemble base
function assembleBase(animFactor = 0) {
  const tableTopY = FOOT_HEIGHT + TABLE_TOP_THICKNESS / 2;
  function tableTopPosition() {
    tableTop.rotation.z = 0;
    tableTop.position.x = 0;
    tableTop.position.y = tableTopY;
    tableTop.position.z = 0;
  }

  function feetPosition() {
    foot1.position.x = 0 - TABLE_WIDTH / 2 + FOOT_WIDTH / 2 + VIGA_HEIGHT;
    foot1.position.y = 0 + FOOT_HEIGHT / 2;
    foot1.position.z = 0 - TABLE_DEPTH / 2 + FOOT_DEPTH / 2 + VIGA_HEIGHT;
    // const bbox = new THREE.Box3().setFromObject(foot1);
    // console.log(bbox.min.y, bbox.max.y);

    foot2.position.x = TABLE_WIDTH / 2 - FOOT_WIDTH / 2 - VIGA_HEIGHT;
    foot2.position.y = 0 + FOOT_HEIGHT / 2;
    foot2.position.z = TABLE_DEPTH / 2 - FOOT_DEPTH / 2 - VIGA_HEIGHT;

    foot3.position.x = TABLE_WIDTH / 2 - FOOT_WIDTH / 2 - VIGA_HEIGHT;
    foot3.position.y = 0 + FOOT_HEIGHT / 2;
    foot3.position.z = 0 - TABLE_DEPTH / 2 + FOOT_DEPTH / 2 + VIGA_HEIGHT;

    foot4.position.x = 0 - TABLE_WIDTH / 2 + FOOT_WIDTH / 2 + VIGA_HEIGHT;
    foot4.position.y = 0 + FOOT_HEIGHT / 2;
    foot4.position.z = TABLE_DEPTH / 2 - FOOT_DEPTH / 2 - VIGA_HEIGHT;
  }

  // vigas top
  function vigasPlane(
    vigas: THREE.Group<THREE.Object3DEventMap>[],
    {
      y,
    }: {
      y: number;
    }
  ) {
    // around
    for (let i = 0; i < 4; i++) {
      const viga = vigas[i];
      viga.position.y = y + FOOT_HEIGHT - VIGA_WIDTH / 2;
      viga.position.z = 0;
      viga.rotation.x = THREE.MathUtils.degToRad(90);
      viga.rotation.y = THREE.MathUtils.degToRad(90);
      if (i === 0) {
        viga.position.x = 0 - TABLE_WIDTH / 2 + VIGA_HEIGHT / 2;
      } else if (i === 1) {
        viga.position.x = TABLE_WIDTH / 2 - VIGA_HEIGHT / 2;
      } else if (i === 2) {
        viga.position.x = 0;
        viga.position.z = 0 - TABLE_WIDTH / 2 + VIGA_HEIGHT / 2;
        viga.rotateOnAxis(
          new THREE.Vector3(1, 0, 0),
          THREE.MathUtils.degToRad(90)
        );
      } else if (i === 3) {
        viga.position.x = 0;
        viga.position.z = TABLE_WIDTH / 2 - VIGA_HEIGHT / 2;
        viga.rotateOnAxis(
          new THREE.Vector3(1, 0, 0),
          THREE.MathUtils.degToRad(90)
        );
      }

      // const bbox = new THREE.Box3().setFromObject(viga);
      // console.log(bbox.min.y, bbox.max.y);
    }

    for (let i = 0; i < 3; i++) {
      const viga = vigas[i + 4];
      viga.position.y = y + FOOT_HEIGHT - VIGA_WIDTH / 2;
      viga.position.z = 0;
      viga.rotation.x = THREE.MathUtils.degToRad(90);
      viga.rotation.y = THREE.MathUtils.degToRad(90);
      viga.position.x = TABLE_WIDTH / 2 - ((i + 1) * TABLE_WIDTH) / 4;
    }
  }

  // enclosure
  function enclosure() {
    const enclosureY =
      tableTopY + TABLE_TOP_THICKNESS + innerLateralEnclosureWallHeight / 2;

    enclosureWallInnerLeft.rotation.y = THREE.MathUtils.degToRad(90);
    enclosureWallInnerLeft.position.x =
      TABLE_WIDTH / 2 -
      enclosureThicknessWithoutInner -
      ENCLOSURE_WALL_THICKNESS / 2;
    enclosureWallInnerLeft.position.y = enclosureY;
    enclosureWallInnerLeft.position.z = 0;

    enclosureWallInnerRight.rotation.y = THREE.MathUtils.degToRad(90);
    enclosureWallInnerRight.position.x =
      0 -
      TABLE_WIDTH / 2 +
      enclosureThicknessWithoutInner +
      ENCLOSURE_WALL_THICKNESS / 2;
    enclosureWallInnerRight.position.y = enclosureY;
    enclosureWallInnerRight.position.z = 0;

    // enclosureWallInnerTop.rotation.y = THREE.MathUtils.degToRad(90);
    enclosureWallInnerTop.rotation.x = THREE.MathUtils.degToRad(90);
    enclosureWallInnerTop.position.x =
      0 -
      TABLE_WIDTH / 2 +
      enclosureWallInnerTopWidth / 2 +
      enclosureThicknessWithoutInner;
    enclosureWallInnerTop.position.y =
      tableTopY +
      TABLE_TOP_THICKNESS +
      innerLateralEnclosureWallHeight +
      ENCLOSURE_WALL_THICKNESS / 2;

    // enclosureWallInnerBack.rotation.y = THREE.MathUtils.degToRad(90);
    enclosureWallInnerBack.rotation.x = THREE.MathUtils.degToRad(90);
    enclosureWallInnerBack.rotateOnAxis(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(90)
    );
    enclosureWallInnerBack.position.x = 0;
    enclosureWallInnerBack.position.y = enclosureY;
    enclosureWallInnerBack.position.z =
      0 -
      TABLE_WIDTH / 2 +
      enclosureThicknessWithoutInner +
      ENCLOSURE_WALL_THICKNESS * 2;
  }

  // Turn on the  s
  const light = new THREE.AmbientLight("white", 1);
  // const light = new THREE.PointLight("blue", 1, 0);
  light.castShadow = true;
  light.position.set(0, 100, 0);
  scene.add(light);

  tableTopPosition();
  feetPosition();
  vigasPlane(vigasTop, { y: 0 });
  vigasPlane(vigasBottom, { y: -50 });
  enclosure();

  const axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);
}

assembleBase();
camera.lookAt(tableTop.position.x, tableTop.position.y, tableTop.position.z);

const rotate = false;
const camera_offset = { x: 500, y: 500, z: 500 };
const camera_speed = 1;

setAnimateCallback(function ({ time }) {
  if (rotate) {
    camera.position.x =
      tableTop.position.x + camera_offset.x * Math.sin(time * camera_speed);
    camera.position.z =
      tableTop.position.z + camera_offset.z * Math.cos(time * camera_speed);
    camera.position.y = tableTop.position.y + camera_offset.y;
    camera.lookAt(
      tableTop.position.x,
      tableTop.position.y,
      tableTop.position.z
    );
  }
});

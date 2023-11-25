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
  ENCLOSURE_HEIGHT,
  ENCLOSURE_FOAM_THICKNESS,
  ENCLOSURE_WALL_THICKNESS,
  ENCLOSURE_SOUND_INSULATOR_THICKNESS,
  ENCLOSURE_DOOR_THICKNESS,
  SMALL_VIGA_SIZE_DEPTH,
} from "./consts";
import { init } from "./threeConfig";
import { ShapeMakerSpecific } from "./makers";
import { constraints } from "./constraints";
import { render } from "solid-js/web";
import { Control } from "./control";

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
  color: "red",
});

const bigViga2 = shapeMaker.viga({
  height: TABLE_WIDTH,
  name: "bigViga2",
});

const viga1 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga1",
  color: "green",
});
const viga2 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga2",
});
// make 4 others vigas
const viga5 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga5",
});
const viga6 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga6",
});
const viga7 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga7",
});

const vigasTop = [viga1, viga2, bigViga1, bigViga2, viga5, viga6, viga7];

const viga8 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga8",
});
const viga9 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga9",
  // dimensions: true,
});
const viga10 = shapeMaker.viga({
  height: TABLE_WIDTH,
  name: "viga10",
});
const viga11 = shapeMaker.viga({
  height: TABLE_WIDTH,
  name: "viga11",
});
const viga12 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga12",
});
const viga13 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga13",
});
const viga14 = shapeMaker.viga({
  height: SMALL_VIGA_SIZE_DEPTH,
  name: "viga14",
  // dimensions: true,
});

const vigasBottom = [viga8, viga9, viga10, viga11, viga12, viga13, viga14];

// enclosure
shapeMaker.newRow();

const enclosureThicknessWithoutInnerWall =
  ENCLOSURE_FOAM_THICKNESS +
  ENCLOSURE_SOUND_INSULATOR_THICKNESS +
  ENCLOSURE_WALL_THICKNESS;
const innerLateralEnclosureDepth =
  TABLE_DEPTH - enclosureThicknessWithoutInnerWall - ENCLOSURE_DOOR_THICKNESS;
const innerLateralEnclosureWallHeight =
  ENCLOSURE_HEIGHT - enclosureThicknessWithoutInnerWall;

const enclosureWallInnerRight = shapeMaker.enclosureWall({
  height: innerLateralEnclosureWallHeight,
  width: innerLateralEnclosureDepth,
  name: "enclosureWallInnerRight",
  dimensions: true,
  color: "yellow",
});

const enclosureWallInnerLeft = shapeMaker.enclosureWall({
  height: innerLateralEnclosureWallHeight,
  width: innerLateralEnclosureDepth,
  name: "enclosureWallInnerLeft",
});
const enclosureWallInnerTopWidth =
  TABLE_WIDTH - 2 * enclosureThicknessWithoutInnerWall;

const enclosureWallInnerTop = shapeMaker.enclosureWall({
  height: innerLateralEnclosureDepth,
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

const enclosureDoorDraft = shapeMaker.makeShape({
  height: ENCLOSURE_HEIGHT,
  depth: ENCLOSURE_DOOR_THICKNESS,
  width: TABLE_WIDTH,
  name: "enclosureDoorDraft",
  color: "darkgreen",
  opacity: 0.5,
});
const enclouseOuterDepth = TABLE_DEPTH - ENCLOSURE_DOOR_THICKNESS;

const enclosureWallOuterLeft = shapeMaker.enclosureWall({
  height: ENCLOSURE_HEIGHT,
  width: enclouseOuterDepth,
  name: "enclosureWallOuterLeft",
  color: "black",
  opacity: 0.8,
});
const enclosureWallOuterRight = shapeMaker.enclosureWall({
  height: ENCLOSURE_HEIGHT,
  width: enclouseOuterDepth,
  name: "enclosureWallOuterRight",
  color: "black",
  opacity: 0.8,
});
const enclosureWallOuterBack = shapeMaker.enclosureWall({
  height: ENCLOSURE_HEIGHT,
  width: TABLE_WIDTH - 2 * ENCLOSURE_WALL_THICKNESS,
  name: "enclosureWallOuterBack",
  color: "black",
  opacity: 0.8,
});
const enclosureWallOuterTop = shapeMaker.enclosureWall({
  height: TABLE_DEPTH,
  width: TABLE_WIDTH,
  name: "enclosureWallOuterTop",
  color: "pink",
  opacity: 0.5,
});

// assemble base
function assembleBase() {
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
    const enclosureInnerY =
      FOOT_HEIGHT + TABLE_TOP_THICKNESS + innerLateralEnclosureWallHeight / 2;
    const enclosureOuterY =
      FOOT_HEIGHT + TABLE_TOP_THICKNESS + ENCLOSURE_HEIGHT / 2;
    const enclosureInnerZ =
      0 -
      TABLE_DEPTH / 2 +
      innerLateralEnclosureDepth / 2 +
      enclosureThicknessWithoutInnerWall;

    enclosureWallInnerRight.rotation.y = THREE.MathUtils.degToRad(90);
    enclosureWallInnerRight.position.x =
      TABLE_WIDTH / 2 -
      enclosureThicknessWithoutInnerWall -
      ENCLOSURE_WALL_THICKNESS / 2;
    enclosureWallInnerRight.position.y = enclosureInnerY;
    enclosureWallInnerRight.position.z = enclosureInnerZ;

    enclosureWallInnerLeft.rotation.y = THREE.MathUtils.degToRad(90);
    enclosureWallInnerLeft.position.x =
      0 -
      TABLE_WIDTH / 2 +
      enclosureThicknessWithoutInnerWall +
      ENCLOSURE_WALL_THICKNESS / 2;
    enclosureWallInnerLeft.position.y = enclosureInnerY;
    enclosureWallInnerLeft.position.z = enclosureInnerZ;

    // enclosureWallInnerTop.rotation.y = THREE.MathUtils.degToRad(90);
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

    // enclosureWallInnerBack.rotation.y = THREE.MathUtils.degToRad(90);
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

    enclosureDoorDraft.rotation.x = THREE.MathUtils.degToRad(90);
    enclosureDoorDraft.rotateOnAxis(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(90)
    );
    enclosureDoorDraft.position.x = 0;
    enclosureDoorDraft.position.y = enclosureOuterY;
    enclosureDoorDraft.position.z =
      0 + TABLE_DEPTH / 2 - ENCLOSURE_DOOR_THICKNESS / 2;

    enclosureWallOuterLeft.rotation.y = THREE.MathUtils.degToRad(90);
    enclosureWallOuterLeft.position.x =
      0 - TABLE_WIDTH / 2 + ENCLOSURE_WALL_THICKNESS / 2;
    enclosureWallOuterLeft.position.y = enclosureOuterY;
    enclosureWallOuterLeft.position.z =
      0 - TABLE_DEPTH / 2 + enclouseOuterDepth / 2;

    enclosureWallOuterRight.rotation.y = THREE.MathUtils.degToRad(90);
    enclosureWallOuterRight.position.x =
      0 + TABLE_WIDTH / 2 - ENCLOSURE_WALL_THICKNESS / 2;
    enclosureWallOuterRight.position.y = enclosureOuterY;
    enclosureWallOuterRight.position.z =
      0 - TABLE_DEPTH / 2 + enclouseOuterDepth / 2;

    enclosureWallOuterBack.rotation.x = THREE.MathUtils.degToRad(90);
    enclosureWallOuterBack.rotateOnAxis(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(90)
    );
    enclosureWallOuterBack.position.x = 0;
    enclosureWallOuterBack.position.y = enclosureOuterY;
    enclosureWallOuterBack.position.z =
      0 - TABLE_DEPTH / 2 + ENCLOSURE_WALL_THICKNESS / 2;

    enclosureWallOuterTop.rotation.x = THREE.MathUtils.degToRad(90);
    enclosureWallOuterTop.position.x = 0;
    enclosureWallOuterTop.position.y = enclosureOuterY + ENCLOSURE_HEIGHT / 2;
    enclosureWallOuterTop.position.z = 0;
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

// @ts-ignore
globalThis.dimensions = () => {
  const r = constraints({
    viga1,
    tableTop,
    enclosureWallInnerBack,
    enclosureWallInnerRight,
    enclosureWallInnerLeft,
    enclosureWallOuterLeft,
    enclosureWallOuterRight,
    enclosureDoorDraft,
  });
  console.log(r);
  let output = "";
  for (const key in r) {
    // @ts-ignore
    const value: any = r[key] as any;
    output += `${key}: ${value}<br />`;
  }
  const div = document.getElementById("dimensions");
  if (div) div.innerHTML = output;
};
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

const legs = new THREE.Group();
scene.add(legs);
legs.add(foot1);
legs.add(foot2);
legs.add(foot3);
legs.add(foot4);

const socle1 = new THREE.Group();
vigasTop.forEach((viga) => socle1.add(viga));
scene.add(socle1);

const socle2 = new THREE.Group();
vigasBottom.forEach((viga) => socle2.add(viga));
scene.add(socle2);

const enclosureInner = new THREE.Group();
enclosureInner.add(enclosureWallInnerBack);
enclosureInner.add(enclosureWallInnerRight);
enclosureInner.add(enclosureWallInnerLeft);
enclosureInner.add(enclosureWallInnerTop);
scene.add(enclosureInner);

const enclosureOuter = new THREE.Group();
enclosureOuter.add(enclosureWallOuterLeft);
enclosureOuter.add(enclosureWallOuterRight);
enclosureOuter.add(enclosureWallOuterTop);
enclosureOuter.add(enclosureWallOuterBack);
enclosureOuter.add(enclosureDoorDraft);
scene.add(enclosureOuter);

render(
  () => (
    <Control
      legs={legs}
      socle1={socle1}
      socle2={socle2}
      enclosureOuter={enclosureOuter}
      enclosureInner={enclosureInner}
      tableTop={tableTop}
    />
  ),
  document.getElementById("controls") as HTMLElement
);

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
} from "./consts";
import { ShapeMaker } from "./shapeMaker";
import { init } from "./threeConfig";

const shapeMaker = new ShapeMaker();
const { scene, camera, setAnimateCallback } = init();
const makeFoot = ({
  color,
  dimensions,
}: {
  color?: string;
  dimensions?: boolean;
}) => {
  return shapeMaker.makeShape({
    height: FOOT_HEIGHT,
    width: FOOT_WIDTH,
    depth: FOOT_DEPTH,
    scene,
    color,
    dimensions,
  });
};

const makeViga = ({
  height,
  color,
  dimensions,
}: {
  height: number;
  color?: string;
  dimensions?: boolean;
}) => {
  return shapeMaker.makeShape({
    height,
    width: VIGA_WIDTH,
    depth: VIGA_HEIGHT,
    scene,
    color,
    dimensions,
  });
};

const tableTop = shapeMaker.makeShape({
  height: TABLE_TOP_THICKNESS,
  width: TABLE_WIDTH,
  depth: TABLE_DEPTH,
  scene,
  dimensions: true,
});

const foot1 = makeFoot({});
const foot2 = makeFoot({});
const foot3 = makeFoot({});
const foot4 = makeFoot({
  dimensions: true,
});
shapeMaker.newRow();
const bigViga1 = makeViga({
  height: TABLE_WIDTH,
});

const bigViga2 = makeViga({
  height: TABLE_WIDTH,
});

const viga8 = makeViga({
  height: TABLE_WIDTH,
});
const viga9 = makeViga({
  height: TABLE_WIDTH,
  dimensions: true,
});
const viga1 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});
const viga2 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});
// make 4 others vigas
const viga5 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});
const viga6 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});
const viga7 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});

const vigasTop = [viga1, viga2, bigViga1, bigViga2, viga5, viga6, viga7];

const viga10 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});
const viga11 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});
const viga12 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});
const viga13 = makeViga({
  height: SMALL_VIGA_HEIGHT,
});
const viga14 = makeViga({
  height: SMALL_VIGA_HEIGHT,
  dimensions: true,
});

const vigasBottom = [viga8, viga9, viga10, viga11, viga12, viga13, viga14];

camera.lookAt(tableTop.position.x, tableTop.position.y, tableTop.position.z);

// assemble base
function assembleBase(animFactor = 0) {
  function tableTopPosition() {
    tableTop.rotation.z = 0;
    tableTop.position.x = 0;
    tableTop.position.y = FOOT_HEIGHT + TABLE_TOP_THICKNESS / 2;
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
      console.log(y + FOOT_HEIGHT);
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

      const bbox = new THREE.Box3().setFromObject(viga);
      console.log(bbox.min.y, bbox.max.y);
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

  // Turn on the lights
  const light = new THREE.PointLight("blue", 1, 0);
  light.castShadow = true;
  light.position.set(0, 100, 0);
  scene.add(light);

  tableTopPosition();
  feetPosition();
  vigasPlane(vigasTop, { y: 0 });
  vigasPlane(vigasBottom, { y: -50 });

  const axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);
}

// assembleBase();

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

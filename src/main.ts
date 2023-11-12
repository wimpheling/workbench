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
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
type MakeShapeProps = {
  x: number;
  y: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  scene: THREE.Scene;
  color?: string;
  dimensions?: boolean;
};
const makeShape = ({
  x,
  y,
  z,
  height,
  width,
  depth,
  color,
  scene,
  dimensions,
}: MakeShapeProps) => {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshBasicMaterial({ color: color || 0xa1662f });
  // const material = new THREE.MeshLambertMaterial({ color: color || 0xa1662f });
  const mesh = new THREE.Mesh(geometry, material);

  // line
  const edges = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(width, height, depth)
  );
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: "black" })
  );
  line.castShadow = true;
  line.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh);
  group.add(line);
  group.position.set(x, y, z);

  if (dimensions) {
    createLabel({
      label: `${width * 10} mm`,
      x: width / 2,
      y: 0,
      z: 0,
    });
    createLabel({
      label: `${height * 10} mm`,
      x: 0,
      y: height / 2,
      z: 0,
    });
    createLabel({
      label: `${depth * 10} mm`,
      x: 0,
      y: 0 - height / 2,
      z: depth / 2,
    });
  }
  scene.add(group);
  return group;

  function createLabel({
    label,
    x,
    y,
    z,
  }: {
    label: string;
    x: number;
    y: number;
    z: number;
  }) {
    const labelDiv = document.createElement("div");
    labelDiv.className = "label";
    labelDiv.textContent = label;
    labelDiv.style.backgroundColor = "transparent";
    labelDiv.style.color = "red";

    const cssObject = new CSS2DObject(labelDiv);
    cssObject.position.set(x, y, z);
    cssObject.center.set(0, 1);
    group.add(cssObject);
    cssObject.layers.set(0);
  }
};

class ShapeMaker {
  xCounter = 0;

  makeShape(props: Omit<MakeShapeProps, "x" | "y" | "z">) {
    const shape = makeShape({ ...props, x: this.xCounter, y: 0, z: 0 });
    this.xCounter += props.width + 5;
    if (props.dimensions) {
      this.xCounter += 35;
    }
    return shape;
  }
}

const shapeMaker = new ShapeMaker();

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

const scene = new THREE.Scene();
scene.background = new THREE.Color("black");
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
const controls = new OrbitControls(camera, renderer.domElement);
const loadControls = () => {
  const stateJSON = localStorage.getItem(`orbitControls`);

  if (stateJSON) {
    console.log({ stateJSON });
    const { target0, position0, zoom0 } = JSON.parse(stateJSON);
    controls.target0.copy(target0);
    controls.position0.copy(position0);
    controls.zoom0 = zoom0;
    controls.reset();
  }
};

const saveControls = () => {
  controls.saveState();
  const { target0, position0, zoom0 } = controls;
  const state = { target0, position0, zoom0 };
  console.log({ state: JSON.stringify(state) });
  localStorage.setItem(`orbitControls`, JSON.stringify(state));
};
// @ts-ignore
globalThis.saveControls = saveControls;
// @ts-ignore
globalThis.loadControls = loadControls;

document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0px";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);

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

camera.position.z = 500;
camera.position.y = 500;
camera.position.x = 500;
camera.lookAt(tableTop.position.x, tableTop.position.y, tableTop.position.z);
let time = 0;
const clock = new THREE.Clock();
const camera_offset = { x: 500, y: 500, z: 500 };
const camera_speed = 1;

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

// controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
// controls.dampingFactor = 0.05;

// controls.screenSpacePanning = false;

// controls.minDistance = 100;
// controls.maxDistance = 500;

// controls.maxPolarAngle = Math.PI / 2;
controls.update();
const rotate = false;
function animate() {
  requestAnimationFrame(animate);
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;

  clock.getDelta();
  time = parseFloat(clock.elapsedTime.toFixed(2));

  // tableTop.mesh.rotation.x += 0.01;
  // tableTop.mesh.rotation.y += 0.01;
  // tableTop.line.rotation.x += 0.01;
  // tableTop.line.rotation.y += 0.01;

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
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();
loadControls();

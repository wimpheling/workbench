import * as THREE from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function init() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5faf6);
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.z = 500;
  camera.position.y = 500;
  camera.position.x = 500;

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

  controls.update();
  const rotate = false;

  let time = 0;
  const clock = new THREE.Clock();

  let animateCallback: (args: { time: number }) => void | undefined;
  const setAnimateCallback = (callback: typeof animateCallback) => {
    animateCallback = callback;
  };
  function animate() {
    requestAnimationFrame(animate);
    clock.getDelta();
    time = parseFloat(clock.elapsedTime.toFixed(2));

    if (animateCallback) {
      animateCallback({ time });
    }
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  animate();
  loadControls();

  return { scene, camera, setAnimateCallback };
}

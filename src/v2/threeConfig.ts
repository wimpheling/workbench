import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function init() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5faf6);
  const camera = new THREE.PerspectiveCamera(
    55,
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
  const loadControls: () => void = () => {
    const stateJSON = localStorage.getItem(`orbitControls`);

    if (stateJSON) {
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
    localStorage.setItem(`orbitControls`, JSON.stringify(state));
  };

  const light = new THREE.AmbientLight("white", 1);
  // const light = new THREE.PointLight("blue", 1, 0);
  light.castShadow = true;
  light.position.set(0, 100, 0);
  scene.add(light);

  document.body.appendChild(renderer.domElement);
  controls.update();

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
  }
  animate();
  loadControls();

  return {
    scene,
    camera,
    setAnimateCallback,
    loadControls,
    saveControls,
    renderer,
  };
}

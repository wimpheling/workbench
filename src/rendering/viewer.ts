import {
  AmbientLight,
  DirectionalLight,
  Box3,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Vector3,
  type Object3D,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type ThreeViewer = { render: () => void; dispose: () => void };

export function mountThreeViewer(canvas: HTMLCanvasElement, model: Object3D): ThreeViewer {
  const scene = new Scene();
  scene.background = null;
  scene.add(model);
  scene.add(new AmbientLight(0xffffff, 1.5));
  const light = new DirectionalLight(0xffffff, 2);
  light.position.set(100, 150, 200);
  scene.add(light);
  const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
  const bounds = new Box3().setFromObject(model);
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const radius = Math.max(size.x, size.y, size.z) / 2;
  const distance = Math.max(radius * 2.5, 100);
  camera.position.set(center.x + distance, center.y + distance * 0.8, center.z + distance);
  camera.near = Math.max(0.1, distance / 100);
  camera.far = distance * 4;
  camera.lookAt(center);
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.minDistance = Math.max(radius * 0.15, 10);
  controls.maxDistance = Math.max(radius * 12, 1000);
  controls.update();
  const render = () => renderer.render(scene, camera);
  controls.addEventListener("change", render);
  const resize = () => {
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 480;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  const dispose = () => {
    resizeObserver.disconnect();
    controls.removeEventListener("change", render);
    controls.dispose();
    model.traverse((object) => {
      const mesh = object as Object3D & {
        geometry?: { dispose: () => void };
        material?: { dispose: () => void } | Array<{ dispose: () => void }>;
      };
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
      else mesh.material?.dispose();
    });
    renderer.dispose();
  };
  return { render, dispose };
}

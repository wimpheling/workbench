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

export function mountThreeViewer(canvas: HTMLCanvasElement, model: Object3D): () => void {
  const scene = new Scene();
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
  const resize = () => {
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 480;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  };
  resize();
  window.addEventListener("resize", resize);
  return () => {
    window.removeEventListener("resize", resize);
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
}

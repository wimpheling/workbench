import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
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
  camera.position.set(220, 180, 260);
  camera.lookAt(60, 50, -40);
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

import { createEffect, on, onCleanup, onMount } from "solid-js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Evaluation } from "./api";
export default function Viewer(props: {
  result?: Evaluation;
  roof: boolean;
  walls: boolean;
  references: boolean;
  selected: string;
  onSelect: (id: string) => void;
}) {
  let host!: HTMLDivElement;
  let scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    group: THREE.Group;
  let fitted = false;
  let frame = 0;
  const colors: Record<string, string> = {
    extrusion: "#a6bbc1",
    panel: "#d9bd90",
    glass: "#8bc3ce",
    hardware: "#48595d",
    "machine-envelope": "#d39350",
    "hose-envelope": "#a89bd2",
  };
  function refresh() {
    if (!group) return;
    for (const child of group.children.slice()) {
      group.remove(child);
      const mesh = child as THREE.Mesh;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    const result = props.result;
    if (!result) return;
    const parts = new Map(result.model.parts.map((p) => [p.id, p]));
    for (const data of result.meshes) {
      const part = parts.get(data.id);
      if (!part) continue;
      const reference = part.category.endsWith("-envelope") || part.physical === false;
      if (reference && !props.references) continue;
      if (!props.roof && /roof|top-panel/.test(part.id)) continue;
      if (
        !props.walls &&
        ["panel", "glass"].includes(part.category) &&
        !/door|front-left|front-right|left-rear|back-right/.test(`${part.assembly} ${part.id}`)
      )
        continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(data.positions, 3));
      geometry.setIndex(data.indices);
      geometry.computeVertexNormals();
      const transparent = reference || part.category === "glass";
      const material = new THREE.MeshStandardMaterial({
        color:
          props.selected === part.id
            ? "#f6c85f"
            : /rubber|epdm/i.test(part.material)
              ? "#28312d"
              : (colors[part.category] ?? "#7d9792"),
        metalness: part.category === "extrusion" ? 0.5 : 0.05,
        roughness: 0.58,
        transparent,
        opacity: reference ? 0.12 : part.category === "glass" ? 0.28 : 1,
        depthWrite: !transparent,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.id = part.id;
      group.add(mesh);
    }
    if (!fitted && group.children.length) {
      fit();
      fitted = true;
    }
  }
  function fit() {
    if (!group.children.length) return;
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z, 100);
    camera.position.copy(center).add(new THREE.Vector3(span * 1.25, -span * 1.55, span * 1.1));
    // Millimetre-scale near clipping preserves depth precision between thin
    // panel faces and seals when viewing the metre-scale assembly.
    camera.near = Math.max(1, span / 200);
    camera.far = span * 40;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
  }
  onMount(() => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#e9eeeb");
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100000);
    camera.up.set(0, 0, 1);
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      host.textContent =
        "3D preview is unavailable on this device. Validation and supplier files remain available.";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.HemisphereLight("#ffffff", "#718582", 2.6));
    const sun = new THREE.DirectionalLight("#fff9e9", 3);
    sun.position.set(1500, -2000, 3500);
    scene.add(sun);
    group = new THREE.Group();
    scene.add(group);
    const grid = new THREE.GridHelper(5000, 50, "#a4b6ae", "#d1dcd5");
    grid.rotateX(Math.PI / 2);
    grid.position.z = -45;
    scene.add(grid);
    const resize = new ResizeObserver(() => {
      const w = host.clientWidth,
        h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resize.observe(host);
    let down = [0, 0];
    const pointerDown = (event: PointerEvent) => {
      down = [event.clientX, event.clientY];
    };
    const pick = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = ray
        .intersectObjects(group.children)
        .find(
          (hit) =>
            (hit.object as THREE.Mesh).material instanceof THREE.MeshStandardMaterial &&
            ((hit.object as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity > 0.15,
        );
      props.onSelect(hit?.object.userData.id ?? "");
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pick);
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    refresh();
    onCleanup(() => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pick);
      for (const child of group.children) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    });
  });
  createEffect(
    on(
      [
        () => props.result,
        () => props.roof,
        () => props.walls,
        () => props.references,
        () => props.selected,
      ],
      () => refresh(),
    ),
  );
  return (
    <div class="viewer">
      <div
        ref={(element) => {
          host = element;
        }}
        class="canvas"
        aria-label="Interactive enclosure model"
      />
      <div class="viewer-tools">
        <span>FRONT · Y = 0</span>
        <button onClick={fit}>Fit view</button>
      </div>
      <div class="viewer-help">Drag to orbit · Scroll to zoom · Click a part to inspect</div>
    </div>
  );
}

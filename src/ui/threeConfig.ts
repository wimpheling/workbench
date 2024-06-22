import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DisposableItem } from "./interfaces";

export function init(
  onSelectCallback: (params?: {
    groupName: string;
    vector: THREE.Vector3;
    position: THREE.Vector3;
  }) => void
) {
  const itemsToDispose: DisposableItem[] = [];
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

  const raycaster = new THREE.Raycaster();
  raycaster.layers.enableAll();
  const pointer = new THREE.Vector2();
  const renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  const controls = new OrbitControls(camera, renderer.domElement);
  itemsToDispose.push(controls);
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
  // light.castShadow = true;
  light.position.set(0, 100, 0);
  itemsToDispose.push(light);
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
  renderer.domElement.addEventListener("mousemove", onPointerMove, false);
  let intersectState:
    | {
        object: THREE.LineSegments;
        color: string;
      }
    | undefined;
  function onPointerMove(event: MouseEvent) {
    event.preventDefault();
    pointer.x = (event.offsetX / renderer.domElement.clientWidth) * 2 - 1;
    pointer.y = -(event.offsetY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const meshes: THREE.Mesh[] = [];
    function findMeshesInSceneChildrenRecursively(children: THREE.Object3D[]) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        } else {
          findMeshesInSceneChildrenRecursively(child.children);
        }
      }
    }
    findMeshesInSceneChildrenRecursively(scene.children);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const intersect = intersects.find((intersect) => {
        const parentGroup = intersect.object.parent as THREE.Group;
        const parentParentGroup = parentGroup.parent as THREE.Group;
        return parentParentGroup.visible;
      });
      if (!intersect) {
        onSelectCallback();
        if (intersectState) {
          // @ts-ignore
          intersectState.object.material.color.set(intersectState.color);
          intersectState = undefined;
        }
        return;
      }
      const parentGroup = intersect.object.parent as THREE.Group;
      const lineChild = parentGroup.children[1] as THREE.LineSegments;
      if (lineChild && lineChild !== intersectState?.object) {
        if (intersectState) {
          // @ts-ignore
          intersectState.object.material.color.set(intersectState.color);
        }
        intersectState = {
          object: lineChild,
          // @ts-ignore
          color: lineChild.material.color.getHex(),
        };
        // @ts-ignore
        lineChild.material.color.set("red");
        const bbox = new THREE.Box3().setFromObject(lineChild);
        const vector = new THREE.Vector3();
        bbox.getSize(vector);
        const positionVector = new THREE.Vector3();
        bbox.getCenter(positionVector);
        onSelectCallback({
          groupName: parentGroup.name,
          vector,
          position: positionVector,
        });
      }
    } else {
      onSelectCallback();
      if (intersectState) {
        // @ts-ignore
        intersectState.object.material.color.set(intersectState.color);
        intersectState = undefined;
      }
    }
  }

  return {
    scene,
    camera,
    setAnimateCallback,
    loadControls,
    saveControls,
    renderer,
    itemsToDispose,
  };
}

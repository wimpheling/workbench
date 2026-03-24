import * as THREE from 'three';
import { ViewportGizmo } from 'three-viewport-gizmo';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { DisposableItem } from './interfaces';

export function init(
  onSelectCallback: (params?: {
    groupName: string;
    vector: THREE.Vector3;
    position: THREE.Vector3;
  }) => void,
  onDoorClickCallback?: (doorName: string) => void,
  lightingMode: 'directional' | 'ambient' = 'directional'
) {
  const itemsToDispose: DisposableItem[] = [];
  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xf5faf6);
  scene.background = new THREE.Color(0x202020);
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

  camera.position.z = 500;
  camera.position.y = 500;
  camera.position.x = 500;

  const raycaster = new THREE.Raycaster();
  raycaster.layers.enableAll();
  const pointer = new THREE.Vector2();
  const renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Create environment map for reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x888888);

  // Add gradient lights for environment reflections
  const envLight1 = new THREE.PointLight(0xffffff, 500);
  envLight1.position.set(100, 100, 100);
  envScene.add(envLight1);

  const envLight2 = new THREE.PointLight(0xffffff, 500);
  envLight2.position.set(-100, 100, -100);
  envScene.add(envLight2);

  const envLight3 = new THREE.PointLight(0xffffff, 300);
  envLight3.position.set(0, -100, 0);
  envScene.add(envLight3);

  const envMap = pmremGenerator.fromScene(envScene).texture;
  scene.environment = envMap;
  itemsToDispose.push(envMap);
  pmremGenerator.dispose();

  const viewportGizmo = new ViewportGizmo(camera, renderer, {});
  const controls = new OrbitControls(camera, renderer.domElement);

  // listeners
  viewportGizmo.addEventListener('start', () => {
    controls.enabled = false;
  });
  viewportGizmo.addEventListener('end', () => {
    controls.enabled = true;
  });

  controls.addEventListener('change', () => {
    viewportGizmo.update();
  });

  itemsToDispose.push(controls);
  const loadControls: () => void = () => {
    const stateJSON = localStorage.getItem('orbitControls');

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
    localStorage.setItem('orbitControls', JSON.stringify(state));
  };

  // Lighting setup based on mode
  if (lightingMode === 'ambient') {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    itemsToDispose.push(ambientLight);
  } else {
    // Directional lighting with enhanced shadows
    const light = new THREE.DirectionalLight(0xffffff, 2);
    scene.add(light);

    const helper = new THREE.DirectionalLightHelper(light, 5);
    scene.add(helper);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 2000;
    light.shadow.bias = -0.0001;
    light.position.set(500, 1000, 500);
    itemsToDispose.push(light);
    scene.add(light);

    // Add fill light from opposite direction
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-300, 500, -300);
    scene.add(fillLight);
    itemsToDispose.push(fillLight);

    // Add rim light for edge highlights
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -200, 500);
    scene.add(rimLight);
    itemsToDispose.push(rimLight);
  }
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);
  document.body.appendChild(renderer.domElement);
  controls.update();
  viewportGizmo.target = controls.target;
  viewportGizmo.render();

  let time = 0;
  const clock = new THREE.Clock();

  let animateCallback: (args: { time: number }) => void;
  const setAnimateCallback = (callback: typeof animateCallback) => {
    animateCallback = callback;
  };
  function animate() {
    requestAnimationFrame(animate);
    clock.getDelta();
    time = Number.parseFloat(clock.elapsedTime.toFixed(2));

    if (animateCallback) {
      animateCallback({ time });
    }
    controls.update();
    renderer.render(scene, camera);
    viewportGizmo.render();
  }
  animate();
  loadControls();
  renderer.domElement.addEventListener('mousemove', onPointerMove, false);
  renderer.domElement.addEventListener('click', onPointerClick, false);
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
      for (const child of children) {
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
          // @ts-expect-error color does not exist ?
          intersectState.object.material.color.set(intersectState.color);
          intersectState = undefined;
        }
        return;
      }
      const parentGroup = intersect.object.parent as THREE.Group;
      const lineChild = parentGroup.children[1] as THREE.LineSegments;
      if (lineChild && lineChild !== intersectState?.object) {
        if (intersectState) {
          // @ts-expect-error color does not exist ?
          intersectState.object.material.color.set(intersectState.color);
        }
        intersectState = {
          object: lineChild,
          // @ts-expect-error color does not exist ?
          color: lineChild.material.color.getHex(),
        };
        // @ts-expect-error color does not exist ?
        lineChild.material.color.set('red');
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
        // @ts-expect-error color does not exist ?
        intersectState.object.material.color.set(intersectState.color);
        intersectState = undefined;
      }
    }
  }

  function onPointerClick(event: MouseEvent) {
    if (!onDoorClickCallback) return;
    event.preventDefault();
    pointer.x = (event.offsetX / renderer.domElement.clientWidth) * 2 - 1;
    pointer.y = -(event.offsetY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const intersect = intersects[0];
      let obj: THREE.Object3D | null = intersect.object;
      let doorName: string | null = null;
      while (obj) {
        const parent: THREE.Object3D | null = obj.parent;
        if (parent && parent.name === 'Doors') {
          doorName = obj.name?.replace('_pivot', '') || null;
          if (doorName) {
            onDoorClickCallback(doorName);
          }
          break;
        }
        obj = parent;
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

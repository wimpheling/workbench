import * as THREE from "three";
import { Piece } from "./AbstractShapeMaker";
import { onMount } from "solid-js";

export const TechDraw = (props: { piece: Piece }) => {
  let d: HTMLDivElement | undefined;
  onMount(() => {
    const { piece } = props;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("white");
    const canvasWidth = piece.width * 2;
    const canvasHeight = piece.height * 2;
    const camera = new THREE.OrthographicCamera(
      -canvasWidth / 2,
      canvasWidth / 2,
      canvasHeight / 2,
      -canvasHeight / 2,
      1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasWidth, canvasHeight);

    const ambientLight = new THREE.AmbientLight("white", 1);
    scene.add(ambientLight);

    // const light = new THREE.DirectionalLight("white", 0.8);
    // light.position.set(1, 1, 1);
    // scene.add(light);

    const group = new THREE.Group();
    scene.add(group);
    const edges = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(piece.width, piece.height, piece.depth)
    );
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: "black",
        opacity: 1,
      })
    );
    const material = new THREE.MeshBasicMaterial({
      color: "white",
      transparent: true,
      opacity: 1,
    });
    const geometry = new THREE.BoxGeometry(
      piece.width,
      piece.height,
      piece.depth
    );
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    group.add(line);
    // group.rotation.z = THREE.MathUtils.degToRad(0);
    group.rotateOnAxis(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(-5)
    );
    group.rotateOnAxis(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(5));
    group.rotateOnAxis(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(-1)
    );

    const center = new THREE.Vector3(),
      size = new THREE.Vector3(),
      box = new THREE.Box3().setFromObject(group);

    box.getCenter(center);
    box.getSize(size);

    // function to set the camera
    //		dx, dy, dz - direction from the group center
    //		width and height of the group from that direction

    function adjustCamera(
      dx: number,
      dy: number,
      dz: number,
      width: number,
      height: number
    ) {
      // set the camera in respect to the group center
      camera.position.set(
        center.x + dx * size.x,
        center.y + dy * size.y,
        center.z + dz * size.z
      );

      // turn the camera towards the group center
      camera.lookAt(center.x, center.y, center.z);

      // zoom the camera as to fit the group in the window
      camera.zoom = Math.min(canvasHeight / height, canvasWidth / width);

      // update the camera projection matrix
      camera.updateProjectionMatrix();

      // draw the scene
      renderer.render(scene, camera);
    }
    adjustCamera(0, 0, 1, size.x, size.y);
    renderer.render(scene, camera);

    d?.appendChild(renderer.domElement);
  });

  return (
    <span
      style={{
        width: `${props.piece.width * 2}px`,
        height: `${props.piece.height * 2}px`,
      }}
      ref={d}
    />
  );
};

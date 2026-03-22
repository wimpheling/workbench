import * as THREE from "three";
import { Piece } from "../lib/AbstractShapeMaker";
import { onMount } from "solid-js";
import { getGeometry } from "../lib/pieceHelpers";
import { syncGeometries } from "replicad-threejs-helper";

export const TechDraw = ({
  piece,
  renderer,
}: {
  piece: Piece;
  renderer: THREE.WebGLRenderer;
}) => {
  let drx: HTMLDivElement | undefined;
  
  onMount(() => {
    let shape = getGeometry(piece);
    if (piece.geometry.postProcess) {
      shape = piece.geometry.postProcess(shape);
    }
    const shapeItem = {
      name: piece.name,
      faces: shape.mesh({ tolerance: 0.05, angularTolerance: 30 }),
      edges: shape.meshEdges(),
    };

    const geometries = syncGeometries([shapeItem], []);
    const geo = geometries[0];
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("white");
    
    const group = new THREE.Group();
    scene.add(group);
    
    const material = new THREE.MeshBasicMaterial({
      color: "white",
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geo.faces, material);
    group.add(mesh);
    
    const line = new THREE.LineSegments(
      geo.lines,
      new THREE.LineBasicMaterial({
        color: "black",
        opacity: 1,
      }),
    );
    group.add(line);
    
    // Rotate for a better view
    group.rotateOnAxis(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(-5),
    );
    group.rotateOnAxis(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(5));
    group.rotateOnAxis(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(-1),
    );

    const center = new THREE.Vector3(),
      size = new THREE.Vector3(),
      box = new THREE.Box3().setFromObject(group);

    box.getCenter(center);
    box.getSize(size);
    
    const width = size.multiplyScalar(1.2);
    const canvasWidth = width.x * 2;
    const canvasHeight = width.y * 2;
    const camera = new THREE.OrthographicCamera(
      -canvasWidth / 2,
      canvasWidth / 2,
      canvasHeight / 2,
      -canvasHeight / 2,
      1,
      1000,
    );

    renderer.setSize(canvasWidth, canvasHeight);

    const ambientLight = new THREE.AmbientLight("white", 1);
    scene.add(ambientLight);

    // function to set the camera
    function adjustCamera(
      dx: number,
      dy: number,
      dz: number,
      w: number,
      h: number,
    ) {
      // set the camera in respect to the group center
      camera.position.set(
        center.x + dx * size.x,
        center.y + dy * size.y,
        center.z + dz * size.z,
      );

      // turn the camera towards the group center
      camera.lookAt(center.x, center.y, center.z);

      // zoom the camera as to fit the group in the window
      camera.zoom = Math.min(canvasHeight / h, canvasWidth / w);

      // update the camera projection matrix
      camera.updateProjectionMatrix();
    }
    adjustCamera(0, 0, 1, size.x, size.y);
    renderer.render(scene, camera);
    const image = renderer.domElement.toDataURL();
    const oImg = document.createElement("img");
    oImg.setAttribute("src", image);
    drx?.appendChild(oImg);
  });

  return <span ref={drx} />;
};

import * as THREE from "three";

import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

type MakeShapeProps = {
  x: number;
  y: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  scene: THREE.Scene;
  color?: string;
  dimensions?: boolean;
  opacity?: number;
  name?: string;
};

const makeShape = ({
  x,
  y,
  z,
  height,
  width,
  depth,
  color,
  scene,
  dimensions,
  opacity = 1,
  name,
}: MakeShapeProps) => {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshLambertMaterial({
    color: color || 0xa1662f,
    opacity,
    transparent: opacity < 1,
    name,
  });
  // const material = new THREE.MeshLambertMaterial({ color: color || 0xa1662f });
  const mesh = new THREE.Mesh(geometry, material);

  // line
  const edges = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(width, height, depth)
  );
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: "black", opacity })
  );
  line.castShadow = true;
  line.receiveShadow = true;

  const group = new THREE.Group();
  if (name) {
    group.name = name;
  }
  group.add(mesh);
  group.add(line);
  group.position.set(x, y, z);

  if (dimensions) {
    createLabel({
      label: `${width * 10} x ${height * 10} x ${depth * 10}mm`,
      x: 0 - width / 2,
      y: 0 + height / 2,
      z: 0,
    });
  }
  scene.add(group);
  return group;

  function createLabel({
    label,
    x,
    y,
    z,
  }: {
    label: string;
    x: number;
    y: number;
    z: number;
  }) {
    const labelDiv = document.createElement("div");
    labelDiv.className = "label";
    labelDiv.textContent = label;
    labelDiv.style.backgroundColor = "transparent";
    labelDiv.style.color = "red";

    const cssObject = new CSS2DObject(labelDiv);
    cssObject.position.set(x, y, z);
    cssObject.center.set(0, 1);
    group.add(cssObject);
    cssObject.layers.set(0);
  }
};

export class ShapeMaker {
  private xCounter = 0;
  private yCounter = 0;
  private maxYForThisRow = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  makeShape(props: Omit<MakeShapeProps, "x" | "y" | "z" | "scene">) {
    const shape = makeShape({
      ...props,
      scene: this.scene,
      x: this.xCounter + props.width / 2,
      y: this.yCounter - props.height / 2,
      z: 0,
    });
    this.xCounter += props.width + 5;
    this.maxYForThisRow = Math.max(this.maxYForThisRow, props.height);
    if (props.dimensions) {
      this.xCounter += 35;
    }
    return shape;
  }
  newRow() {
    this.xCounter = 0;
    console.log(this.maxYForThisRow, "maxYForThisRow");
    this.yCounter -= this.maxYForThisRow + 85;
    this.maxYForThisRow = 0;
  }
}

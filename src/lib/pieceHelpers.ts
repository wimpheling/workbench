import * as THREE from "three";
import { Piece } from "./AbstractShapeMaker";

export function getGeometry(props: Piece): THREE.BufferGeometry {
  if (props.geometry.type === "shape") {
    const sizeJoint = 10;
    const numberOfJoints = 3;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(props.geometry.width, 0);
    shape.lineTo;
    return new THREE.ShapeGeometry(shape);
  }
  return new THREE.BoxGeometry(
    props.geometry.width,
    props.geometry.height,
    props.geometry.depth
  );
}

export function specsKey(props: Piece) {
  if (props.geometry.type === "shape") {
    return `${props.material} TODO`;
  }
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

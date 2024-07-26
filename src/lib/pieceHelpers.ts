import * as THREE from "three";
import { Piece } from "./AbstractShapeMaker";

export function getGeometry(props: Piece): THREE.BufferGeometry {
  if (props.geometry.type === "box") {
    const sizeJoint = 10;
    const numberOfJoints = 3;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // left side
    if (props.geometry.sides.left.joint) {
      const side = props.geometry.sides.left.joint;
      const jointWidth = (props.geometry.width / numberOfJoints) * 2;
      for (let i = 0; i < numberOfJoints; i++) {
        const y = 0 - (i + 1) * side.jointHeight;
        shape.lineTo(0 - jointWidth, 0);
        shape.lineTo(0 - jointWidth, y);
        shape.lineTo(0, y);
        shape.lineTo(0, y + side.jointHeight);
      }
    }
    shape.lineTo(props.geometry.width, 0);
    shape.lineTo;
    return new THREE.ShapeGeometry(shape);
  }
  throw new Error("TODO: shapes not implemented yet");
}

export function specsKey(props: Piece) {
  if (props.geometry.type === "shape") {
    return `${props.material} TODO`;
  }
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

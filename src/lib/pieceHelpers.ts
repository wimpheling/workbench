import * as THREE from "three";
import { Piece } from "./AbstractShapeMaker";

export function getGeometry(props: Piece): THREE.BufferGeometry {
  if (props.geometry.type === "box") {
    const numberOfJoints = 3;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // left side
    if (props.geometry.sides?.left?.joint) {
      const side = props.geometry.sides.left.joint;
      const jointWidth = (props.geometry.width / numberOfJoints);
      console.log({ jointWidth, jointHeight: side.jointHeight, numberOfJoints, width: props.geometry.width });
      const x = 0;
      for (let i = 0; i < numberOfJoints; i++) {
        const y = i * jointWidth;
        shape.lineTo(x - side.jointHeight, y);
        shape.lineTo(x - side.jointHeight, y + jointWidth / 2);
        shape.lineTo(x, y + jointWidth / 2);
        shape.lineTo(x, y + jointWidth);
      }
    } else {
      shape.lineTo(0, props.geometry.width);
    }

    // back side
    if (props.geometry.sides?.back?.joint) {
      const side = props.geometry.sides.back.joint;
      const jointWidth = (props.geometry.height / numberOfJoints) * 2;
      const y = props.geometry.width;
      for (let i = 0; i < numberOfJoints; i++) {
        const x = i * jointWidth;
        shape.lineTo(x, y + side.jointHeight);
        shape.lineTo(x + jointWidth, y + side.jointHeight);
        shape.lineTo(x + jointWidth, y);
        shape.lineTo(x + 2 * jointWidth, y);
      }
    } else {
      shape.lineTo(props.geometry.height, props.geometry.width);
    }

    // right side
    if (props.geometry.sides?.right?.joint) {
      const side = props.geometry.sides.right.joint;
      const jointWidth = (props.geometry.width / numberOfJoints) * 2;
      for (let i = 0; i < numberOfJoints; i++) {
        const y = 0 - (i + 1) * side.jointHeight;
        shape.lineTo(props.geometry.height, y);
        shape.lineTo(props.geometry.height, y + side.jointHeight);
        shape.lineTo(props.geometry.height - jointWidth, y + side.jointHeight);
        shape.lineTo(props.geometry.height - jointWidth, 0);
      }
    } else {
      shape.lineTo(props.geometry.height, 0);
    }

    // front side
    if (props.geometry.sides?.front?.joint) {
      const side = props.geometry.sides.front.joint;
      const jointWidth = (props.geometry.height / numberOfJoints) * 2;
      const y = 0;
      for (let i = 0; i < numberOfJoints; i++) {
        const x = i * jointWidth;
        shape.lineTo(x + jointWidth, y);
        shape.lineTo(x + jointWidth, y + side.jointHeight);
        shape.lineTo(x + 2 * jointWidth, y + side.jointHeight);
        shape.lineTo(x + 2 * jointWidth, y);
      }
    } else {
      shape.lineTo(props.geometry.height, 0);
    }
    return new THREE.ExtrudeGeometry(shape, {
      depth: props.geometry.depth,
    });
  }
  throw new Error("TODO: shapes not implemented yet");
}

export function specsKey(props: Piece) {
  if (props.geometry.type === "shape") {
    return `${props.material} TODO`;
  }
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

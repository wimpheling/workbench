import * as THREE from "three";
import { Piece } from "./AbstractShapeMaker";

export function getGeometry(props: Piece): THREE.BufferGeometry {
  if (props.geometry.type === "box") {
    const numberOfJoints = 3;
    const shape = new THREE.Shape();
    const xCenter = props.geometry.width / 2;
    const yCenter = props.geometry.height / 2;

    if (props.name === "Leg 4") {
      console.log(props.geometry, { xCenter, yCenter }, "leg 4");
    }
    shape.moveTo(0 + xCenter, 0 + yCenter);

    // left side
    if (props.geometry.sides?.left?.joint) {
      const side = props.geometry.sides.left.joint;
      const jointWidth = props.geometry.width / (numberOfJoints + 0.5);
      console.log({
        jointWidth,
        jointHeight: side.jointHeight,
        numberOfJoints,
        width: props.geometry.width,
      });
      const x = 0;
      for (let i = 0; i < numberOfJoints + 1; i++) {
        const y = i * jointWidth;
        console.log({ y });
        shape.lineTo(x - side.jointHeight, y);
        shape.lineTo(x - side.jointHeight, y + jointWidth / 2);
        shape.lineTo(x, y + jointWidth / 2);
        if (i < numberOfJoints) shape.lineTo(x, y + jointWidth);
      }
    } else {
      shape.lineTo(0 - xCenter, 0 + yCenter);
    }

    // back side
    if (props.geometry.sides?.back?.joint) {
    } else {
      shape.lineTo(0 - xCenter, 0 - yCenter);
    }

    // right side
    if (props.geometry.sides?.right?.joint) {
    } else {
      shape.lineTo(0 + xCenter, 0 - yCenter);
    }

    // front side
    if (props.geometry.sides?.front?.joint) {
    } else {
      shape.lineTo(0 + xCenter, 0 + yCenter);
    }
    // return new THREE.BoxGeometry(
    //   props.geometry.width,
    //   props.geometry.height,
    //   props.geometry.depth
    // );
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: props.geometry.depth,
      bevelEnabled: false,
      steps: 2,
    });
    geo.translate(0, 0, -props.geometry.depth / 2);
    return geo;
  }
  throw new Error("TODO: shapes not implemented yet");
}

export function specsKey(props: Piece) {
  if (props.geometry.type === "shape") {
    return `${props.material} TODO`;
  }
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

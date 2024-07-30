import * as THREE from "three";
import { Joint, Piece } from "./AbstractShapeMaker";

function getJointWidthSeries({
  i,
  jointWidth,
  order,
  value,
}: {
  value: number,
  jointWidth: number,
  order: 1 | -1,
  i: number,
}) {
  const valueI = value + i * jointWidth * order;
  return [
    valueI,
    valueI + (jointWidth / 2) * order,
    valueI + (jointWidth / 2) * order,
    valueI + jointWidth * order,
  ];
}


function getJointHeightSeries({
  jointHeight,
  order,
  value,
  male
}: {
  value: number,
  jointHeight: number,
  order: 1 | -1,
  male: boolean
}) {
  return [
    value + (male ? jointHeight * order : 0),
    value + (male ? jointHeight * order : 0),
    value + (male ? 0 : jointHeight * order),
    value + (male ? 0 : jointHeight * order),
  ];
}
function handleJoint({
  joint,
  x,
  y,
  width,
  orientation,
  jointWidthOrder,
  jointHeightOrder,
  shape,
  xCenter,
  yCenter,
}: {
  joint?: Joint;
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
  jointWidthOrder: 1 | -1;
  jointHeightOrder: 1 | -1;
  shape: THREE.Shape;
  xCenter: number;
  yCenter: number;
}) {
  if (joint) {
    const { jointHeight, numberOfJoints, male } = joint;
    const jointWidth = width / (numberOfJoints + 0.5);
    for (let i = 0; i < numberOfJoints + 1; i++) {
      let xs = [];
      let ys = [];
      if (orientation === "horizontal") {
        xs = getJointWidthSeries({ value: x, jointWidth, order: jointWidthOrder, i });
        ys = getJointHeightSeries({ value: y, jointHeight, order: jointHeightOrder, male });
      } else {
        xs = getJointHeightSeries({ value: x, jointHeight, order: jointHeightOrder, male });
        ys = getJointWidthSeries({ value: y, jointWidth, order: jointWidthOrder, i });
      }
      shape.lineTo(xs[0], ys[0]);
      shape.lineTo(xs[1], ys[1]);
      if (i === numberOfJoints && !male) {
        break;
      }
      shape.lineTo(xs[2], ys[2]);
      if (i < numberOfJoints) shape.lineTo(xs[3], ys[3]);
    }
  } else {
    if (orientation === "horizontal") {
      shape.lineTo(x + xCenter * 2 * jointWidthOrder, y);
    } else {
      shape.lineTo(x, y + yCenter * 2 * jointWidthOrder);
    }
  }
}

export function getGeometry(props: Piece): THREE.BufferGeometry {
  if (props.geometry.type === "box") {
    const shape = new THREE.Shape();
    const xCenter = props.geometry.width / 2;
    const yCenter = props.geometry.height / 2;
    shape.moveTo(0 + xCenter, 0 + yCenter);

    // back side
    handleJoint({
      joint: props.geometry.sides?.back?.joint,
      x: 0 + xCenter,
      y: 0 + yCenter,
      width: props.geometry.width,
      shape,
      jointWidthOrder: -1,
      jointHeightOrder: 1,
      orientation: "horizontal",
      xCenter,
      yCenter,
    });

    // left side
    handleJoint({
      joint: props.geometry.sides?.left?.joint,
      x: 0 - xCenter,
      y: 0 + yCenter,
      width: props.geometry.height,
      shape,
      jointWidthOrder: -1,
      jointHeightOrder: -1,
      orientation: "vertical",
      xCenter,
      yCenter,
    });

    // front side
    handleJoint({
      joint: props.geometry.sides?.front?.joint,
      x: 0 - xCenter,
      y: 0 - yCenter,
      width: props.geometry.width,
      shape,
      jointWidthOrder: 1,
      jointHeightOrder: -1,
      orientation: "horizontal",
      xCenter,
      yCenter,
    });

    // right side
    handleJoint({
      joint: props.geometry.sides?.right?.joint,
      x: 0 + xCenter,
      y: 0 - yCenter,
      width: props.geometry.height,
      shape,
      jointWidthOrder: 1,
      jointHeightOrder: 1,
      orientation: "vertical",
      xCenter,
      yCenter,
    });

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: props.geometry.depth,
      bevelEnabled: false,
      steps: 2,
    });
    // center the Z axis
    geo.translate(0, 0, -props.geometry.depth / 2);

    return geo;
  }
  throw new Error("TODO: shapes not implemented yet");
}

export function specsKey(props: Piece) {
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

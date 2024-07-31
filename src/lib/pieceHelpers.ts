import * as THREE from "three";
import { Joint, Piece } from "./AbstractShapeMaker";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";

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
  if (joint?.jointType === "box") {
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
  }  else {
    if (orientation === "horizontal") {
      shape.lineTo(x + xCenter * 2 * jointWidthOrder, y);
    } else {
      shape.lineTo(x, y + yCenter * 2 * jointWidthOrder);
    }
  }
}

export function getGeometry(props: Piece): Brush {
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

      let geoBrush = new Brush(geo);
      geoBrush.updateMatrixWorld();

    // back
    if (props.geometry.sides?.back?.joint && props.geometry.sides.back.joint.jointType === "halfLap") {
      geoBrush = handleBrushJoints({
        geo: geoBrush,
        sectionWidth: props.geometry.width,
        sectionHeight: props.geometry.sides.back.joint.size,
        depth: props.geometry.depth,
        translateY: 0 + props.geometry.height /2 - props.geometry.sides.back.joint.size / 2,
        translateX: 0
      })
    }

    // front
    if (props.geometry.sides?.front?.joint && props.geometry.sides.front.joint.jointType === "halfLap") {
      geoBrush = handleBrushJoints({
        geo: geoBrush,
        sectionWidth: props.geometry.width,
        sectionHeight: props.geometry.sides.front.joint.size,
        depth: props.geometry.depth,
        translateY: 0 - props.geometry.height /2 + props.geometry.sides.front.joint.size / 2,
        translateX: 0
      })
    }
    
   

    return geoBrush;
  }
  throw new Error("TODO: shapes not implemented yet");
}

function handleBrushJoints({geo, sectionWidth, depth, sectionHeight, translateY, translateX }: {
  geo: Brush;
  sectionWidth: number;
  sectionHeight: number;
  depth: number;
  translateY: number;
  translateX: number;
}) {

      const remove = new THREE.BoxGeometry(sectionWidth, sectionHeight, depth / 2);
      remove.translate(translateX, translateY, depth *.25);
      const brush = new Brush(remove);
      brush.updateMatrixWorld();


      const evaluator = new Evaluator();
      const result = evaluator.evaluate(geo, brush, SUBTRACTION );
      return result;
      // if (male) {
        
      // } else {
      //   geo.rotateX(Math.PI / 2);
      // }
    
    return geo;
}

export function specsKey(props: Piece) {
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

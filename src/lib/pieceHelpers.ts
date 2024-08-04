import { Joint, Piece } from "./AbstractShapeMaker";
import { draw, DrawingPen, drawRectangle, makePlane, Shape3D } from "replicad";

function getJointWidthSeries({
  i,
  jointWidth,
  order,
  value,
}: {
  value: number;
  jointWidth: number;
  order: 1 | -1;
  i: number;
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
  male,
}: {
  value: number;
  jointHeight: number;
  order: 1 | -1;
  male: boolean;
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
  drawing,
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
  drawing: DrawingPen;
  xCenter: number;
  yCenter: number;
}) {
  // if (joint?.jointType === "box") {
  //   const { jointHeight, numberOfJoints, male } = joint;
  //   const jointWidth = width / (numberOfJoints + 0.5);
  //   for (let i = 0; i < numberOfJoints + 1; i++) {
  //     let xs = [];
  //     let ys = [];
  //     if (orientation === "horizontal") {
  //       xs = getJointWidthSeries({
  //         value: x,
  //         jointWidth,
  //         order: jointWidthOrder,
  //         i,
  //       });
  //       ys = getJointHeightSeries({
  //         value: y,
  //         jointHeight,
  //         order: jointHeightOrder,
  //         male,
  //       });
  //     } else {
  //       xs = getJointHeightSeries({
  //         value: x,
  //         jointHeight,
  //         order: jointHeightOrder,
  //         male,
  //       });
  //       ys = getJointWidthSeries({
  //         value: y,
  //         jointWidth,
  //         order: jointWidthOrder,
  //         i,
  //       });
  //     }
  //     if (x !== xs[0] || y !== ys[0]) {
  //       drawing.lineTo([xs[0], ys[0]]);
  //     }
  //     drawing.lineTo([xs[1], ys[1]]);
  //     if (i === numberOfJoints && !male) {
  //       break;
  //     }
  //     drawing.lineTo([xs[2], ys[2]]);
  //     if (i < numberOfJoints) drawing.lineTo([xs[3], ys[3]]);
  //   }
  // } else {
  if (orientation === "horizontal") {
    drawing.lineTo([x + xCenter * 2 * jointWidthOrder, y]);
  } else {
    drawing.lineTo([x, y + yCenter * 2 * jointWidthOrder]);
  }
  // }
}

export function getGeometry(props: Piece): Shape3D {
  if (props.geometry.type === "box") {
    // const shape = new THREE.Shape();
    const yCenter = props.geometry.height / 2;
    const xCenter = props.geometry.width / 2;
    const drawing = draw([0 + xCenter, 0 + yCenter]);
    // shape.moveTo(0 + xCenter, 0 + yCenter);

    // back side
    handleJoint({
      joint: props.geometry.sides?.back?.joint,
      x: 0 + xCenter,
      y: 0 + yCenter,
      width: props.geometry.width,
      drawing,
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
      drawing,
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
      drawing,
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
      drawing,
      jointWidthOrder: 1,
      jointHeightOrder: 1,
      orientation: "vertical",
      xCenter,
      yCenter,
    });

    const shapez = drawing.close().sketchOnPlane(makePlane("XY"));

    let geoShape: Shape3D = shapez.extrude(props.geometry.depth) as Shape3D;

    // back
    if (props.geometry.sides?.back?.joint)
      if (props.geometry.sides.back.joint.jointType === "halfLap") {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: props.geometry.width,
          sectionHeight: props.geometry.sides.back.joint.size,
          depth: props.geometry.depth,
          translateY:
            0 +
            props.geometry.height / 2 -
            props.geometry.sides.back.joint.size / 2,
          translateX: 0,
        });
      } else if (props.geometry.sides.back.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight: props.geometry.sides.back.joint.jointHeight,
          jointWidth:
            props.geometry.width /
            ((props.geometry.sides.back.joint.numberOfJoints + 0.5) * 2),
          male: props.geometry.sides.back.joint.male,
          numberOfJoints: props.geometry.sides.back.joint.numberOfJoints,
          orientation: "horizontal",
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }

    // front
    if (
      props.geometry.sides?.front?.joint &&
      props.geometry.sides.front.joint.jointType === "halfLap"
    ) {
      geoShape = halfLapJoint({
        geo: geoShape,
        sectionWidth: props.geometry.width,
        sectionHeight: props.geometry.sides.front.joint.size,
        depth: props.geometry.depth,
        translateY:
          0 -
          props.geometry.height / 2 +
          props.geometry.sides.front.joint.size / 2,
        translateX: 0,
      });
    }

    // right
    if (
      props.geometry.sides?.right?.joint &&
      props.geometry.sides.right.joint.jointType === "halfLap"
    ) {
      geoShape = halfLapJoint({
        geo: geoShape,
        sectionWidth: props.geometry.sides.right.joint.size,
        sectionHeight: props.geometry.height,
        depth: props.geometry.depth,
        translateY: 0,
        translateX:
          0 +
          props.geometry.width / 2 -
          props.geometry.sides.right.joint.size / 2,
      });
    }

    // left
    if (
      props.geometry.sides?.left?.joint &&
      props.geometry.sides.left.joint.jointType === "halfLap"
    ) {
      geoShape = halfLapJoint({
        geo: geoShape,
        sectionWidth: props.geometry.sides.left.joint.size,
        sectionHeight: props.geometry.height,
        depth: props.geometry.depth,
        translateY: 0,
        translateX:
          0 -
          props.geometry.width / 2 +
          props.geometry.sides.left.joint.size / 2,
      });
    }

    return geoShape;
  }
  throw new Error("TODO: shapes not implemented yet");
}

function makeBox({
  height,
  width,
  depth,
}: {
  height: number;
  width: number;
  depth: number;
}): Shape3D {
  const rectangle = drawRectangle(width, height);
  return rectangle.sketchOnPlane(makePlane("XY")).extrude(depth) as Shape3D;
}

function halfLapJoint({
  geo,
  sectionWidth,
  depth,
  sectionHeight,
  translateY,
  translateX,
}: {
  geo: Shape3D;
  sectionWidth: number;
  sectionHeight: number;
  depth: number;
  translateY: number;
  translateX: number;
}) {
  const remove = makeBox({
    width: sectionWidth,
    height: sectionHeight,
    depth: depth / 2,
  }).translate(translateX, translateY, depth * 0.25);
  return geo.cut(remove);
}

function boxJoint({
  jointHeight,
  jointWidth,
  numberOfJoints,
  depth,
  male,
  orientation,
  geo,
  width,
  height,
}: {
  geo: Shape3D;
  jointHeight: number;
  jointWidth: number;
  numberOfJoints: number;
  depth: number;
  male: boolean;
  orientation: "horizontal" | "vertical";
  width: number;
  height: number;
}): Shape3D {
  let geo2 = geo;
  for (let i = 0; i < numberOfJoints + (male ? 0 : 1); i++) {
    const box = makeBox({
      width: jointWidth,
      height: jointHeight,
      depth,
    });
    if (orientation === "horizontal") {
      console.log({ i, j: jointWidth * i });
      const t = box.translate(
        jointWidth * (i * 2 + 1.5) - width / 2,
        0 - jointHeight / 2 + height / 2,
        0,
      );
      geo2 = geo2.cut(t);
    } else {
      const t = box.translate(0 - jointWidth, jointHeight * i, 0);
      geo2 = geo2.cut(t);
    }
  }

  return geo2;
}

export function specsKey(props: Piece) {
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

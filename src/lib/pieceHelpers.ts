import { Piece } from "./AbstractShapeMaker";
import { makeBaseBox, Shape3D } from "replicad";
import { boxJoint } from "./boxJoint";
import { halfLapJoint } from "./halfLapJoint";

export function getGeometry(props: Piece): Shape3D {
  if (props.geometry.type === "box") {
    let geoShape: Shape3D = makeBox({
      depth: props.geometry.depth,
      height: props.geometry.height,
      width: props.geometry.width,
    });

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
          orientation: { axis: "horizontal", cutDirection: "down" },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }

    // front
    if (props.geometry.sides?.front?.joint) {
      if (props.geometry.sides.front.joint.jointType === "halfLap") {
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
      } else if (props.geometry.sides.front.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight: props.geometry.sides.front.joint.jointHeight,
          jointWidth:
            props.geometry.width /
            ((props.geometry.sides.front.joint.numberOfJoints + 0.5) * 2),
          male: props.geometry.sides.front.joint.male,
          numberOfJoints: props.geometry.sides.front.joint.numberOfJoints,
          orientation: { axis: "horizontal", cutDirection: "up" },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }
    }
    // right
    if (props.geometry.sides?.right?.joint)
      if (props.geometry.sides.right.joint.jointType === "halfLap") {
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
      } else if (props.geometry.sides.right.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight:
            props.geometry.height /
            ((props.geometry.sides.right.joint.numberOfJoints + 0.5) * 2),
          jointWidth: props.geometry.sides.right.joint.jointHeight,

          male: props.geometry.sides.right.joint.male,
          numberOfJoints: props.geometry.sides.right.joint.numberOfJoints,
          orientation: { axis: "vertical", cutDirection: "left" },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }

    // left
    if (props.geometry.sides?.left?.joint)
      if (props.geometry.sides.left.joint.jointType === "halfLap") {
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
      } else if (props.geometry.sides.left.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight:
            props.geometry.height /
            ((props.geometry.sides.left.joint.numberOfJoints + 0.5) * 2),
          jointWidth: props.geometry.sides.left.joint.jointHeight,

          male: props.geometry.sides.left.joint.male,
          numberOfJoints: props.geometry.sides.left.joint.numberOfJoints,
          orientation: { axis: "vertical", cutDirection: "right" },
          width: props.geometry.width,
          height: props.geometry.height,
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
  return makeBaseBox(width, height, depth);
}

export function specsKey(props: Piece) {
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

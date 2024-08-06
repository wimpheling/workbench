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
          holes: props.geometry.sides.back.joint.holes,
          orientation: "horizontal",
        });
      } else if (props.geometry.sides.back.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          width: props.geometry.width,
          height: props.geometry.height,
          depth: props.geometry.depth,
          ...props.geometry.sides.back.joint,
          orientation: { axis: "horizontal", cutDirection: "down" },
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
          holes: props.geometry.sides.front.joint.holes,
          orientation: "horizontal",
        });
      } else if (props.geometry.sides.front.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          width: props.geometry.width,
          height: props.geometry.height,
          depth: props.geometry.depth,
          ...props.geometry.sides.front.joint,
          orientation: { axis: "horizontal", cutDirection: "up" },
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
          holes: props.geometry.sides.right.joint.holes,
          orientation: "vertical",
        });
      } else if (props.geometry.sides.right.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          width: props.geometry.width,
          height: props.geometry.height,
          orientation: { axis: "vertical", cutDirection: "left" },
          ...props.geometry.sides.right.joint,
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
          holes: props.geometry.sides.left.joint.holes,
          orientation: "vertical",
        });
      } else if (props.geometry.sides.left.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          width: props.geometry.width,
          height: props.geometry.height,
          orientation: { axis: "vertical", cutDirection: "right" },
          ...props.geometry.sides.left.joint,
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

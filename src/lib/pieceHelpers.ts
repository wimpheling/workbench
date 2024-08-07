import { GeometryProps } from "./AbstractShapeMaker";
import { makeBaseBox, Shape3D } from "replicad";
import { boxJoint } from "./boxJoint";
import { halfLapJoint } from "./halfLapJoint";

export function getGeometry(geometry: GeometryProps): Shape3D {
  if (geometry.type === "box") {
    let geoShape: Shape3D = makeBox({
      depth: geometry.depth,
      height: geometry.height,
      width: geometry.width,
    });

    // back
    if (geometry.sides?.back?.joint)
      if (geometry.sides.back.joint.jointType === "halfLap") {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: geometry.width,
          sectionHeight: geometry.sides.back.joint.size,
          depth: geometry.depth,
          translateY:
            0 + geometry.height / 2 - geometry.sides.back.joint.size / 2,
          translateX: 0,
          holes: geometry.sides.back.joint.holes,
          orientation: "horizontal",
        });
      } else if (geometry.sides.back.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          width: geometry.width,
          height: geometry.height,
          depth: geometry.depth,
          ...geometry.sides.back.joint,
          orientation: { axis: "horizontal", cutDirection: "down" },
        });
      }

    // front
    if (geometry.sides?.front?.joint) {
      if (geometry.sides.front.joint.jointType === "halfLap") {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: geometry.width,
          sectionHeight: geometry.sides.front.joint.size,
          depth: geometry.depth,
          translateY:
            0 - geometry.height / 2 + geometry.sides.front.joint.size / 2,
          translateX: 0,
          holes: geometry.sides.front.joint.holes,
          orientation: "horizontal",
        });
      } else if (geometry.sides.front.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          width: geometry.width,
          height: geometry.height,
          depth: geometry.depth,
          ...geometry.sides.front.joint,
          orientation: { axis: "horizontal", cutDirection: "up" },
        });
      }
    }
    // right
    if (geometry.sides?.right?.joint)
      if (geometry.sides.right.joint.jointType === "halfLap") {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: geometry.sides.right.joint.size,
          sectionHeight: geometry.height,
          depth: geometry.depth,
          translateY: 0,
          translateX:
            0 + geometry.width / 2 - geometry.sides.right.joint.size / 2,
          holes: geometry.sides.right.joint.holes,
          orientation: "vertical",
        });
      } else if (geometry.sides.right.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          depth: geometry.depth,
          width: geometry.width,
          height: geometry.height,
          orientation: { axis: "vertical", cutDirection: "left" },
          ...geometry.sides.right.joint,
        });
      }

    // left
    if (geometry.sides?.left?.joint)
      if (geometry.sides.left.joint.jointType === "halfLap") {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: geometry.sides.left.joint.size,
          sectionHeight: geometry.height,
          depth: geometry.depth,
          translateY: 0,
          translateX:
            0 - geometry.width / 2 + geometry.sides.left.joint.size / 2,
          holes: geometry.sides.left.joint.holes,
          orientation: "vertical",
        });
      } else if (geometry.sides.left.joint.jointType === "box") {
        geoShape = boxJoint({
          geo: geoShape,
          depth: geometry.depth,
          width: geometry.width,
          height: geometry.height,
          orientation: { axis: "vertical", cutDirection: "right" },
          ...geometry.sides.left.joint,
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

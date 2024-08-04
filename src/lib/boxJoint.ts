import { makeBaseBox, Shape3D } from "replicad";

export function boxJoint({
  orientation,
  jointHeight,
  jointWidth,
  numberOfJoints,
  depth,
  male,
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
  orientation:
    | {
        axis: "horizontal";
        cutDirection: "up" | "down";
      }
    | {
        axis: "vertical";
        cutDirection: "left" | "right";
      };
  width: number;
  height: number;
}): Shape3D {
  let geo2 = geo;
  for (let i = 0; i < numberOfJoints + (male ? 0 : 1); i++) {
    const box = makeBaseBox(jointWidth, jointHeight, depth);
    const translateModifier = male ? 0.5 : 1.5;
    if (orientation.axis === "horizontal") {
      const jointHeightOrder = orientation.cutDirection === "up" ? 1 : -1;
      const section = box.translate(
        jointWidth * (i * 2 + translateModifier) - width / 2,
        0 +
          (jointHeightOrder * jointHeight) / 2 -
          (jointHeightOrder * height) / 2,
        0,
      );
      geo2 = geo2.cut(section);
    } else {
      // vertical
      const jointWidthOrder = orientation.cutDirection === "left" ? -1 : 1;
      const section = box.translate(
        0 + (jointWidthOrder * jointWidth) / 2 - (jointWidthOrder * width) / 2,
        jointHeight * (i * 2 + translateModifier) - height / 2,
        0,
      );
      geo2 = geo2.cut(section);
    }
  }

  return geo2;
}

import { makeBaseBox, Shape3D } from "replicad";

export function boxJoint({
  orientation,
  jointHeight,
  numberOfJoints,
  depth,
  male,
  geo,
  width,
  height,
}: {
  geo: Shape3D;
  jointHeight: number;
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
  for (let i = 0; i < numberOfJoints + (male ? 1 : 0); i++) {
    const translateModifier = male ? 0.5 : 1.5;
    if (orientation.axis === "horizontal") {
      const boxHeight = jointHeight;
      const boxWidth = (width / (numberOfJoints + 0.5)) * 2;
      const box = makeBaseBox(boxWidth, boxHeight, depth);
      const jointHeightOrder = orientation.cutDirection === "up" ? 1 : -1;
      const section = box.translate(
        boxWidth * (i * 2 + translateModifier) - width / 2,
        0 +
          (jointHeightOrder * boxHeight) / 2 -
          (jointHeightOrder * height) / 2,
        0,
      );
      geo2 = geo2.cut(section);
    } else {
      // vertical
      const boxHeight = (height / (numberOfJoints + 0.5)) * 2;
      const boxWidth = jointHeight;
      const box = makeBaseBox(boxWidth, boxHeight, depth);
      const jointWidthOrder = orientation.cutDirection === "left" ? -1 : 1;
      // const jointWidth = jointHeight;
      const section = box.translate(
        0 + (jointWidthOrder * boxWidth) / 2 - (jointWidthOrder * width) / 2,
        boxHeight * (i * 2 + translateModifier) - height / 2,
        0,
      );
      geo2 = geo2.cut(section);
    }
  }

  return geo2;
}

import { makeBaseBox, Shape3D } from "replicad";

export function halfLapJoint({
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
  const remove = makeBaseBox(sectionWidth, sectionHeight, depth / 2).translate(
    translateX,
    translateY,
    depth * 0.25,
  );
  return geo.cut(remove);
}

import { makeBaseBox, makeCylinder, Shape3D } from "replicad";

export function halfLapJoint({
  geo,
  sectionWidth,
  depth,
  sectionHeight,
  translateY,
  translateX,
  holes,
  orientation,
}: {
  geo: Shape3D;
  sectionWidth: number;
  sectionHeight: number;
  depth: number;
  translateY: number;
  translateX: number;
  holes?: { numberOfHoles: number; radius: number };
  orientation: "vertical" | "horizontal";
}): Shape3D {
  const remove = makeBaseBox(sectionWidth, sectionHeight, depth / 2).translate(
    translateX,
    translateY,
    depth * 0.5,
  );
  let section = geo.cut(remove);
  if (holes) {
    for (let i = 0; i < holes.numberOfHoles; i++) {
      let x = translateX;
      let y = translateY;
      if (orientation === "vertical") {
        y -= sectionHeight / 2;
        y += (i + 1) * (sectionHeight / (holes.numberOfHoles + 1));
      }
      if (orientation === "horizontal") {
        x -= sectionWidth / 2;
        x += (i + 1) * (sectionWidth / (holes.numberOfHoles + 1));
      }
      const hole = makeCylinder(holes.radius, depth / 2).translate(x, y, 0);
      section = section.cut(hole);
    }
  }
  return section;
}

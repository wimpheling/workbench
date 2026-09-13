import { type Shape3D, draw, makeBaseBox } from 'replicad';
import type { CompoundPiece, Piece } from './AbstractShapeMaker';
import { boxJoint } from './boxJoint';
import { halfLapJoint } from './halfLapJoint';

function create3030Profile(length: number): Shape3D {
  const slotWidth = 1.1;
  const outerSize = 3;
  const innerSize = outerSize - slotWidth * 2;

  const profile = draw()
    .hLine(slotWidth)
    .vLine(-slotWidth)
    .hLine(innerSize)
    .vLine(slotWidth)
    .hLine(slotWidth)
    .vLine(-slotWidth)
    .hLine(-slotWidth)
    .vLine(-innerSize)
    .hLine(slotWidth)
    .vLine(-slotWidth)
    .hLine(-slotWidth)
    .vLine(slotWidth)
    .hLine(-innerSize)
    .vLine(-slotWidth)
    .hLine(-slotWidth)
    .vLine(slotWidth)
    .hLine(slotWidth)
    .vLine(innerSize)
    .hLine(-slotWidth)
    .vLine(slotWidth)
    .close()
    .sketchOnPlane('XZ', [0 - outerSize / 2, length / 2, outerSize])
    .extrude(length) as unknown as Shape3D;

  return profile;
}

export function getGeometry(props: Piece): Shape3D {
  if (props.geometry.type === 'box') {
    let geoShape: Shape3D = makeBox({
      depth: props.geometry.depth,
      height: props.geometry.height,
      width: props.geometry.width,
    });

    // back
    if (props.geometry.sides?.back?.joint)
      if (props.geometry.sides.back.joint.jointType === 'halfLap') {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: props.geometry.width,
          sectionHeight: props.geometry.sides.back.joint.size,
          depth: props.geometry.depth,
          translateY: 0 + props.geometry.height / 2 - props.geometry.sides.back.joint.size / 2,
          translateX: 0,
        });
      } else if (props.geometry.sides.back.joint.jointType === 'box') {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight: props.geometry.sides.back.joint.jointHeight,
          jointWidth:
            props.geometry.width / ((props.geometry.sides.back.joint.numberOfJoints + 0.5) * 2),
          male: props.geometry.sides.back.joint.male,
          numberOfJoints: props.geometry.sides.back.joint.numberOfJoints,
          orientation: { axis: 'horizontal', cutDirection: 'down' },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }

    // front
    if (props.geometry.sides?.front?.joint) {
      if (props.geometry.sides.front.joint.jointType === 'halfLap') {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: props.geometry.width,
          sectionHeight: props.geometry.sides.front.joint.size,
          depth: props.geometry.depth,
          translateY: 0 - props.geometry.height / 2 + props.geometry.sides.front.joint.size / 2,
          translateX: 0,
        });
      } else if (props.geometry.sides.front.joint.jointType === 'box') {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight: props.geometry.sides.front.joint.jointHeight,
          jointWidth:
            props.geometry.width / ((props.geometry.sides.front.joint.numberOfJoints + 0.5) * 2),
          male: props.geometry.sides.front.joint.male,
          numberOfJoints: props.geometry.sides.front.joint.numberOfJoints,
          orientation: { axis: 'horizontal', cutDirection: 'up' },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }
    }
    // right
    if (props.geometry.sides?.right?.joint)
      if (props.geometry.sides.right.joint.jointType === 'halfLap') {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: props.geometry.sides.right.joint.size,
          sectionHeight: props.geometry.height,
          depth: props.geometry.depth,
          translateY: 0,
          translateX: 0 + props.geometry.width / 2 - props.geometry.sides.right.joint.size / 2,
        });
      } else if (props.geometry.sides.right.joint.jointType === 'box') {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight:
            props.geometry.height / ((props.geometry.sides.right.joint.numberOfJoints + 0.5) * 2),
          jointWidth: props.geometry.sides.right.joint.jointHeight,

          male: props.geometry.sides.right.joint.male,
          numberOfJoints: props.geometry.sides.right.joint.numberOfJoints,
          orientation: { axis: 'vertical', cutDirection: 'left' },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }

    // left
    if (props.geometry.sides?.left?.joint)
      if (props.geometry.sides.left.joint.jointType === 'halfLap') {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: props.geometry.sides.left.joint.size,
          sectionHeight: props.geometry.height,
          depth: props.geometry.depth,
          translateY: 0,
          translateX: 0 - props.geometry.width / 2 + props.geometry.sides.left.joint.size / 2,
        });
      } else if (props.geometry.sides.left.joint.jointType === 'box') {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight:
            props.geometry.height / ((props.geometry.sides.left.joint.numberOfJoints + 0.5) * 2),
          jointWidth: props.geometry.sides.left.joint.jointHeight,

          male: props.geometry.sides.left.joint.male,
          numberOfJoints: props.geometry.sides.left.joint.numberOfJoints,
          orientation: { axis: 'vertical', cutDirection: 'right' },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }

    // top
    if (props.geometry.sides?.top?.joint)
      if (props.geometry.sides.top.joint.jointType === 'halfLap') {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: props.geometry.width,
          sectionHeight: props.geometry.sides.top.joint.size,
          depth: props.geometry.depth,
          translateY: 0 + props.geometry.height / 2 - props.geometry.sides.top.joint.size / 2,
          translateX: 0,
        });
      } else if (props.geometry.sides.top.joint.jointType === 'box') {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight: props.geometry.sides.top.joint.jointHeight,
          jointWidth:
            props.geometry.width / ((props.geometry.sides.top.joint.numberOfJoints + 0.5) * 2),
          male: props.geometry.sides.top.joint.male,
          numberOfJoints: props.geometry.sides.top.joint.numberOfJoints,
          orientation: { axis: 'horizontal', cutDirection: 'down' },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }

    // bottom
    if (props.geometry.sides?.bottom?.joint)
      if (props.geometry.sides.bottom.joint.jointType === 'halfLap') {
        geoShape = halfLapJoint({
          geo: geoShape,
          sectionWidth: props.geometry.width,
          sectionHeight: props.geometry.sides.bottom.joint.size,
          depth: props.geometry.depth,
          translateY: 0 - props.geometry.height / 2 + props.geometry.sides.bottom.joint.size / 2,
          translateX: 0,
        });
      } else if (props.geometry.sides.bottom.joint.jointType === 'box') {
        geoShape = boxJoint({
          geo: geoShape,
          depth: props.geometry.depth,
          jointHeight: props.geometry.sides.bottom.joint.jointHeight,
          jointWidth:
            props.geometry.width / ((props.geometry.sides.bottom.joint.numberOfJoints + 0.5) * 2),
          male: props.geometry.sides.bottom.joint.male,
          numberOfJoints: props.geometry.sides.bottom.joint.numberOfJoints,
          orientation: { axis: 'horizontal', cutDirection: 'up' },
          width: props.geometry.width,
          height: props.geometry.height,
        });
      }

    return geoShape;
  }

  if (props.geometry.type === 'extrusion') {
    if (props.geometry.profileType === '3060') {
      const slotWidth = 1.1;
      const outerWidth = 6;
      const outerHeight = 3;
      const innerWidth = outerWidth - slotWidth * 2;

      const profile = draw()
        .hLine(slotWidth)
        .vLine(-slotWidth)
        .hLine(innerWidth)
        .vLine(slotWidth)
        .hLine(slotWidth)
        .vLine(-slotWidth)
        .hLine(-slotWidth)
        .vLine(-outerHeight + slotWidth * 2)
        .hLine(slotWidth)
        .vLine(-slotWidth)
        .hLine(-slotWidth)
        .vLine(outerHeight - slotWidth * 2)
        .hLine(-innerWidth)
        .vLine(-slotWidth)
        .hLine(-slotWidth)
        .vLine(slotWidth)
        .hLine(slotWidth)
        .vLine(outerHeight - slotWidth * 2)
        .hLine(-slotWidth)
        .vLine(slotWidth)
        .close()
        .sketchOnPlane('XZ', [0 - outerWidth / 2, props.geometry.length / 2, outerHeight])
        .extrude(props.geometry.length) as unknown as Shape3D;

      return profile;
    }

    return create3030Profile(props.geometry.length) as Shape3D;
  }

  throw new Error('TODO: shapes not implemented yet');
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
  if (props.geometry.type === 'extrusion') {
    const profile = props.geometry.profileType === '3060' ? '3060' : '3030';
    return `${props.material} ${profile} profile x ${props.geometry.length}`;
  }
  return `${props.material} ${props.geometry.height}x${props.geometry.width}x${props.geometry.depth}`;
}

export function fuseGeometries(compound: CompoundPiece): Shape3D {
  if (compound.pieces.length === 0) {
    throw new Error('CompoundPiece must have at least one piece');
  }

  let fusedShape: Shape3D | null = null;

  for (const piece of compound.pieces) {
    const pieceGeometry = getGeometry(piece);

    if (fusedShape === null) {
      fusedShape = pieceGeometry;
    } else {
      fusedShape = fusedShape.fuse(pieceGeometry);
    }
  }

  if (fusedShape === null) {
    throw new Error('Failed to create fused geometry');
  }

  if (compound.fuseOptions?.postFuse) {
    fusedShape = compound.fuseOptions.postFuse(fusedShape);
  }

  return fusedShape;
}

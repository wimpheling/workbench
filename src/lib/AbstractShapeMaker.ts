import * as THREE from "three";

type MakeShapeProps = {
  x: number;
  y: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  scene: THREE.Scene;
  color?: string;
  dimensions?: boolean;
  opacity?: number;
  name: string;
};
export type Piece = Omit<MakeShapeProps, "x" | "y" | "z" | "scene"> & {
  material: string;
  group: string;
  assemble: (obj: THREE.Object3D) => void;
};

export class AbstractShapeMaker {
  objectsByGroup: Record<string, Piece[]> = {};
  threeGroups: Record<string, THREE.Group> = {};

  makeShape(props: Piece) {
    if (!this.objectsByGroup[props.group]) {
      this.objectsByGroup[props.group] = [];
    }
    this.objectsByGroup[props.group]?.push(props);
  }

  assemble(
    scene: THREE.Scene,
    conf: {
      hiddenGroups?: string[];
    }
  ) {
    this.threeGroups = {};
    Object.keys(this.objectsByGroup).forEach((group) => {
      const pieces = this.objectsByGroup[group];
      const groupObj = new THREE.Group();
      const visible = !conf?.hiddenGroups?.includes(group);
      groupObj.visible = visible;
      groupObj.name = group;
      scene.add(groupObj);
      this.threeGroups[group] = groupObj;
      pieces.forEach((piece) => {
        // Mesh
        const obj = new THREE.Mesh(
          new THREE.BoxGeometry(piece.width, piece.height, piece.depth),
          new THREE.MeshLambertMaterial({
            color: piece.color || 0xa1662f,
            opacity: piece.opacity || 1,
            transparent: Boolean(piece.opacity && piece.opacity < 1),
            name: piece.name,
          })
        );
        obj.castShadow = true;
        obj.receiveShadow = true;

        // line
        const edges = new THREE.EdgesGeometry(
          new THREE.BoxGeometry(piece.width, piece.height, piece.depth)
        );
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: "black",
            opacity: piece.opacity,
          })
        );
        line.castShadow = true;
        line.receiveShadow = true;

        const group = new THREE.Group();
        if (piece.name) {
          group.name = piece.name;
        }
        group.add(obj);
        group.add(line);
        scene.add(group);

        groupObj.add(group);

        piece.assemble(group);
      });
    });
  }
}

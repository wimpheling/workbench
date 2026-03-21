import * as THREE from "three";
import { DisposableItem } from "../ui/interfaces";
import { syncGeometries } from "replicad-threejs-helper";
import { Shape3D } from "replicad";

export interface BoxJoint {
  numberOfJoints: number;
  jointHeight: number;
  male: boolean;
  jointType: "box";
}

export interface HalfLapJoint {
  male: boolean;
  jointType: "halfLap";
  size: number;
  borderSize?: number;
  holes?: { numberOfHoles: number; radius: number };
}

export type Joint = BoxJoint | HalfLapJoint;

export interface Side {
  joint?: Joint;
}

export interface Sides {
  left?: Side;
  right?: Side;
  front?: Side;
  back?: Side;
}
interface BoxGeometryProps {
  height: number;
  width: number;
  depth: number;
  type: "box";
  sides?: Sides;
}

export type GeometryProps = BoxGeometryProps;
export interface Piece {
  getGeometry: () => Shape3D;
  color?: string;
  opacity?: number;
  name: string;
  material: string;
  group: string;
  assemble: (obj: THREE.Object3D) => void;
}

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
    },
  ) {
    const itemsToDispose: DisposableItem[] = [];
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
        const shape = piece.getGeometry();
        const mat = new THREE.MeshLambertMaterial({
          color: piece.color || 0xa1662f,
          opacity: piece.opacity || 1,
          transparent: Boolean(piece.opacity && piece.opacity < 1),
          name: piece.name,
        });

        const shapeItem = {
          name: piece.name,
          faces: shape.mesh({ tolerance: 0.05, angularTolerance: 30 }),
          edges: shape.meshEdges(),
        };

        const geometries = syncGeometries([shapeItem], []);
        const geo = geometries[0];
        const obj = new THREE.Mesh(geo.faces, mat);
        obj.castShadow = true;
        obj.receiveShadow = true;

        itemsToDispose.push(mat);

        // line
        const line = new THREE.LineSegments(
          geo.lines,
          new THREE.LineBasicMaterial({
            color: "black",
            opacity: piece.opacity || 0.4,
          }),
        );
        line.castShadow = true;
        line.receiveShadow = true;
        itemsToDispose.push(geo.faces);
        itemsToDispose.push(geo.lines);

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
    return itemsToDispose;
  }
}

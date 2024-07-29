import * as THREE from "three";
import { DisposableItem } from "../ui/interfaces";
import { getGeometry, specsKey } from "./pieceHelpers";

export type BoxJoint = {
  numberOfJoints: number;
  jointHeight: number;
  male: boolean;
  jointType: "box";
};

export type Joint = BoxJoint;

export type Side = {
  joint?: Joint;
};

export type Sides = {
  left?: Side;
  right?: Side;
  front?: Side;
  back?: Side;
};

type ShapeGeometryProps = {
  type: "shape";
  height: number;
  width: number;
  depth: number;
  sides?: Sides;
};

type BoxGeometryProps = {
  height: number;
  width: number;
  depth: number;
  type: "box";
  sides?: Sides;
};

type GeometryProps = BoxGeometryProps | ShapeGeometryProps;
type MakeShapeProps = {
  geometry: GeometryProps;
  x: number;
  y: number;
  z: number;
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
  piecesBySpecs: Record<string, Piece[]> = {};
  hiddenGroupsInSpecs: string[] = [];

  constructor(hiddenGroupsInSpecs: string[] = []) {
    this.hiddenGroupsInSpecs = hiddenGroupsInSpecs;
  }

  makeShape(props: Piece) {
    if (!this.objectsByGroup[props.group]) {
      this.objectsByGroup[props.group] = [];
    }
    this.objectsByGroup[props.group]?.push(props);

    if (!this.hiddenGroupsInSpecs.includes(props.group)) {
      const specs = specsKey(props);
      if (!this.piecesBySpecs[specs]) {
        this.piecesBySpecs[specs] = [];
      }
      this.piecesBySpecs[specs]?.push(props);
    }
  }

  assemble(
    scene: THREE.Scene,
    conf: {
      hiddenGroups?: string[];
    }
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
        const geo = getGeometry(piece);
        const mat = new THREE.MeshLambertMaterial({
          color: piece.color || 0xa1662f,
          opacity: piece.opacity || 1,
          transparent: Boolean(piece.opacity && piece.opacity < 1),
          name: piece.name,
        });

        const obj = new THREE.Mesh(geo, mat);
        obj.castShadow = true;
        obj.receiveShadow = true;

        itemsToDispose.push(mat);
        itemsToDispose.push(geo);

        // line
        const lineBox = getGeometry(piece);
        const edges = new THREE.EdgesGeometry(lineBox);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: "black",
            opacity: piece.opacity || 0.4,
          })
        );
        line.castShadow = true;
        line.receiveShadow = true;
        itemsToDispose.push(edges);
        itemsToDispose.push(lineBox);

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

import * as THREE from "three";
import { DisposableItem } from "../ui/interfaces";
import { getGeometry, specsKey } from "./pieceHelpers";
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
  top?: Side;
  bottom?: Side;
}
export type PostProcessHandler = (obj: Shape3D) => Shape3D;
interface BoxGeometryProps {
  height: number;
  width: number;
  depth: number;
  type: "box";
  sides?: Sides;
  postProcess?: PostProcessHandler;
}

type GeometryProps = BoxGeometryProps;
interface MakeShapeProps {
  geometry: GeometryProps;
  x: number;
  y: number;
  z: number;
  scene: THREE.Scene;
  color?: string;
  dimensions?: boolean;
  opacity?: number;
  name: string;
}
export type Piece = Omit<MakeShapeProps, "x" | "y" | "z" | "scene"> & {
  material: string;
  group: string;
  assemble: (obj: THREE.Object3D) => void;
};

export type FuseOptions = {
  postFuse?: (fused: Shape3D) => Shape3D;
};

export type CompoundPiece = {
  name: string;
  material: string;
  group: string;
  pieces: Piece[];
  fuseOptions?: FuseOptions;
  assemble: (obj: THREE.Object3D) => void;
  hingePosition?: "left" | "right";
  color?: string;
};

export class AbstractShapeMaker {
  objectsByGroup: Record<string, Piece[]> = {};
  compoundsByGroup: Record<string, CompoundPiece[]> = {};
  threeGroups: Record<string, THREE.Group> = {};
  piecesBySpecs: Record<string, Piece[]> = {};
  hiddenGroupsInSpecs: string[] = [];
  doorPivots: Record<
    string,
    { group: THREE.Group; hingePosition: "left" | "right" }
  > = {};

  constructor(hiddenGroupsInSpecs: string[] = []) {
    this.hiddenGroupsInSpecs = hiddenGroupsInSpecs;
  }

  makeShape(piece: Piece) {
    if (!this.objectsByGroup[piece.group]) {
      this.objectsByGroup[piece.group] = [];
    }
    this.objectsByGroup[piece.group]?.push(piece);

    if (!this.hiddenGroupsInSpecs.includes(piece.group)) {
      const specs = specsKey(piece);
      if (!this.piecesBySpecs[specs]) {
        this.piecesBySpecs[specs] = [];
      }
      this.piecesBySpecs[specs]?.push(piece);
    }
  }

  makeCompoundPiece(piece: CompoundPiece) {
    if (!this.compoundsByGroup[piece.group]) {
      this.compoundsByGroup[piece.group] = [];
    }
    this.compoundsByGroup[piece.group]?.push(piece);
  }

  assemble(
    scene: THREE.Scene,
    conf: {
      hiddenGroups?: string[];
    },
  ) {
    const itemsToDispose: DisposableItem[] = [];
    this.threeGroups = {};
    this.doorPivots = {};

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
        let shape = getGeometry(piece);
        const mat = new THREE.MeshLambertMaterial({
          color: piece.color || 0xa1662f,
          opacity: piece.opacity || 1,
          transparent: Boolean(piece.opacity && piece.opacity < 1),
          name: piece.name,
        });

        if (piece.geometry.postProcess) {
          shape = piece.geometry.postProcess(shape);
        }
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

    Object.keys(this.compoundsByGroup).forEach((group) => {
      const compounds = this.compoundsByGroup[group];
      const groupObj = this.threeGroups[group] || new THREE.Group();
      const visible = !conf?.hiddenGroups?.includes(group);
      groupObj.visible = visible;
      if (!this.threeGroups[group]) {
        groupObj.name = group;
        scene.add(groupObj);
        this.threeGroups[group] = groupObj;
      }

      compounds.forEach((compound) => {
        const compoundGroup = new THREE.Group();
        if (compound.name) {
          compoundGroup.name = compound.name;
        }

        for (const piece of compound.pieces) {
          let shape = getGeometry(piece);

          if (piece.geometry.postProcess) {
            shape = piece.geometry.postProcess(shape);
          }

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
          itemsToDispose.push(geo.faces);
          itemsToDispose.push(geo.lines);

          const line = new THREE.LineSegments(
            geo.lines,
            new THREE.LineBasicMaterial({
              color: "black",
              opacity: piece.opacity || 0.4,
            }),
          );
          line.castShadow = true;
          line.receiveShadow = true;

          const pieceGroup = new THREE.Group();
          if (piece.name) {
            pieceGroup.name = piece.name;
          }
          pieceGroup.add(obj);
          pieceGroup.add(line);

          piece.assemble(pieceGroup);
          compoundGroup.add(pieceGroup);
        }

        groupObj.add(compoundGroup);

        if (compound.hingePosition) {
          const pivotGroup = new THREE.Group();
          pivotGroup.name = `${compound.name}_pivot`;

          const doorWidth = compound.pieces.reduce(
            (max, p) => Math.max(max, p.geometry.width),
            0,
          );
          const offsetX =
            compound.hingePosition === "left" ? doorWidth / 2 : -doorWidth / 2;

          compoundGroup.position.x -= offsetX;

          pivotGroup.add(compoundGroup);
          groupObj.add(pivotGroup);

          this.doorPivots[compound.name] = {
            group: pivotGroup,
            hingePosition: compound.hingePosition,
          };

          compound.assemble(pivotGroup);
        } else {
          compound.assemble(compoundGroup);
        }
      });
    });
    return itemsToDispose;
  }
}

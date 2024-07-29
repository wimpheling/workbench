import { AbstractShapeMaker } from "./AbstractShapeMaker";

export type MyObject3D = {
  sm: AbstractShapeMaker;
  hiddenGroups: string[];
  hiddenGroupsInSpecs: string[];
};

import { Group, Object3D } from "three";
import {
  makeEnclosureV2,
  type EnclosureDimensions,
  type EnclosureModel,
} from "../domain/enclosureV2";
import { applyMemberTransform } from "./threeAdapter";

export type EnclosureScene = {
  model: EnclosureModel;
  root: Group;
  members: readonly Object3D[];
};

export function buildEnclosureScene(dimensions: EnclosureDimensions): EnclosureScene {
  const model = makeEnclosureV2(dimensions);
  const root = new Group();
  root.name = model.frame.id;
  root.userData.frameId = model.frame.id;

  const members = model.members.map((member) => {
    const object = new Group();
    object.name = member.id;
    object.userData.memberId = member.id;
    object.userData.profileId = member.profile;
    applyMemberTransform(object, member);
    root.add(object);
    return object;
  });

  return { model, root, members };
}

export const defaultEnclosureScene = () =>
  buildEnclosureScene({ width: 120, height: 100, depth: 80 });

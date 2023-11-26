import * as THREE from "three";

export type Obj = THREE.Group<THREE.Object3DEventMap>;

function isEnclosureInnerWallCorrect({
  tableTop,
  enclosureWallInnerBack,
  enclosureWallInnerLeft,
}: {
  tableTop: Obj;
  enclosureWallInnerBack: Obj;
  enclosureWallInnerLeft: Obj;
  enclosureWallInnerRight: Obj;
}) {
  const tableTopBbox = new THREE.Box3().setFromObject(tableTop);
  const enclosureWallInnerBackBbox = new THREE.Box3().setFromObject(
    enclosureWallInnerBack
  );
  /* distance between back of tableTop and enclosureWallInnerBack */
  const distanceBetweenBackAndEdge =
    enclosureWallInnerBackBbox.min.z - tableTopBbox.min.z;

  const enclosureWallInnerLeftBbox = new THREE.Box3().setFromObject(
    enclosureWallInnerLeft
  );
  const distanceBetweenLeftAndEdge =
    enclosureWallInnerLeftBbox.min.x - tableTopBbox.min.x;
  return { distanceBetweenBackAndEdge, distanceBetweenLeftAndEdge };
}

const isEnclosureOnTheGround = ({
  tableTop,
  enclosureWallInnerBack,
  enclosureWallInnerLeft,
  enclosureWallInnerRight,
  enclosureWallOuterLeft,
  enclosureWallOuterRight,
  enclosureDoorDraft,
}: {
  tableTop: Obj;
  enclosureWallInnerBack: Obj;
  enclosureWallInnerLeft: Obj;
  enclosureWallInnerRight: Obj;
  enclosureWallOuterLeft: Obj;
  enclosureWallOuterRight: Obj;
  enclosureDoorDraft: Obj;
}) => {
  const tableTopBbox = new THREE.Box3().setFromObject(tableTop);
  const groundLevel = tableTopBbox.max.y;
  const isGroundLevel = (obj: Obj) => {
    const bbox = new THREE.Box3().setFromObject(obj);
    return bbox.min.y - groundLevel;
  };
  return {
    groundinnerBack: isGroundLevel(enclosureWallInnerBack),
    groundinnerLeft: isGroundLevel(enclosureWallInnerLeft),
    groundinnerRight: isGroundLevel(enclosureWallInnerRight),
    groundouterLeft: isGroundLevel(enclosureWallOuterLeft),
    groundouterRight: isGroundLevel(enclosureWallOuterRight),
    grounddoorDraft: isGroundLevel(enclosureDoorDraft),
  };
};

export function constraints({
  tableTop,
  enclosureWallInnerBack,
  enclosureWallInnerLeft,
  enclosureWallInnerRight,
  enclosureWallOuterLeft,
  enclosureWallOuterRight,
  enclosureDoorDraft,
}: {
  viga1: Obj;
  tableTop: Obj;
  enclosureWallInnerBack: Obj;
  enclosureWallInnerLeft: Obj;
  enclosureWallInnerRight: Obj;
  enclosureWallOuterLeft: Obj;
  enclosureWallOuterRight: Obj;
  enclosureDoorDraft: Obj;
}) {
  const a = isEnclosureInnerWallCorrect({
    tableTop,
    enclosureWallInnerBack,
    enclosureWallInnerLeft,
    enclosureWallInnerRight,
  });
  const b = isEnclosureOnTheGround({
    tableTop,
    enclosureWallInnerBack,
    enclosureWallInnerLeft,
    enclosureWallInnerRight,
    enclosureWallOuterLeft,
    enclosureWallOuterRight,
    enclosureDoorDraft,
  });

  return { ...a, ...b };
}

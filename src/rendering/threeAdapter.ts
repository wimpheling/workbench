import { Matrix4, Object3D, Vector3 } from "three";
import { atAnchor, orientedAlong, type Anchor, type PlacementSpec } from "../domain/anchors";
import type { Transform } from "../domain/frames";
import type { FrameMember } from "../domain/enclosureV2";

/** Apply a domain transform to a Three.js object without exposing Three.js to the domain. */
export function applyTransform(object: Object3D, transform: Transform): Object3D {
  object.position.set(transform.position.x, transform.position.y, transform.position.z);
  if (transform.basis) {
    const basis = transform.basis;
    const matrix = new Matrix4().makeBasis(
      new Vector3(basis[0], basis[3], basis[6]),
      new Vector3(basis[1], basis[4], basis[7]),
      new Vector3(basis[2], basis[5], basis[8]),
    );
    object.setRotationFromMatrix(matrix);
  } else {
    object.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, "XYZ");
  }
  return object;
}

/** Apply a member's declarative transform, including its explicit profile orientation. */
export function applyMemberTransform(object: Object3D, member: FrameMember): Object3D {
  return applyTransform(object, member.transform);
}

/** Resolve a semantic anchor placement and apply its resulting transform. */
export function applyPlacement(
  object: Object3D,
  placement: PlacementSpec,
  anchors: Readonly<Record<string, Anchor>>,
): Object3D {
  const from = atAnchor(placement.from, anchors);
  const to = atAnchor(placement.to, anchors);
  return applyTransform(object, orientedAlong(from, to, placement.orientation));
}

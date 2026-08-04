import { type Object3D, Quaternion, Vector3 } from "three";
import type { Shape3D } from "replicad";

/** Materialize an independent OpenCascade shape; Shape.clone() only clones its JS wrapper. */
export const cloneShape = (shape: Shape3D): Shape3D => {
  const candidate = shape as Shape3D & { clone?: () => Shape3D };
  if (typeof candidate.clone !== "function") {
    throw new Error("forme Replicad non clonable: clone est absent ou non appelable");
  }
  return candidate.clone().translate(0, 0, 0) as Shape3D;
};

/** Apply a Three.js world transform to a local Replicad shape without consuming the source. */
export const transformShapeToWorld = (shape: Shape3D, object: Object3D): Shape3D => {
  object.updateWorldMatrix(true, false);
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  object.matrixWorld.decompose(position, quaternion, scale);
  const magnitudes = [Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)];
  const uniformScale = magnitudes[0];
  if (magnitudes.some((value) => Math.abs(value - uniformScale) > 1e-9)) {
    throw new Error(
      `scale non uniforme Three.js non représentable fidèlement par Replicad: ${scale.toArray().join(", ")}`,
    );
  }
  const angleRadians = 2 * Math.acos(Math.max(-1, Math.min(1, quaternion.w)));
  const axis = new Vector3(quaternion.x, quaternion.y, quaternion.z);
  const localShape = cloneShape(shape);
  const scaled = Math.abs(uniformScale - 1) > 1e-10 ? localShape.scale(uniformScale) : localShape;
  const reflected = object.matrixWorld.determinant() < 0 ? scaled.mirror("YZ", [0, 0, 0]) : scaled;
  const oriented =
    angleRadians > 1e-10 && axis.lengthSq() > 1e-12
      ? reflected.rotate((angleRadians * 180) / Math.PI, [0, 0, 0], axis.normalize().toArray())
      : reflected;
  return oriented.translate(position.x, position.y, position.z) as Shape3D;
};

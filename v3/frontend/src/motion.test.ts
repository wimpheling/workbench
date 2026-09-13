import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { poseTransform, type MotionDoor } from "./motion";

const doors: MotionDoor[] = [
  {
    id: "front-left",
    type: "swing",
    pivot: [0, -49, 0],
    base_deg: 0,
    opening_sign: -1,
    max_angle_deg: 110,
    link_length_mm: 837,
  },
  {
    id: "front-right",
    type: "swing",
    pivot: [1674, -49, 0],
    base_deg: 180,
    opening_sign: 1,
    max_angle_deg: 110,
    link_length_mm: 837,
  },
  {
    id: "left-rear",
    type: "bifold",
    pivot: [-40, 839.5, 0],
    base_deg: 90,
    opening_sign: 1,
    max_angle_deg: 85,
    link_length_mm: 404.75,
  },
  {
    id: "back-right",
    type: "bifold",
    pivot: [852, 1689, 0],
    base_deg: 0,
    opening_sign: 1,
    max_angle_deg: 85,
    link_length_mm: 411,
  },
];

function point(matrix: THREE.Matrix4, value: [number, number, number]) {
  return new THREE.Vector3(...value)
    .applyMatrix4(matrix)
    .toArray()
    .map((n) => Number(n.toFixed(6)));
}

describe("client door motion", () => {
  it("matches the backend swing fixture at the open endpoint", () => {
    const result = point(poseTransform({ motion_leaf: "a" }, doors[0], 1), [19, -49, 370]);
    expect(result).toEqual([-6.498383, -66.85416, 370]);
  });

  it("matches the backend mirrored swing fixture", () => {
    const result = point(poseTransform({ motion_leaf: "a" }, doors[1], 0.5), [1655, -49, 370]);
    expect(result).toEqual([1663.102048, -64.563889, 370]);
  });

  it("matches both bifold leaves and the moving slider", () => {
    const bifold = doors[2];
    expect(point(poseTransform({ motion_leaf: "a" }, bifold, 1), [-59, 858.5, 347])).toEqual([
      -60.583658, 822.22826, 347,
    ]);
    expect(point(poseTransform({ motion_leaf: "b" }, bifold, 1), [-59, 1263.25, 347])).toEqual([
      -425.938064, 895.359945, 347,
    ]);
    expect(point(poseTransform({ motion_leaf: "slider" }, bifold, 1), [-40, 1649, 803])).toEqual([
      -40, 910.052574, 803,
    ]);
    const rear = doors[3];
    expect(point(poseTransform({ motion_leaf: "a" }, rear, 1), [871, 1708, 347])).toEqual([
      834.72826, 1709.583658, 347,
    ]);
    expect(point(poseTransform({ motion_leaf: "b" }, rear, 1), [1282, 1708, 347])).toEqual([
      908.404669, 2081.164281, 347,
    ]);
    expect(point(poseTransform({ motion_leaf: "slider" }, rear, 1), [1674, 1689, 803])).toEqual([
      923.642021, 1689, 803,
    ]);
  });

  it("leaves static meshes unchanged and clamps animation input", () => {
    const identity = poseTransform({}, doors[3], 2);
    expect(point(identity, [12, 34, 56])).toEqual([12, 34, 56]);
    const closed = poseTransform({ motion_leaf: "a" }, doors[3], -1);
    expect(point(closed, [871, 1708, 347])).toEqual([871, 1708, 347]);
  });
});

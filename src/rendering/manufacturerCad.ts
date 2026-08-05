import { importSTEP, type Shape3D } from "replicad";
import { BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from "three";
import profile3030Step from "../../AST03003004.step?raw";
import profile3060Step from "../../AST03006006.step?raw";
import glr3030Step from "../../GLR3030.step?raw";
import cbr3030Step from "../../CBR3030.step?raw";
import cbr3060Step from "../../CBR3060.step?raw";
import gsd082Step from "../../GSD082.3000KIT.step?raw";
import cfg3030Step from "../../Hinges CFG.30_30 SH-6-C33 (0).stp?raw";

export type ManufacturerCad = Readonly<{
  /** Local X is the cut length; the supplied STEP stock segment is 100 mm. */
  profile3030Geometry: BufferGeometry;
  profile3030StockLengthMm: number;
  profile3060Geometry: BufferGeometry;
  profile3060StockLengthMm: number;
  /** Local Y is the hinge axis; its CAD barrel axis is at the local origin. */
  glr3030LeafGeometry: BufferGeometry;
  glr3030StationaryGeometry: BufferGeometry;
  cbr3030Geometry: BufferGeometry;
  cbr3060Geometry: BufferGeometry;
  /** Local X follows the downloaded 1 m GSD082 reference segment. */
  gsd082GuideGeometry: BufferGeometry;
  gsd082GuideCadReferenceLengthMm: number;
  /** Exact CAD for the two-leaf Elesa CFG.30/30 inter-leaf hinge. */
  cfg3030PrimaryGeometry: BufferGeometry;
  cfg3030SecondaryGeometry: BufferGeometry;
}>;

const profile3030StockLengthMm = 100;
const profile3060StockLengthMm = 100;
const gsd082GuideCadReferenceLengthMm = 1000;
const glr3030BarrelRadiusMm = 8;
// Supplier STEP coordinates are arbitrary. These measured contact-plane datums
// make both CBR assets use the same installation frame: X crosses the 26 mm
// bracket width, +Y follows the horizontal leg, and +Z follows the upright leg.
const cbr3030CadDatumMm = Object.freeze({ x: 14, y: 19.945982, z: -1 });
const cbr3060CadDatumMm = Object.freeze({ x: 59.5, y: 93.8344, z: 65.464466 });
let manufacturerCadPromise: Promise<ManufacturerCad> | undefined;

const meshGeometry = (shape: Shape3D, centerAtBounds = true): BufferGeometry => {
  const mesh = shape.mesh({ tolerance: 0.01, angularTolerance: 0.1 });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(mesh.vertices, 3));
  geometry.setIndex(mesh.triangles);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  if (centerAtBounds) {
    const center = geometry.boundingBox!.getCenter(new Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
  }
  return geometry;
};

const cbr3030Geometry = (shape: Shape3D): BufferGeometry => {
  const geometry = meshGeometry(shape, false);
  geometry.translate(-cbr3030CadDatumMm.x, -cbr3030CadDatumMm.y, -cbr3030CadDatumMm.z);
  // A proper 180° rotation retains the supplier triangle winding.
  geometry.scale(-1, -1, 1);
  geometry.computeBoundingBox();
  return geometry;
};

const cbr3060Geometry = (shape: Shape3D): BufferGeometry => {
  const geometry = meshGeometry(shape, false);
  geometry.translate(-cbr3060CadDatumMm.x, -cbr3060CadDatumMm.y, -cbr3060CadDatumMm.z);
  // Native Y is bracket width and native X is its horizontal leg.
  geometry.applyMatrix4(new Matrix4().set(0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
  geometry.computeBoundingBox();
  return geometry;
};

const importAsset = async (stepText: string): Promise<Shape3D> =>
  (await importSTEP(new Blob([stepText]))).asShape3D();

/** Put an imported long stock part on conventional local X, preserving winding. */
const orientLongestAxisToX = (geometry: BufferGeometry): BufferGeometry => {
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new Vector3());
  if (size.y >= size.x && size.y >= size.z) geometry.rotateZ(-Math.PI / 2);
  else if (size.z >= size.x && size.z >= size.y) geometry.rotateY(Math.PI / 2);
  geometry.computeBoundingBox();
  return geometry;
};

const splitGlr3030AtPivot = (geometry: BufferGeometry) => {
  const positions = geometry.getAttribute("position");
  const indices = geometry.getIndex();
  if (!indices) throw new Error("GLR3030 STEP mesh must be indexed");
  const stationaryIndices: number[] = [];
  const leafIndices: number[] = [];
  for (let offset = 0; offset < indices.count; offset += 3) {
    const triangle = [indices.getX(offset), indices.getX(offset + 1), indices.getX(offset + 2)];
    const isBarrel = triangle.every(
      (vertex) =>
        Math.hypot(positions.getX(vertex), positions.getZ(vertex)) <= glr3030BarrelRadiusMm,
    );
    const centroidX = triangle.reduce((sum, vertex) => sum + positions.getX(vertex), 0) / 3;
    const destination = !isBarrel && centroidX > 0 ? leafIndices : stationaryIndices;
    destination.push(...triangle);
  }
  const leaf = geometry.clone();
  leaf.setIndex(leafIndices);
  leaf.computeBoundingBox();
  const stationary = geometry.clone();
  stationary.setIndex(stationaryIndices);
  stationary.computeBoundingBox();
  return { leaf, stationary };
};

/**
 * Preserve supplier rigid bodies. Unlike a geometric half-space split, this
 * never cuts a pin or a hinge wing: connected triangle components are kept
 * intact and then assigned by their centre relative to the pivot datum.
 */
const splitCfg3030RigidBodiesAtPivot = (geometry: BufferGeometry) => {
  const positions = geometry.getAttribute("position");
  const indices = geometry.getIndex();
  if (!indices) throw new Error("CFG STEP mesh must be indexed");
  const triangleCount = indices.count / 3;
  const parent = Array.from({ length: triangleCount }, (_, index) => index);
  const find = (index: number): number => {
    if (parent[index] === index) return index;
    parent[index] = find(parent[index]!);
    return parent[index]!;
  };
  const join = (left: number, right: number): void => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };
  const firstTriangleByVertex = new Map<number, number>();
  for (let offset = 0; offset < indices.count; offset += 3) {
    const triangleIndex = offset / 3;
    for (const vertex of [
      indices.getX(offset),
      indices.getX(offset + 1),
      indices.getX(offset + 2),
    ]) {
      const first = firstTriangleByVertex.get(vertex);
      if (first === undefined) firstTriangleByVertex.set(vertex, triangleIndex);
      else join(first, triangleIndex);
    }
  }
  const components = new Map<number, number[]>();
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const root = find(triangle);
    const triangles = components.get(root) ?? [];
    triangles.push(triangle);
    components.set(root, triangles);
  }
  const primaryIndices: number[] = [];
  const secondaryIndices: number[] = [];
  for (const triangles of components.values()) {
    let sumX = 0;
    let vertexCount = 0;
    for (const triangle of triangles)
      for (let localIndex = 0; localIndex < 3; localIndex += 1) {
        sumX += positions.getX(indices.getX(triangle * 3 + localIndex));
        vertexCount += 1;
      }
    const target = sumX / vertexCount <= 0 ? primaryIndices : secondaryIndices;
    for (const triangle of triangles)
      target.push(
        indices.getX(triangle * 3),
        indices.getX(triangle * 3 + 1),
        indices.getX(triangle * 3 + 2),
      );
  }
  const primary = geometry.clone();
  primary.setIndex(primaryIndices);
  primary.computeBoundingBox();
  const secondary = geometry.clone();
  secondary.setIndex(secondaryIndices);
  secondary.computeBoundingBox();
  return { primary, secondary };
};

export const loadManufacturerCad = (): Promise<ManufacturerCad> => {
  if (!manufacturerCadPromise) {
    manufacturerCadPromise = Promise.all([
      importAsset(profile3030Step),
      importAsset(profile3060Step),
      importAsset(glr3030Step),
      importAsset(cbr3030Step),
      importAsset(cbr3060Step),
      importAsset(gsd082Step),
      importAsset(cfg3030Step),
    ]).then(([profile3030, profile3060, glr3030, cbr3030, cbr3060, gsd082, cfg3030]) => {
      const profile3030Geometry = meshGeometry(profile3030);
      // Supplier 3030 STEP runs along Y. Render members conventionally along X.
      profile3030Geometry.rotateZ(Math.PI / 2);
      profile3030Geometry.computeBoundingBox();
      const profile3060Geometry = meshGeometry(profile3060);
      // Supplier 3060 STEP also runs along Y. Render members conventionally along X.
      profile3060Geometry.rotateZ(Math.PI / 2);
      profile3060Geometry.computeBoundingBox();
      const glr3030Geometry = meshGeometry(glr3030);
      // Supplier GLR3030 STEP runs along Z. Door local Y is vertical.
      glr3030Geometry.rotateX(-Math.PI / 2);
      glr3030Geometry.computeBoundingBox();
      const glr3030Parts = splitGlr3030AtPivot(glr3030Geometry);
      const gsd082GuideGeometry = orientLongestAxisToX(meshGeometry(gsd082));
      const cfg3030Parts = splitCfg3030RigidBodiesAtPivot(
        orientLongestAxisToX(meshGeometry(cfg3030)),
      );
      return Object.freeze({
        profile3030Geometry,
        profile3030StockLengthMm,
        profile3060Geometry,
        profile3060StockLengthMm,
        glr3030LeafGeometry: glr3030Parts.leaf,
        glr3030StationaryGeometry: glr3030Parts.stationary,
        cbr3030Geometry: cbr3030Geometry(cbr3030),
        cbr3060Geometry: cbr3060Geometry(cbr3060),
        gsd082GuideGeometry,
        gsd082GuideCadReferenceLengthMm,
        cfg3030PrimaryGeometry: cfg3030Parts.primary,
        cfg3030SecondaryGeometry: cfg3030Parts.secondary,
      });
    });
  }
  return manufacturerCadPromise;
};

import { importSTEP, type Shape3D } from "replicad";
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import profile3030Step from "../../AST03003004.step?raw";
import profile3060Step from "../../AST03006006.step?raw";
import glr3030Step from "../../GLR3030.step?raw";

export type ManufacturerCad = Readonly<{
  /** Local X is the cut length; the supplied STEP stock segment is 100 mm. */
  profile3030Geometry: BufferGeometry;
  profile3030StockLengthMm: number;
  profile3060Geometry: BufferGeometry;
  profile3060StockLengthMm: number;
  /** Local Y is the hinge axis; its CAD barrel axis is at the local origin. */
  glr3030LeafGeometry: BufferGeometry;
  glr3030StationaryGeometry: BufferGeometry;
}>;

const profile3030StockLengthMm = 100;
const profile3060StockLengthMm = 100;
const glr3030BarrelRadiusMm = 8;
let manufacturerCadPromise: Promise<ManufacturerCad> | undefined;

const meshGeometry = (shape: Shape3D): BufferGeometry => {
  const mesh = shape.mesh({ tolerance: 0.01, angularTolerance: 0.1 });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(mesh.vertices, 3));
  geometry.setIndex(mesh.triangles);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const center = geometry.boundingBox!.getCenter(new Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  return geometry;
};

const importAsset = async (stepText: string): Promise<Shape3D> =>
  (await importSTEP(new Blob([stepText]))).asShape3D();

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

export const loadManufacturerCad = (): Promise<ManufacturerCad> => {
  if (!manufacturerCadPromise) {
    manufacturerCadPromise = Promise.all([
      importAsset(profile3030Step),
      importAsset(profile3060Step),
      importAsset(glr3030Step),
    ]).then(([profile3030, profile3060, glr3030]) => {
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
      return Object.freeze({
        profile3030Geometry,
        profile3030StockLengthMm,
        profile3060Geometry,
        profile3060StockLengthMm,
        glr3030LeafGeometry: glr3030Parts.leaf,
        glr3030StationaryGeometry: glr3030Parts.stationary,
      });
    });
  }
  return manufacturerCadPromise;
};

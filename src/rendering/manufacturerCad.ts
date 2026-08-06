import { importSTEP, Shell, Solid, type Shape3D } from "replicad";
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
  /** Local Y is the hinge axis; every supplier OPEN_SHELL remains intact. */
  glr3030LeafGeometries: readonly BufferGeometry[];
  glr3030StationaryGeometries: readonly BufferGeometry[];
  glr3030PivotToMountingPlaneMm: number;
  cbr3030Geometry: BufferGeometry;
  cbr3060Geometry: BufferGeometry;
  /** Local X follows the downloaded 1 m GSD082 reference segment. */
  gsd082GuideGeometry: BufferGeometry;
  gsd082GuideCadReferenceLengthMm: number;
  /** Exact CAD for the two-leaf Elesa CFG.30/30 inter-leaf hinge. */
  cfg3030PrimaryWingGeometry: BufferGeometry;
  cfg3030PinGeometry: BufferGeometry;
  cfg3030SecondaryWingGeometry: BufferGeometry;
  /** CAD Y=-8 is the mounting plane and CAD Z is the pin axis. */
  cfg3030PivotToMountingPlaneMm: number;
}>;

const profile3030StockLengthMm = 100;
const profile3060StockLengthMm = 100;
const gsd082GuideCadReferenceLengthMm = 1000;
const glr3030PivotToMountingPlaneMm = 8;
const cfg3030PivotToMountingPlaneMm = 8;
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

type ShapeWithShellTopology = Shape3D & {
  _listTopo(topo: "shell"): Array<ConstructorParameters<typeof Shell>[0]>;
};

/**
 * GLR3030 is supplied as seven open shells rather than solids. Keep those
 * authored shell bodies intact: the single 500 mm shell is the moving leaf;
 * the two end blocks, spacers, and pin caps form the stationary side.
 */
const glr3030RigidBodies = (shape: Shape3D) => {
  const [minimum, maximum] = shape.boundingBox.bounds;
  const pivot = {
    x: (minimum[0] + maximum[0]) / 2,
    y: (minimum[1] + maximum[1]) / 2,
    z: (minimum[2] + maximum[2]) / 2,
  };
  const shells = (shape as ShapeWithShellTopology)
    ._listTopo("shell")
    .map((shell) => new Shell(shell));
  if (shells.length !== 7)
    throw new Error(`GLR3030 STEP must contain exactly seven open shells; got ${shells.length}`);
  const classified = shells.map((shell) => {
    const [shellMinimum, shellMaximum] = shell.boundingBox.bounds;
    return { shell, supplierAxisExtentMm: shellMaximum[2] - shellMinimum[2] };
  });
  const moving = classified.filter((body) => body.supplierAxisExtentMm > 400);
  if (moving.length !== 1) throw new Error("GLR3030 STEP must contain one long moving-leaf shell");
  const orientFromSupplierDatum = (shell: Shell): BufferGeometry => {
    const geometry = meshGeometry(shell, false);
    geometry.translate(-pivot.x, -pivot.y, -pivot.z);
    // Supplier Z becomes vertical local Y. This sign puts CAD Y=-8 on the
    // profile mounting plane and the pin 8 mm farther outside the enclosure.
    geometry.rotateX(Math.PI / 2);
    geometry.computeBoundingBox();
    return geometry;
  };
  return {
    leaf: moving.map((body) => orientFromSupplierDatum(body.shell)),
    stationary: classified
      .filter((body) => body !== moving[0])
      .map((body) => orientFromSupplierDatum(body.shell)),
  };
};

type ShapeWithSolidTopology = Shape3D & {
  _listTopo(topo: "solid"): Array<ConstructorParameters<typeof Solid>[0]>;
};

/**
 * Mesh the three supplier-authored solids independently. Replicad's compound
 * mesh does not share vertices between adjacent B-rep faces, so triangle
 * connectivity is not a rigid-body boundary and must never be used here.
 */
const cfg3030RigidBodies = (shape: Shape3D) => {
  const solidShapes = (shape as ShapeWithSolidTopology)
    ._listTopo("solid")
    .map((solid) => new Solid(solid));
  if (solidShapes.length !== 3)
    throw new Error(`CFG STEP must contain exactly three solids; got ${solidShapes.length}`);

  const classified = solidShapes.map((solid) => {
    const [minimum, maximum] = solid.boundingBox.bounds;
    return {
      solid,
      centreX: (minimum[0] + maximum[0]) / 2,
      extentX: maximum[0] - minimum[0],
    };
  });
  const pin = classified.find((body) => body.extentX < cfg3030PivotToMountingPlaneMm * 2);
  const wings = classified.filter((body) => body !== pin).sort((a, b) => a.centreX - b.centreX);
  if (!pin || wings.length !== 2 || wings[0]!.centreX >= 0 || wings[1]!.centreX <= 0)
    throw new Error("CFG STEP solids do not match the calibrated left-wing/pin/right-wing layout");

  return {
    primaryWing: meshGeometry(wings[0]!.solid, false),
    pin: meshGeometry(pin.solid, false),
    secondaryWing: meshGeometry(wings[1]!.solid, false),
  };
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
      const glr3030Parts = glr3030RigidBodies(glr3030);
      const gsd082GuideGeometry = orientLongestAxisToX(meshGeometry(gsd082));
      const cfg3030Parts = cfg3030RigidBodies(cfg3030);
      return Object.freeze({
        profile3030Geometry,
        profile3030StockLengthMm,
        profile3060Geometry,
        profile3060StockLengthMm,
        glr3030LeafGeometries: Object.freeze(glr3030Parts.leaf),
        glr3030StationaryGeometries: Object.freeze(glr3030Parts.stationary),
        glr3030PivotToMountingPlaneMm,
        cbr3030Geometry: cbr3030Geometry(cbr3030),
        cbr3060Geometry: cbr3060Geometry(cbr3060),
        gsd082GuideGeometry,
        gsd082GuideCadReferenceLengthMm,
        cfg3030PrimaryWingGeometry: cfg3030Parts.primaryWing,
        cfg3030PinGeometry: cfg3030Parts.pin,
        cfg3030SecondaryWingGeometry: cfg3030Parts.secondaryWing,
        cfg3030PivotToMountingPlaneMm,
      });
    });
  }
  return manufacturerCadPromise;
};

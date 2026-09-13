// Generate prototype parts, not manufacturing-release door hardware. Node 24.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import { makeBox, makeCylinder, measureVolume, setOC } from "replicad";
import { printedBifoldGuide as p, evaluatePrintedGuide } from "../src/domain/printedBifoldGuide.ts";
import {
  bifoldAssemblyStudyDefaults,
  evaluateBifoldAssemblyStudy,
} from "../src/domain/bifoldAssemblyStudy.ts";

// The installed Emscripten bundle expects CommonJS globals even when imported
// as ESM. Supply them only inside this standalone generator process.
globalThis.require = createRequire(import.meta.url);
globalThis.__dirname = new URL(
  "../node_modules/replicad-opencascadejs/src/",
  import.meta.url,
).pathname;
setOC(
  await opencascade({
    wasmBinary: await readFile(
      new URL("../node_modules/replicad-opencascadejs/src/replicad_single.wasm", import.meta.url),
    ),
  }),
);

const bodyHeight = p.roofThicknessMm + p.cavityHeightMm;
const epsilon = 1;
const stations = (length) => [p.mountingEndInsetMm, length / 2, length - p.mountingEndInsetMm];
const railBody = (length) => {
  let shape = makeBox([0, -p.outerWidthMm / 2, 0], [length, p.outerWidthMm / 2, bodyHeight]);
  shape = shape.cut(
    makeBox(
      [-epsilon, -p.channelWidthMm / 2, p.roofThicknessMm],
      [length + epsilon, p.channelWidthMm / 2, bodyHeight + epsilon],
    ),
  );
  for (const x of stations(length)) {
    for (const sign of [-1, 1]) {
      shape = shape.cut(
        makeCylinder(p.mountingHoleDiameterMm / 2, bodyHeight + 2 * epsilon, [
          x,
          sign * p.mountingRowOffsetMm,
          -epsilon,
        ]),
      );
    }
  }
  for (const y of [-p.keyRowOffsetMm, p.keyRowOffsetMm]) {
    for (const x of [-epsilon, length - p.keyPocketLengthMm]) {
      shape = shape.cut(
        makeBox(
          [x, y - p.keyPocketWidthMm / 2, -epsilon],
          [x + p.keyPocketLengthMm + epsilon, y + p.keyPocketWidthMm / 2, p.keyPocketDepthMm],
        ),
      );
    }
  }
  return shape.translate([0, p.outerWidthMm / 2, 0]);
};
const keeperStrip = (length) => {
  const width = (p.outerWidthMm - p.throatWidthMm) / 2;
  let shape = makeBox([0, 0, 0], [length, width, p.keeperStripThicknessMm]);
  for (const x of stations(length)) {
    shape = shape.cut(
      makeCylinder(p.mountingHoleDiameterMm / 2, p.keeperStripThicknessMm + 2 * epsilon, [
        x,
        p.mountingRowOffsetMm - p.throatWidthMm / 2,
        -epsilon,
      ]),
    );
  }
  return shape;
};
const output = new URL("../engineering/bifold-assembly/printed-guide/", import.meta.url);
await mkdir(output, { recursive: true });
const artifacts = [];
const exportPart = async (name, shape, quantity, use) => {
  const bounds = shape.boundingBox.bounds;
  const size = bounds[1].map((v, i) => v - bounds[0][i]);
  if (size.some((v) => !Number.isFinite(v) || v > p.bedSideMm - 2 * p.brimMm))
    throw new Error(`${name} does not fit the A1 mini with brim`);
  const volumeMm3 = measureVolume(shape);
  if (!(volumeMm3 > 0)) throw new Error(`${name} has no solid volume`);
  const stl = shape.blobSTL({ binary: true, tolerance: 0.05, angularTolerance: 0.1 });
  await writeFile(new URL(`${name}.stl`, output), Buffer.from(await stl.arrayBuffer()));
  artifacts.push({
    name,
    quantity,
    use,
    sizeMm: size.map((v) => Number(v.toFixed(3))),
    solidVolumeCm3: volumeMm3 / 1000,
    stlBytes: stl.size,
  });
  shape.delete();
};

await exportPart(
  "coupon-body-60",
  railBody(p.couponLengthMm),
  2,
  "Print first: two modules for a supported joint/roller test",
);
await exportPart(
  "coupon-keeper-strip-60",
  keeperStrip(p.couponLengthMm),
  4,
  "Print first: two strips per coupon body; invert one for the other side",
);
await exportPart(
  "alignment-key",
  makeBox([0, 0, 0], [p.keyLengthMm, p.keyWidthMm, p.keyThicknessMm]),
  2,
  "Two keys for the coupon seam; full rails need eight keys each",
);
const plans = [];
for (const [name, width, space, target] of [
  ["rear", 750, 450, 400],
  ["left", 824.5, 800, 500],
]) {
  const motion = evaluateBifoldAssemblyStudy({
    ...bifoldAssemblyStudyDefaults,
    leafHeightMm: 740 - p.provisionalHeadAllowanceMm - 3,
    openingWidthMm: width,
    availableOutwardSpaceMm: space,
    targetOutwardSweepMm: target,
  });
  const plan = evaluatePrintedGuide(width, motion.guideTravelMinMm, motion.guideTravelMaxMm);
  plans.push({ name, ...plan, provisionalLeafHeightMm: motion.input.leafHeightMm });
  await exportPart(
    `${name}-body`,
    railBody(plan.moduleLengthMm),
    plan.moduleCount,
    "Deferred full-length prototype: only after coupon acceptance",
  );
  await exportPart(
    `${name}-keeper-strip`,
    keeperStrip(plan.moduleLengthMm),
    plan.keeperStripCount,
    "Deferred full-length prototype: only after coupon acceptance",
  );
}
await writeFile(
  new URL("prototype-manifest.json", output),
  JSON.stringify({ revision: "C", status: p.status, dimensions: p, plans, artifacts }, null, 2) +
    "\n",
);
execFileSync(new URL("../node_modules/.bin/vp", import.meta.url).pathname, [
  "fmt",
  new URL("prototype-manifest.json", output).pathname,
]);
console.log(
  `Generated ${artifacts.length} positive-volume prototype STLs; each fits a 180 mm bed with a 5 mm brim.`,
);
for (const plan of plans)
  console.log(
    `${plan.name}: ${plan.moduleCount} modules of ${plan.moduleLengthMm.toFixed(2)} mm; ${plan.mountingScrewCount} mounting screws; provisional leaf height ${plan.provisionalLeafHeightMm} mm.`,
  );

// Reproducible engineering review artifacts. Node 24 runs the pure TS evaluator.
// This adapter never changes enclosure geometry, procurement exports or hardware selection.
import { mkdir, writeFile } from "node:fs/promises";
import {
  bifoldAssemblyStudyDefaults,
  evaluateBifoldAssemblyStudy,
} from "../src/domain/bifoldAssemblyStudy.ts";

// Snapshot of the task's evaluated enclosure envelope; keep the study inputs
// explicit in the exported report. This is not a replacement UI configuration.
const enclosureWidthMm = 1674;
const enclosureDepthMm = 1649;
const cases = [
  { name: "Left rear", face: "left", width: enclosureDepthMm / 2, space: 800, target: 500 },
  { name: "Back right", face: "back", width: 750, space: 450, target: 400 },
];
const studies = cases.map((opening) => ({
  ...opening,
  result: evaluateBifoldAssemblyStudy({
    ...bifoldAssemblyStudyDefaults,
    openingWidthMm: opening.width,
    availableOutwardSpaceMm: opening.space,
    targetOutwardSweepMm: opening.target,
  }),
}));

const summary = studies.map(({ name, face, result }) => {
  const { poses, ...metrics } = result;
  const worldX = poses.flatMap((pose) =>
    [...pose.primaryPolygon, ...pose.secondaryPolygon].map((p) =>
      face === "left" ? -p.y : enclosureWidthMm - p.x,
    ),
  );
  const allowance = result.input.hardwareEnvelopeAllowanceMm;
  return {
    name,
    ...metrics,
    sampleCount: poses.length,
    parkedFoldAngleDeg: poses.at(-1).foldAngleDeg,
    closedGuideCentreMm: poses[0].guideCentre,
    parkedGuideCentreMm: poses.at(-1).guideCentre,
    worldXEnvelopeMm: {
      min: Math.min(...worldX) - allowance,
      max: Math.max(...worldX) + allowance,
    },
    selectedPoses: [poses[0], poses.find((pose) => pose.primaryAngleDeg === 45), poses.at(-1)],
  };
});
const report = {
  revision: "B",
  status: "sampled-design-study-not-manufacturing-release",
  enclosureEnvelopeSnapshotMm: { width: enclosureWidthMm, depth: enclosureDepthMm },
  limitations: [
    "Leaf rectangles sampled every 0.25 degrees; no continuous-motion or supplier-solid collision proof.",
    "15 mm envelope allowance is reserved for fittings, not a verified hardware envelope.",
    "Frame, rail, handle, seal and bracket solids, tolerances, sag and loading remain to be verified.",
    "Current application still displays the previous mechanism; this is a separate engineering study.",
  ],
  studies: summary,
  sampledMutualXSeparationMm: summary[1].worldXEnvelopeMm.min - summary[0].worldXEnvelopeMm.max,
};

const n = (value) => value.toFixed(1);
const polygon = (vertices) => vertices.map((p) => `${n(p.x)},${n(-p.y)}`).join(" ");
const panels = studies
  .map(({ name, result }, index) => {
    const x = 50 + index * 595;
    const poses = [
      result.poses[0],
      result.poses.find((p) => p.primaryAngleDeg === 45),
      result.poses.at(-1),
    ];
    const colours = ["#64748b", "#d97706", "#0f766e"];
    const geometry = poses
      .map(
        (pose, i) => `
    <g fill="${colours[i]}" fill-opacity="${i === 2 ? 0.32 : 0.12}" stroke="${colours[i]}" stroke-width="2">
      <polygon points="${polygon(pose.primaryPolygon)}"/>
      <polygon points="${polygon(pose.secondaryPolygon)}"/>
      <circle cx="${n(pose.guideCentre.x)}" cy="${n(-pose.guideCentre.y)}" r="11"/>
    </g>`,
      )
      .join("");
    return `<g transform="translate(${x},0)">
    <text x="0" y="135" class="title">${name} · ${n(result.input.openingWidthMm)} mm opening</text>
    <text x="0" y="165">Leaves ${n(result.primaryWidthMm)} / ${n(result.secondaryWidthMm)} × 702 mm</text>
    <g transform="translate(25,440) scale(0.58)">
      <rect x="-30" y="0" width="30" height="30" fill="#334155"/>
      <rect x="${result.input.openingWidthMm}" y="0" width="30" height="30" fill="#334155"/>
      <line x1="-30" y1="0" x2="${result.input.openingWidthMm + 30}" y2="0" stroke="#94a3b8" stroke-dasharray="8 6"/>
      <line x1="${n(result.guideTravelMinMm - 16)}" y1="15" x2="${n(result.guideTravelMaxMm + 16)}" y2="15" stroke="#475569" stroke-width="4"/>
      ${geometry}
      <circle cx="2.5" cy="-8" r="5" fill="#111827"/>
      <text x="-22" y="-25" font-size="24">A</text>
    </g>
    <text x="0" y="490">Sampled sweep + fittings allowance: ${n(result.reservedSweepMm)} mm</text>
    <text x="0" y="518">Remaining space: ${n(result.remainingOutwardSpaceMm)} mm</text>
    <text x="0" y="546">Parked usable width: ${n(result.parkedUsableWidthMm)} mm</text>
    <text x="0" y="574">Guide centre travel: ${n(result.guideTravelMinMm)}–${n(result.guideTravelMaxMm)} mm</text>
  </g>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 960" role="img" aria-labelledby="title description">
  <title id="title">Bifold assembly study, revision B</title>
  <desc id="description">Plan views of left and rear doors at closed, 45 degree and 88 degree positions, with preliminary captive guide cross-section. Dimensions in millimetres. Not for manufacture.</desc>
  <style>text { font-family: sans-serif; font-size: 17px; fill: #1e293b; } .title { font-size: 22px; font-weight: 600; } .small { font-size: 15px; }</style>
  <rect width="1240" height="960" fill="#f8fafc"/>
  <text x="50" y="48" font-size="30" font-weight="700">Bifold assembly · revision B</text>
  <text x="50" y="78">Engineering study · all dimensions mm · supplier preparation and physical validation pending</text>
  ${panels}
  <g transform="translate(50,625)">
    <text x="0" y="0" fill="#64748b">Grey: closed</text>
    <text x="170" y="0" fill="#d97706">Amber: 45°</text>
    <text x="340" y="0" fill="#0f766e">Green: parked at 88°</text>
    <text x="0" y="36" class="small">A = fixed pivot. Circles = vertical guide rollers. Outward is upward; views use the same scale.</text>
    <text x="0" y="62" class="small">Minimum sampled leaf-to-leaf clearance: 5 mm. Hinge, bracket, handle and seal solids are not represented.</text>
  </g>
  <g transform="translate(65,765)">
    <text x="0" y="-22" class="title">Guide section · preliminary, enlarged</text>
    <g transform="translate(0,0) scale(3)">
      <path d="M0 30 V0 H29 V30 H26 V3 H3 V30 Z" fill="#94a3b8"/>
      <rect x="0" y="27" width="9.5" height="3" fill="#475569"/>
      <rect x="19.5" y="27" width="9.5" height="3" fill="#475569"/>
      <rect x="3.5" y="8" width="22" height="7" fill="#0f766e"/>
      <rect x="12" y="6" width="5" height="32" fill="#334155"/>
      <rect x="4.5" y="21" width="20" height="3" fill="#475569"/>
    </g>
    <text x="125" y="18">23 mm internal width · 22 mm POM roller</text>
    <text x="125" y="46">10 mm bottom slot · separate 20 mm steel keeper</text>
    <text x="125" y="74">Vertical steel axle · door mass stays on the hinges</text>
    <text x="125" y="102" class="small">Axle stack, fastening, tolerances and keeper strength require supplier detailing.</text>
  </g>
  <text x="50" y="935" class="small">Generated by scripts/bifold-assembly-study.mjs from src/domain/bifoldAssemblyStudy.ts · NOT FOR MANUFACTURE</text>
</svg>`;

const output = new URL("../engineering/bifold-assembly/", import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL("revision-b.json", output), JSON.stringify(report, null, 2) + "\n");
await writeFile(new URL("revision-b.svg", output), svg + "\n");
for (const s of summary) {
  console.log(
    `${s.name}: sweep ${n(s.reservedSweepMm)} mm, reserve ${n(s.remainingOutwardSpaceMm)} mm, usable opening ${n(s.parkedUsableWidthMm)} mm`,
  );
}
console.log(
  `Sampled mutual X separation: ${n(report.sampledMutualXSeparationMm)} mm (with reserved fittings envelopes)`,
);

/**
 * Revision B engineering study, not released manufacturing geometry.
 * Local x runs from the parking jamb across the opening; y points outward
 * from the closed exterior face. All coordinates and lengths are in mm.
 * The active enclosure/rendered hardware is not changed by this evaluator.
 */
export type StudyPoint = Readonly<{ x: number; y: number }>;

export type BifoldAssemblyStudyInput = Readonly<{
  openingWidthMm: number;
  leafHeightMm: number;
  frameDepthMm: number;
  jambGapMm: number;
  meetingGapMm: number;
  pivotToMountingPlaneMm: number;
  secondaryExtraWidthMm: number;
  guideInsetFromFreeEdgeMm: number;
  parkedAngleDeg: number;
  sampleStepDeg: number;
  hardwareEnvelopeAllowanceMm: number;
  availableOutwardSpaceMm: number;
  targetOutwardSweepMm: number;
}>;

export type BifoldAssemblyStudyPose = Readonly<{
  primaryAngleDeg: number;
  foldAngleDeg: number;
  framePivot: StudyPoint;
  interleafPivot: StudyPoint;
  guideCentre: StudyPoint;
  primaryPolygon: readonly StudyPoint[];
  secondaryPolygon: readonly StudyPoint[];
  leafClearanceMm: number;
}>;

const rotate = (p: StudyPoint, angle: number): StudyPoint => ({
  x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
  y: p.x * Math.sin(angle) + p.y * Math.cos(angle),
});
const add = (a: StudyPoint, b: StudyPoint): StudyPoint => ({ x: a.x + b.x, y: a.y + b.y });
const subtract = (a: StudyPoint, b: StudyPoint): StudyPoint => ({ x: a.x - b.x, y: a.y - b.y });
const rectangle = (x: number, width: number, depth: number): readonly StudyPoint[] => [
  { x, y: -depth },
  { x: x + width, y: -depth },
  { x: x + width, y: 0 },
  { x, y: 0 },
];
const edges = (polygon: readonly StudyPoint[]) =>
  polygon.map((p, i) => [p, polygon[(i + 1) % polygon.length]] as const);

const pointSegmentDistance = (p: StudyPoint, a: StudyPoint, b: StudyPoint): number => {
  const v = subtract(b, a);
  const w = subtract(p, a);
  const fraction = Math.max(0, Math.min(1, (w.x * v.x + w.y * v.y) / (v.x ** 2 + v.y ** 2)));
  return Math.hypot(w.x - fraction * v.x, w.y - fraction * v.y);
};

/** Separating-axis overlap test, then Euclidean edge clearance for rectangles. */
const polygonClearance = (a: readonly StudyPoint[], b: readonly StudyPoint[]): number => {
  const separated = [...edges(a), ...edges(b)].some(([p, q]) => {
    const axis = { x: p.y - q.y, y: q.x - p.x };
    const project = (polygon: readonly StudyPoint[]) =>
      polygon.map((v) => v.x * axis.x + v.y * axis.y);
    const pa = project(a);
    const pb = project(b);
    return Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa);
  });
  if (!separated) return 0;
  return Math.min(
    ...a.flatMap((p) => edges(b).map(([q, r]) => pointSegmentDistance(p, q, r))),
    ...b.flatMap((p) => edges(a).map(([q, r]) => pointSegmentDistance(p, q, r))),
  );
};

export const evaluateBifoldAssemblyStudy = (input: BifoldAssemblyStudyInput) => {
  for (const [name, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0)
      throw new Error(`${name} must be finite and nonnegative`);
  }
  if (input.sampleStepDeg <= 0 || input.sampleStepDeg > 1)
    throw new Error("sampleStepDeg must be greater than zero and at most one degree");
  if (input.parkedAngleDeg <= 0 || input.parkedAngleDeg > 90)
    throw new Error("parkedAngleDeg must be greater than zero and at most 90 degrees");
  if (input.frameDepthMm <= 0 || input.leafHeightMm <= 0)
    throw new Error("Frame depth and leaf height must be positive");
  const combinedWidth = input.openingWidthMm - 2 * input.jambGapMm - input.meetingGapMm;
  const primaryWidthMm = (combinedWidth - input.secondaryExtraWidthMm) / 2;
  const secondaryWidthMm = combinedWidth - primaryWidthMm;
  if (primaryWidthMm <= 2 * input.frameDepthMm || secondaryWidthMm <= 2 * input.frameDepthMm)
    throw new Error("Opening is too small for the proposed leaf frames");
  if (input.guideInsetFromFreeEdgeMm >= secondaryWidthMm)
    throw new Error("Guide centre must be inside the secondary leaf width");

  const a = { x: input.jambGapMm / 2, y: input.pivotToMountingPlaneMm };
  const bClosed = {
    x: input.jambGapMm + primaryWidthMm + input.meetingGapMm / 2,
    y: -input.frameDepthMm - input.pivotToMountingPlaneMm,
  };
  const guideLineYmm = -input.frameDepthMm / 2;
  const cClosed = {
    x: input.openingWidthMm - input.jambGapMm - input.guideInsetFromFreeEdgeMm,
    y: guideLineYmm,
  };
  const p = subtract(bClosed, a);
  const q = subtract(cClosed, bClosed);
  if (q.x <= 0) throw new Error("Guide must lie beyond the interleaf pivot in closure");
  const primaryClosed = rectangle(input.jambGapMm, primaryWidthMm, input.frameDepthMm);
  const secondaryClosed = rectangle(
    input.jambGapMm + primaryWidthMm + input.meetingGapMm,
    secondaryWidthMm,
    input.frameDepthMm,
  );
  const sampleCount = Math.ceil(input.parkedAngleDeg / input.sampleStepDeg);
  if (sampleCount > 10000) throw new Error("Study exceeds 10000 motion intervals");
  const poses: BifoldAssemblyStudyPose[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const primaryAngleDeg = (input.parkedAngleDeg * i) / sampleCount;
    const theta = (primaryAngleDeg * Math.PI) / 180;
    const b = add(a, rotate(p, theta));
    const ratio = (guideLineYmm - b.y) / Math.hypot(q.x, q.y);
    if (Math.abs(ratio) > 1 + 1e-10)
      throw new Error(`Guide unreachable at ${primaryAngleDeg} degrees`);
    const phi = Math.asin(Math.max(-1, Math.min(1, ratio))) - Math.atan2(q.y, q.x);
    const foldAngleDeg = primaryAngleDeg - (phi * 180) / Math.PI;
    if (foldAngleDeg < -1e-8 || foldAngleDeg > 180 + 1e-8)
      throw new Error(`Interleaf hinge rotation exceeded at ${primaryAngleDeg} degrees`);
    const primaryPolygon = primaryClosed.map((v) => add(a, rotate(subtract(v, a), theta)));
    const secondaryPolygon = secondaryClosed.map((v) => add(b, rotate(subtract(v, bClosed), phi)));
    poses.push({
      primaryAngleDeg,
      foldAngleDeg,
      framePivot: a,
      interleafPivot: b,
      guideCentre: add(b, rotate(q, phi)),
      primaryPolygon,
      secondaryPolygon,
      leafClearanceMm: polygonClearance(primaryPolygon, secondaryPolygon),
    });
  }
  const vertices = poses.flatMap((pose) => [...pose.primaryPolygon, ...pose.secondaryPolygon]);
  const parked = poses[poses.length - 1];
  const bareLeafSweepMm = Math.max(...vertices.map((v) => v.y));
  const reservedSweepMm = bareLeafSweepMm + input.hardwareEnvelopeAllowanceMm;
  const parkedObstructionMm =
    Math.max(...[...parked.primaryPolygon, ...parked.secondaryPolygon].map((v) => v.x)) +
    input.hardwareEnvelopeAllowanceMm;
  return {
    status: "sampled-design-study-not-manufacturing-release" as const,
    input,
    primaryWidthMm,
    secondaryWidthMm,
    guideLineYmm,
    primaryLinkMm: p,
    secondaryLinkMm: q,
    poses,
    bareLeafSweepMm,
    reservedSweepMm,
    remainingOutwardSpaceMm: input.availableOutwardSpaceMm - reservedSweepMm,
    meetsSweepTarget: reservedSweepMm <= input.targetOutwardSweepMm,
    minimumSampledLeafClearanceMm: Math.min(...poses.map((pose) => pose.leafClearanceMm)),
    parkedObstructionMm,
    parkedUsableWidthMm: Math.max(0, input.openingWidthMm - parkedObstructionMm),
    guideTravelMinMm: Math.min(...poses.map((pose) => pose.guideCentre.x)),
    guideTravelMaxMm: Math.max(...poses.map((pose) => pose.guideCentre.x)),
  };
};

/** User constraints plus explicitly provisional engineering choices, revision B. */
export const bifoldAssemblyStudyDefaults = Object.freeze({
  leafHeightMm: 702,
  frameDepthMm: 30,
  jambGapMm: 5,
  meetingGapMm: 5,
  // CFG.30/30 supplier STEP mounting plane to pin axis, already measured in the project.
  pivotToMountingPlaneMm: 8,
  secondaryExtraWidthMm: 40,
  guideInsetFromFreeEdgeMm: 15,
  parkedAngleDeg: 88,
  sampleStepDeg: 0.25,
  // A reserved envelope, not a collision-checked catalogue hardware assembly.
  hardwareEnvelopeAllowanceMm: 15,
});

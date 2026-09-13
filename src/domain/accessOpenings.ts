/**
 * The agreed access topology, intentionally independent of the current
 * EnclosureV2 evaluator. It records where future opening geometry belongs,
 * but does not claim evaluated dimensions, hinge selection, or collision
 * clearance.
 */
export type AccessFace = "front" | "left" | "back";

export type AccessOpeningId =
  | "access-opening:front-main"
  | "access-opening:left-rear"
  | "access-opening:back-right";

export type AccessDoorLeafId =
  | "access-leaf:front-main-left"
  | "access-leaf:front-main-right"
  | "access-leaf:left-rear-frame"
  | "access-leaf:left-rear-folding"
  | "access-leaf:back-right-frame"
  | "access-leaf:back-right-folding";

/**
 * A face-relative opening range. "Rear" and "right" retain the stakeholder's
 * directional intent; a later evaluator must map them onto signed axes.
 */
export type AccessOpeningBoundsIntent = Readonly<{
  referencePlane: "face-opening-viewed-from-outside";
  horizontalCoverage: "full-face-width" | "rear-half-of-face" | "right-half-of-face";
  verticalCoverage: "full-face-height";
  evaluatedBoundsStatus: "topology-only";
}>;

export type AccessDoorLeaf = Readonly<{
  id: AccessDoorLeafId;
  /** The leaf fixed directly to the enclosure frame, or its folding mate. */
  role: "frame-pivot" | "folding-mate" | "primary";
}>;

export type AccessDoorConfiguration = Readonly<{
  kind: "outward-double" | "outward-bi-fold";
  leafCount: 2;
  leaves: readonly AccessDoorLeaf[];
  /** The agreed folded-stack destination; front leaves split to their own sides. */
  parkDirection: "split-left-and-right" | "toward-back" | "toward-right";
}>;

/** The access leaves retain panels inside their own door-frame T-slots. */
export type InsetDoorPanelIntent = Readonly<{
  installation: "inset-in-door-frame-slots";
  sealAndRetainerStatus: "to-be-selected";
  slotAllocationStatus: "to-be-modelled";
}>;

export type AccessOpening = Readonly<{
  id: AccessOpeningId;
  label: string;
  face: AccessFace;
  boundsIntent: AccessOpeningBoundsIntent;
  doors: AccessDoorConfiguration;
  panelIntent: InsetDoorPanelIntent;
}>;

const topologyOnlyBounds = (
  horizontalCoverage: AccessOpeningBoundsIntent["horizontalCoverage"],
): AccessOpeningBoundsIntent =>
  Object.freeze({
    referencePlane: "face-opening-viewed-from-outside",
    horizontalCoverage,
    verticalCoverage: "full-face-height",
    evaluatedBoundsStatus: "topology-only",
  });

const insetDoorPanelIntent: InsetDoorPanelIntent = Object.freeze({
  installation: "inset-in-door-frame-slots",
  sealAndRetainerStatus: "to-be-selected",
  slotAllocationStatus: "to-be-modelled",
});

/**
 * The agreed three-opening access topology. Future frame, hinge, and panel
 * work must evaluate this specification rather than infer access openings from
 * renderer coordinates.
 */
export const agreedAccessOpenings: readonly AccessOpening[] = Object.freeze([
  Object.freeze({
    id: "access-opening:front-main",
    label: "Front main double doors",
    face: "front",
    boundsIntent: topologyOnlyBounds("full-face-width"),
    doors: Object.freeze({
      kind: "outward-double",
      leafCount: 2,
      leaves: Object.freeze([
        Object.freeze({ id: "access-leaf:front-main-left", role: "primary" }),
        Object.freeze({ id: "access-leaf:front-main-right", role: "primary" }),
      ]),
      parkDirection: "split-left-and-right",
    }),
    panelIntent: insetDoorPanelIntent,
  }),
  Object.freeze({
    id: "access-opening:left-rear",
    label: "Left rear bi-fold access door",
    face: "left",
    boundsIntent: topologyOnlyBounds("rear-half-of-face"),
    doors: Object.freeze({
      kind: "outward-bi-fold",
      leafCount: 2,
      leaves: Object.freeze([
        Object.freeze({ id: "access-leaf:left-rear-frame", role: "frame-pivot" }),
        Object.freeze({ id: "access-leaf:left-rear-folding", role: "folding-mate" }),
      ]),
      parkDirection: "toward-back",
    }),
    panelIntent: insetDoorPanelIntent,
  }),
  Object.freeze({
    id: "access-opening:back-right",
    label: "Back right bi-fold access door",
    face: "back",
    boundsIntent: topologyOnlyBounds("right-half-of-face"),
    doors: Object.freeze({
      kind: "outward-bi-fold",
      leafCount: 2,
      leaves: Object.freeze([
        Object.freeze({ id: "access-leaf:back-right-frame", role: "frame-pivot" }),
        Object.freeze({ id: "access-leaf:back-right-folding", role: "folding-mate" }),
      ]),
      parkDirection: "toward-right",
    }),
    panelIntent: insetDoorPanelIntent,
  }),
]);

export const accessOpeningById = (id: AccessOpeningId): AccessOpening => {
  const opening = agreedAccessOpenings.find((candidate) => candidate.id === id);
  if (!opening) throw new Error(`Unknown agreed access opening: ${id}`);
  return opening;
};

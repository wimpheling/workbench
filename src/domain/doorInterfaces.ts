import type { EnclosureV2Variables } from "./enclosureV2Design";
import type { DoorHingeInstallation } from "./doorHardware";

/** The four closed-state interfaces that must be accounted for on each leaf. */
export type DoorInterfaceKind = "hinge-edge" | "top" | "bottom" | "meeting-stile";

export type DoorLeafId = "left-door" | "right-door";

/**
 * A source value that is still an author-supplied placeholder, rather than a
 * clearance derived from selected hardware and measured/specified evidence.
 */
export type ProvisionalClearanceOverride = Readonly<{
  status: "provisional-override";
  sourceVariable: keyof Pick<
    EnclosureV2Variables,
    | "frontDoorSideClearanceMm"
    | "frontDoorTopClearanceMm"
    | "frontDoorBottomClearanceMm"
    | "frontDoorCentreGapMm"
  >;
  nominalHardGapMm: number;
}>;

export type UnconfiguredClosedStop = Readonly<{
  status: "unconfigured";
}>;

export type UnconfiguredSealContact = Readonly<{
  status: "unconfigured";
}>;

export type UnconfiguredOverlap = Readonly<{
  status: "unconfigured";
}>;

/** A future selected item will replace this with its mounting and swept volume. */
export type UnconfiguredHardwareKeepOut = Readonly<{
  status: "unconfigured";
}>;

export type SelectedLongHingeKeepOut = Readonly<{
  status: "selected-long-hinge";
  productCode: string;
  overallHeightMm: number;
  barrelDiameterMm: number;
  plateThicknessMm: number;
  geometryFidelity: "technical-drawing-envelope";
  pivotPlacementStatus: "verified-from-supplier-step";
  fitStatus: "fits-leaf-height" | "incompatible-leaf-height";
}>;

/**
 * One leaf-side view of a closed-door interface. This is intentionally a
 * specification boundary, not a solid model: no selected hinge, stop, seal,
 * latch, or handle is implied by the default record.
 */
export type DoorInterfaceRecord = Readonly<{
  id: `${DoorLeafId}.${DoorInterfaceKind}`;
  leafId: DoorLeafId;
  kind: DoorInterfaceKind;
  hardPartClearance: ProvisionalClearanceOverride;
  closedStop: UnconfiguredClosedStop;
  sealContact: UnconfiguredSealContact;
  overlap: UnconfiguredOverlap;
  hardwareKeepOut: UnconfiguredHardwareKeepOut | SelectedLongHingeKeepOut;
}>;

/**
 * The as-authored door-interface boundary. The default only mirrors the
 * existing clearance variables so it leaves evaluated door geometry unchanged.
 */
export type DoorInterfaceSpec = Readonly<{
  status: "provisional-unconfigured";
  interfaces: readonly DoorInterfaceRecord[];
}>;

const unconfiguredClosedStop: UnconfiguredClosedStop = Object.freeze({ status: "unconfigured" });
const unconfiguredSealContact: UnconfiguredSealContact = Object.freeze({ status: "unconfigured" });
const unconfiguredOverlap: UnconfiguredOverlap = Object.freeze({ status: "unconfigured" });
const unconfiguredHardwareKeepOut: UnconfiguredHardwareKeepOut = Object.freeze({
  status: "unconfigured",
});

const clearanceVariableFor = (
  kind: DoorInterfaceKind,
): ProvisionalClearanceOverride["sourceVariable"] => {
  switch (kind) {
    case "hinge-edge":
      return "frontDoorSideClearanceMm";
    case "top":
      return "frontDoorTopClearanceMm";
    case "bottom":
      return "frontDoorBottomClearanceMm";
    case "meeting-stile":
      return "frontDoorCentreGapMm";
  }
};

const interfaceRecord = (
  leafId: DoorLeafId,
  kind: DoorInterfaceKind,
  variables: EnclosureV2Variables,
  hinge: DoorHingeInstallation | undefined,
): DoorInterfaceRecord => {
  const sourceVariable = clearanceVariableFor(kind);
  return Object.freeze({
    id: `${leafId}.${kind}`,
    leafId,
    kind,
    hardPartClearance: Object.freeze({
      status: "provisional-override",
      sourceVariable,
      nominalHardGapMm: variables[sourceVariable],
    }),
    closedStop: unconfiguredClosedStop,
    sealContact: unconfiguredSealContact,
    overlap: unconfiguredOverlap,
    hardwareKeepOut:
      kind === "hinge-edge" && hinge
        ? Object.freeze({
            status: "selected-long-hinge" as const,
            productCode: hinge.hardware.productCode,
            overallHeightMm: hinge.hardware.overallHeightMm,
            barrelDiameterMm: hinge.hardware.barrelDiameterMm,
            plateThicknessMm: hinge.hardware.plateThicknessMm,
            geometryFidelity: hinge.hardware.geometryFidelity,
            pivotPlacementStatus: hinge.pivotPlacementStatus,
            fitStatus: hinge.fitStatus,
          })
        : unconfiguredHardwareKeepOut,
  });
};

const doorLeafIds: readonly DoorLeafId[] = ["left-door", "right-door"];
const doorInterfaceKinds: readonly DoorInterfaceKind[] = [
  "hinge-edge",
  "top",
  "bottom",
  "meeting-stile",
];

export const makeProvisionalDoorInterfaceSpec = (
  variables: EnclosureV2Variables,
  hinges: readonly DoorHingeInstallation[] = [],
): DoorInterfaceSpec =>
  Object.freeze({
    status: "provisional-unconfigured",
    interfaces: Object.freeze(
      doorLeafIds.flatMap((leafId) =>
        doorInterfaceKinds.map((kind) =>
          interfaceRecord(
            leafId,
            kind,
            variables,
            hinges.find((hinge) => hinge.leafId === leafId),
          ),
        ),
      ),
    ),
  });

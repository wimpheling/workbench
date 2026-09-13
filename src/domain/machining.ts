import type { PartId } from "./ids";
import { stableId } from "./ids";
import type { Length } from "./units";

/** A stable identifier for one vendor-performed machining operation. */
export type MachiningOperationId = `machining:${string}`;
export const machiningOperationId = (value: string): MachiningOperationId =>
  stableId("machining", value) as MachiningOperationId;

export type ProfileEnd = "start" | "end";
export type ProfileEndDrawingView = "looking-at-start-end" | "looking-at-end-end";
export type ProfileReferenceFace = "front" | "back" | "left" | "right" | "top" | "bottom";

/**
 * An unambiguous cut-end target for a profile operation.
 *
 * `drawingView` tells the supplier which physical end is shown. `topReferenceFace`
 * clocks the drawing, so a bore pattern cannot be mirrored around a symmetric
 * profile by accident. The assembly model will later provide the world-face map.
 */
export type ProfileEndTarget = Readonly<{
  partId: PartId;
  end: ProfileEnd;
  orientation: Readonly<{
    drawingView: ProfileEndDrawingView;
    topReferenceFace: ProfileReferenceFace;
  }>;
}>;

export type MachiningProcess = "drill" | "counterbore" | "mill" | "tap" | "supplier-defined";
export type MachiningDimensionKind =
  | "diameter"
  | "depth"
  | "width"
  | "height"
  | "offset-from-end"
  | "offset-from-datum";

/** Every engineering dimension remains in millimetres. */
export type MachiningDimension = Readonly<{
  name: string;
  kind: MachiningDimensionKind;
  valueMm: Length;
  toleranceMm?: Length;
}>;

/**
 * A machining operation is either fully dimensioned by an approved drawing or
 * intentionally delegated to the supplier's current installation drawing.
 * The latter is valid planning data, but must remain visibly pending rather
 * than pretending that catalogue envelope dimensions are drilling dimensions.
 */
export type MachiningDefinition =
  | Readonly<{
      status: "dimensioned";
      dimensions: readonly MachiningDimension[];
    }>
  | Readonly<{
      status: "supplier-defined-pending";
      dimensions: readonly [];
      pendingDetail: "dimensions-pending-vendor-drawing";
    }>;

export type MachiningReferenceKind =
  | "supplier-technical-drawing"
  | "supplier-cad"
  | "supplier-installation-instruction"
  | "project-assembly-map";

/** A revision-controlled document or asset that defines an operation. */
export type MachiningReference = Readonly<{
  id: string;
  kind: MachiningReferenceKind;
  locator: string;
  revision?: string;
}>;

/**
 * A named connector operation. It deliberately identifies the connector and
 * operation code rather than relying on a vendor to infer machining from prose.
 */
export type ConnectorMachiningOperation = Readonly<{
  id: MachiningOperationId;
  name: string;
  process: MachiningProcess;
  connectorProductCode: string;
  connectorOperationCode: string;
  target: ProfileEndTarget;
  definition: MachiningDefinition;
  references: readonly MachiningReference[];
  partIds: readonly PartId[];
  jointIds: readonly string[];
}>;

export type MachiningPlan = Readonly<{
  id: string;
  operations: readonly ConnectorMachiningOperation[];
}>;

export type MachiningIssue = Readonly<{
  id: string;
  message: string;
  references: readonly string[];
}>;

const expectedDrawingView: Readonly<Record<ProfileEnd, ProfileEndDrawingView>> = {
  start: "looking-at-start-end",
  end: "looking-at-end-end",
};

const isNonEmpty = (value: string) => value.trim().length > 0;
const hasDuplicate = (values: readonly string[]) => new Set(values).size !== values.length;

const validateDimension = (
  operation: ConnectorMachiningOperation,
  dimension: MachiningDimension,
): MachiningIssue | undefined => {
  const references = [operation.id, operation.target.partId];
  const positiveValueRequired = dimension.kind !== "offset-from-end";
  if (
    !isNonEmpty(dimension.name) ||
    !Number.isFinite(dimension.valueMm) ||
    (positiveValueRequired ? dimension.valueMm <= 0 : dimension.valueMm < 0) ||
    (dimension.toleranceMm !== undefined &&
      (!Number.isFinite(dimension.toleranceMm) || dimension.toleranceMm < 0))
  )
    return {
      id: `${operation.id}.dimension.${dimension.name || "unnamed"}`,
      message:
        "machining dimensions require a name, finite millimetre value, and non-negative tolerance",
      references,
    };
  return undefined;
};

export const validateMachiningPlan = (plan: MachiningPlan): readonly MachiningIssue[] => {
  const issues: MachiningIssue[] = [];
  if (!isNonEmpty(plan.id))
    issues.push({
      id: "machining-plan.id",
      message: "machining plan requires a non-empty identifier",
      references: [],
    });
  if (plan.operations.length === 0)
    issues.push({
      id: `${plan.id}.operations`,
      message: "machining plan requires at least one operation",
      references: [plan.id],
    });
  if (hasDuplicate(plan.operations.map((operation) => operation.id)))
    issues.push({
      id: `${plan.id}.operation-ids`,
      message: "machining operation identifiers must be unique",
      references: plan.operations.map((operation) => operation.id),
    });

  for (const operation of plan.operations) {
    const references = [operation.id, operation.target.partId, ...operation.jointIds];
    if (
      !isNonEmpty(operation.name) ||
      !isNonEmpty(operation.connectorProductCode) ||
      !isNonEmpty(operation.connectorOperationCode)
    )
      issues.push({
        id: `${operation.id}.connector-operation`,
        message: "machining operation requires a named connector product and operation code",
        references,
      });
    if (operation.target.orientation.drawingView !== expectedDrawingView[operation.target.end])
      issues.push({
        id: `${operation.id}.end-orientation`,
        message: "profile-end drawing view must match the named target end",
        references,
      });
    if (!operation.partIds.includes(operation.target.partId) || hasDuplicate(operation.partIds))
      issues.push({
        id: `${operation.id}.part-links`,
        message: "machining operation must link its target part exactly once",
        references,
      });
    if (operation.jointIds.length === 0 || hasDuplicate(operation.jointIds))
      issues.push({
        id: `${operation.id}.joint-links`,
        message: "machining operation requires unique linked structural joint identifiers",
        references,
      });
    if (
      operation.definition.status === "dimensioned" &&
      operation.definition.dimensions.length === 0
    )
      issues.push({
        id: `${operation.id}.dimensions`,
        message: "machining operation requires explicit millimetre dimensions",
        references,
      });
    for (const dimension of operation.definition.dimensions) {
      const issue = validateDimension(operation, dimension);
      if (issue) issues.push(issue);
    }
    if (
      operation.definition.status === "supplier-defined-pending" &&
      (operation.process !== "supplier-defined" ||
        operation.definition.pendingDetail !== "dimensions-pending-vendor-drawing" ||
        operation.definition.dimensions.length !== 0)
    )
      issues.push({
        id: `${operation.id}.pending-definition`,
        message:
          "pending machining must use the supplier-defined process, no project dimensions, and the explicit vendor-drawing pending status",
        references,
      });
    if (
      operation.references.length === 0 ||
      hasDuplicate(operation.references.map((reference) => reference.id))
    )
      issues.push({
        id: `${operation.id}.references`,
        message: "machining operation requires uniquely identified supplier or project references",
        references,
      });
    for (const reference of operation.references)
      if (!isNonEmpty(reference.id) || !isNonEmpty(reference.locator))
        issues.push({
          id: `${operation.id}.reference.${reference.id || "unnamed"}`,
          message: "machining references require an identifier and locator",
          references,
        });
    if (
      operation.definition.status === "supplier-defined-pending" &&
      !operation.references.some(
        (reference) =>
          reference.kind === "supplier-technical-drawing" ||
          reference.kind === "supplier-cad" ||
          reference.kind === "supplier-installation-instruction",
      )
    )
      issues.push({
        id: `${operation.id}.supplier-reference`,
        message:
          "pending supplier-defined machining requires a supplier technical, CAD, or installation reference",
        references,
      });
  }
  return issues;
};

export type SupplierMachiningInstruction = Readonly<{
  operationId: MachiningOperationId;
  operationName: string;
  connectorProductCode: string;
  connectorOperationCode: string;
  process: MachiningProcess;
  target: ProfileEndTarget;
  definition: MachiningDefinition;
  references: readonly MachiningReference[];
  partIds: readonly PartId[];
  jointIds: readonly string[];
  confirmationStatus: "vendor-confirmation-required";
  requiredConfirmations: readonly [
    "target-end-and-clocking",
    "connector-operation-and-dimensions",
    "reference-revision",
  ];
}>;

/** Structured supplier-ready data; presentation and BOM aggregation belong to manufacturing. */
export const buildSupplierMachiningInstructions = (
  plan: MachiningPlan,
): readonly SupplierMachiningInstruction[] =>
  Object.freeze(
    plan.operations.map((operation) =>
      Object.freeze({
        operationId: operation.id,
        operationName: operation.name,
        connectorProductCode: operation.connectorProductCode,
        connectorOperationCode: operation.connectorOperationCode,
        process: operation.process,
        target: operation.target,
        definition: operation.definition,
        references: operation.references,
        partIds: operation.partIds,
        jointIds: operation.jointIds,
        confirmationStatus: "vendor-confirmation-required" as const,
        requiredConfirmations: [
          "target-end-and-clocking",
          "connector-operation-and-dimensions",
          "reference-revision",
        ] as const,
      }),
    ),
  );

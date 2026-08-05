import { describe, expect, it } from "vitest";
import { partId } from "./ids";
import {
  buildSupplierMachiningInstructions,
  machiningOperationId,
  validateMachiningPlan,
  type MachiningPlan,
} from "./machining";
import { mm } from "./units";

const frontLeftPost = partId("front-left-post");

const anchorOperation = (): MachiningPlan["operations"][number] => ({
  id: machiningOperationId("front-left-post-top-cac30un"),
  name: "CAC30UN front-left-post top-end connector machining",
  process: "supplier-defined",
  connectorProductCode: "CAC30UN",
  connectorOperationCode: "CAC30UN-30-SERIES-END-MACHINING",
  target: {
    partId: frontLeftPost,
    end: "end",
    orientation: {
      drawingView: "looking-at-end-end",
      topReferenceFace: "front",
    },
  },
  definition: {
    status: "dimensioned",
    dimensions: [
      { name: "connector bore diameter", kind: "diameter", valueMm: mm(14), toleranceMm: mm(0) },
      { name: "connector bore depth", kind: "depth", valueMm: mm(21) },
    ],
  },
  references: [
    {
      id: "reference:wolweiss-cac30un-datasheet",
      kind: "supplier-technical-drawing",
      locator: "cac.pdf",
    },
  ],
  partIds: [frontLeftPost],
  jointIds: ["front-left-post-top"],
});

describe("machining operations", () => {
  it("records an unambiguous connector machining target and supplier instruction", () => {
    const plan: MachiningPlan = {
      id: "machining-plan:enclosure-v2",
      operations: [anchorOperation()],
    };

    expect(validateMachiningPlan(plan)).toEqual([]);
    expect(buildSupplierMachiningInstructions(plan)).toEqual([
      expect.objectContaining({
        operationId: machiningOperationId("front-left-post-top-cac30un"),
        target: expect.objectContaining({
          partId: frontLeftPost,
          end: "end",
          orientation: expect.objectContaining({ drawingView: "looking-at-end-end" }),
        }),
        jointIds: ["front-left-post-top"],
        confirmationStatus: "vendor-confirmation-required",
      }),
    ]);
  });

  it("rejects ambiguous or incomplete machining records before they reach a supplier", () => {
    const valid = anchorOperation();
    const plan: MachiningPlan = {
      id: "machining-plan:enclosure-v2",
      operations: [
        {
          ...valid,
          target: {
            ...valid.target,
            orientation: { ...valid.target.orientation, drawingView: "looking-at-start-end" },
          },
          definition: { status: "dimensioned", dimensions: [] },
          references: [],
          partIds: [],
          jointIds: [],
        },
      ],
    };

    expect(validateMachiningPlan(plan).map((issue) => issue.id)).toEqual([
      `${valid.id}.end-orientation`,
      `${valid.id}.part-links`,
      `${valid.id}.joint-links`,
      `${valid.id}.dimensions`,
      `${valid.id}.references`,
    ]);
  });

  it("rejects duplicate operation identifiers and invalid dimensional values", () => {
    const valid = anchorOperation();
    const plan: MachiningPlan = {
      id: "machining-plan:enclosure-v2",
      operations: [
        valid,
        {
          ...valid,
          definition: {
            status: "dimensioned",
            dimensions: [
              { name: "invalid bore", kind: "diameter", valueMm: mm(0), toleranceMm: mm(-1) },
            ],
          },
        },
      ],
    };

    expect(validateMachiningPlan(plan).map((issue) => issue.id)).toEqual([
      "machining-plan:enclosure-v2.operation-ids",
      `${valid.id}.dimension.invalid bore`,
    ]);
  });
});

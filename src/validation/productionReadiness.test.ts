import { describe, expect, it } from "vitest";
import { partId } from "../domain/ids";
import { machiningOperationId, type MachiningPlan } from "../domain/machining";
import {
  makeDoorFrameSlotAllocation,
  tSlotAllocationId,
  type DoorFrameSlotAllocationInput,
} from "../domain/slotAllocation";
import {
  validateInsetDoorSlotAllocation,
  validateSupplierDefinedMachiningPlan,
} from "./constraints";

const doorInput: DoorFrameSlotAllocationInput = {
  doorId: "left-rear-primary",
  members: {
    "top-rail": partId("left-rear-primary-top"),
    "bottom-rail": partId("left-rear-primary-bottom"),
    "hinge-stile": partId("left-rear-primary-hinge"),
    "latch-stile": partId("left-rear-primary-latch"),
  },
  faces: {
    "top-rail": {
      panel: "face-a",
      exterior: "face-b",
      cornerJoinery: "face-c",
      spare: "face-d",
    },
    "bottom-rail": {
      panel: "face-a",
      exterior: "face-b",
      cornerJoinery: "face-c",
      spare: "face-d",
    },
    "hinge-stile": {
      panel: "face-a",
      exterior: "face-b",
      cornerJoinery: "face-c",
      spare: "face-d",
    },
    "latch-stile": {
      panel: "face-a",
      exterior: "face-b",
      cornerJoinery: "face-c",
      spare: "face-d",
    },
  },
};

const supplierDefinedPlan = (): MachiningPlan => ({
  id: "machining-plan:main-frame",
  operations: [
    {
      id: machiningOperationId("front-left-post-top-cac"),
      name: "Front left post top concealed-anchor machining",
      process: "supplier-defined",
      connectorProductCode: "CAC30UN",
      connectorOperationCode: "CAC30UN-30-SERIES-END-MACHINING",
      target: {
        partId: partId("front-left-post"),
        end: "end",
        orientation: {
          drawingView: "looking-at-end-end",
          topReferenceFace: "front",
        },
      },
      // The supplier controls the final drilling pattern; no project-side
      // placeholder dimensions may be treated as production evidence.
      dimensions: [],
      references: [
        {
          id: "reference:reiman-cac30un-installation-request",
          kind: "supplier-installation-instruction",
          locator: "vendor-confirmation-pending",
        },
      ],
      partIds: [partId("front-left-post")],
      jointIds: ["joint:front-left-post-top"],
    },
  ],
});

describe("production-readiness validation", () => {
  it("asserts four conflict-free continuous panel/gasket channels while retaining the physical-fit limitation", () => {
    const validation = validateInsetDoorSlotAllocation(makeDoorFrameSlotAllocation(doorInput));

    expect(validation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "SLOT-001.slot-allocation-plan:left-rear-primary.occupancy",
          passed: true,
        }),
        expect.objectContaining({
          id: "SLOT-002.slot-allocation-plan:left-rear-primary.continuous-panel-gasket-channel",
          passed: true,
        }),
        expect.objectContaining({
          id: "SLOT-003.slot-allocation-plan:left-rear-primary.physical-fit-status",
          passed: false,
          severity: "warning",
        }),
      ]),
    );
  });

  it("rejects a door frame whose panel channel is no longer continuous on every member", () => {
    const valid = makeDoorFrameSlotAllocation(doorInput);
    const invalid = {
      ...valid,
      plan: {
        ...valid.plan,
        allocations: valid.plan.allocations.filter(
          (entry) => entry.id !== tSlotAllocationId("left-rear-primary-top-rail-face-a-gasket"),
        ),
      },
    };

    expect(
      validateInsetDoorSlotAllocation(invalid).find(
        (entry) =>
          entry.id ===
          "SLOT-002.slot-allocation-plan:left-rear-primary.continuous-panel-gasket-channel",
      ),
    ).toMatchObject({ passed: false, severity: "error" });
  });

  it("requires named target, joint, and reference identities while keeping supplier machining pending", () => {
    const validation = validateSupplierDefinedMachiningPlan(supplierDefinedPlan());

    expect(
      validation.filter((entry) => entry.severity === "error").every((entry) => entry.passed),
    ).toBe(true);
    expect(validation).toContainEqual(
      expect.objectContaining({
        id: "MACH-004.machining:front-left-post-top-cac.vendor-detail-pending",
        passed: false,
        severity: "warning",
      }),
    );
  });

  it("does not let an ambiguous supplier-defined operation reach the pending state as valid", () => {
    const plan = supplierDefinedPlan();
    const [operation] = plan.operations;
    const invalid = {
      ...plan,
      operations: [
        {
          ...operation,
          target: {
            ...operation!.target,
            orientation: {
              ...operation!.target.orientation,
              drawingView: "looking-at-start-end",
            },
          },
          jointIds: [],
          references: [],
        },
      ],
    };

    expect(
      validateSupplierDefinedMachiningPlan(invalid)
        .filter((entry) => entry.severity === "error" && !entry.passed)
        .map((entry) => entry.id),
    ).toEqual([
      "MACH-001.machining:front-left-post-top-cac.named-target",
      "MACH-002.machining:front-left-post-top-cac.named-joints",
      "MACH-003.machining:front-left-post-top-cac.named-references",
    ]);
  });
});

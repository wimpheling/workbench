import { describe, expect, it } from "vitest";
import { partId } from "./ids";
import {
  makeBiFoldInterLeafSlotAllocation,
  makeDoorFrameSlotAllocation,
  makeTSlotAllocationPlan,
  tSlotAllocationId,
  tSlotChannelId,
  validateTSlotAllocationPlan,
  type DoorFrameSlotAllocationInput,
  type TSlotFaceAllocation,
} from "./slotAllocation";

const member = partId("test-door-top");
const panelChannel = Object.freeze({
  id: tSlotChannelId("test-door-inset-panel"),
  coverage: "full-member-length" as const,
});

const slot = (
  value: string,
  use: TSlotFaceAllocation["use"],
  continuousChannel?: TSlotFaceAllocation["continuousChannel"],
): TSlotFaceAllocation => ({
  id: tSlotAllocationId(value),
  memberId: member,
  face: "face-a",
  use,
  ...(continuousChannel ? { continuousChannel } : {}),
});

const doorInput: DoorFrameSlotAllocationInput = {
  doorId: "left-door",
  members: {
    "top-rail": partId("left-door-top"),
    "bottom-rail": partId("left-door-bottom"),
    "hinge-stile": partId("left-door-hinge"),
    "latch-stile": partId("left-door-latch"),
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

describe("T-slot allocation", () => {
  it("keeps inside bi-fold hinge mounting off both inset-panel channels", () => {
    const allocation = makeBiFoldInterLeafSlotAllocation(
      "left-rear-access",
      partId("left-rear-primary-free-upright"),
      partId("left-rear-secondary-hinge-upright"),
    );
    expect(allocation).toMatchObject({
      status: "inside-hinge-separated-from-inset-panel-channel",
      panelFace: "face-a",
      hingeFace: "face-b",
    });
    expect(validateTSlotAllocationPlan(allocation.plan)).toEqual([]);
    expect(allocation.plan.allocations.filter((entry) => entry.use === "hinge")).toHaveLength(2);
  });

  it("permits one continuous inset-panel retainer and gasket channel", () => {
    const plan = makeTSlotAllocationPlan("slot-allocation-plan:test", [
      slot("retainer", "inset-panel-retainer", panelChannel),
      slot("gasket", "gasket", panelChannel),
    ]);

    expect(validateTSlotAllocationPlan(plan)).toEqual([]);
  });

  it("rejects a hardware use on the panel/gasket channel", () => {
    const plan = {
      id: "slot-allocation-plan:test",
      allocations: [
        slot("retainer", "inset-panel-retainer", panelChannel),
        slot("gasket", "gasket", panelChannel),
        slot("hinge", "hinge"),
      ],
    };

    expect(validateTSlotAllocationPlan(plan).map((issue) => issue.id)).toEqual([
      `${member}/face-a.conflict`,
    ]);
    expect(() => makeTSlotAllocationPlan(plan.id, plan.allocations)).toThrow(/conflicting uses/i);
  });

  it("reserves continuous panel retention and non-panel door-frame uses without selecting hardware", () => {
    const reservation = makeDoorFrameSlotAllocation(doorInput);

    expect(reservation).toMatchObject({
      status: "reserved-without-connector-selection",
      panelGasketChannel: tSlotChannelId("left-door-inset-panel"),
    });
    expect(validateTSlotAllocationPlan(reservation.plan)).toEqual([]);
    expect(reservation.plan.allocations).toHaveLength(20);
    expect(
      reservation.plan.allocations.filter((entry) => entry.use === "concealed-slot-connector"),
    ).toHaveLength(4);
    expect(reservation.plan.allocations).toContainEqual(
      expect.objectContaining({
        memberId: doorInput.members["hinge-stile"],
        use: "hinge",
        face: "face-b",
      }),
    );
    expect(reservation.plan.allocations).toContainEqual(
      expect.objectContaining({
        memberId: doorInput.members["latch-stile"],
        use: "latch",
        face: "face-b",
      }),
    );
  });
});

import type { PartId } from "./ids";

/**
 * A profile-local face. The evaluator that knows a member's pose maps these
 * names to world faces; keeping the allocation local avoids mixing that later
 * geometric concern with the manufacturing intent recorded here.
 */
export type TSlotFace = "face-a" | "face-b" | "face-c" | "face-d";

export type TSlotUse =
  | "inset-panel-retainer"
  | "gasket"
  | "hinge"
  | "latch"
  | "concealed-slot-connector"
  | "external-bracket"
  | "spare";

export type TSlotAllocationId = `slot-allocation:${string}`;
export type TSlotChannelId = `slot-channel:${string}`;

export const tSlotAllocationId = (value: string): TSlotAllocationId => {
  if (!value.trim() || value.includes(":"))
    throw new Error("T-slot allocation IDs must be non-empty and contain no colon");
  return `slot-allocation:${value}`;
};

export const tSlotChannelId = (value: string): TSlotChannelId => {
  if (!value.trim() || value.includes(":"))
    throw new Error("T-slot channel IDs must be non-empty and contain no colon");
  return `slot-channel:${value}`;
};

/**
 * One declared use of one physical profile slot. Connector use deliberately
 * records only a reserved slot: product selection is a later decision.
 */
export type TSlotFaceAllocation = Readonly<{
  id: TSlotAllocationId;
  memberId: PartId;
  face: TSlotFace;
  use: TSlotUse;
  /**
   * Panel retainers and gaskets are the only compatible co-occupants. They
   * share this channel for the full member length, rather than competing for
   * space in the slot.
   */
  continuousChannel?: Readonly<{
    id: TSlotChannelId;
    coverage: "full-member-length";
  }>;
}>;

export type TSlotAllocationPlan = Readonly<{
  id: string;
  allocations: readonly TSlotFaceAllocation[];
}>;

export type TSlotAllocationIssue = Readonly<{
  id: string;
  message: string;
  allocationIds: readonly TSlotAllocationId[];
}>;

const panelChannelUses = new Set<TSlotUse>(["inset-panel-retainer", "gasket"]);
const slotKey = (allocation: Pick<TSlotFaceAllocation, "memberId" | "face">) =>
  `${allocation.memberId}/${allocation.face}`;
const unique = <T>(values: readonly T[]) => [...new Set(values)];

const isNonEmpty = (value: string) => value.trim().length > 0;

/**
 * Validates the occupancy rule: a slot has one purpose, except that a full
 * length inset-panel retainer and its gasket form one intentional channel.
 */
export const validateTSlotAllocationPlan = (
  plan: TSlotAllocationPlan,
): readonly TSlotAllocationIssue[] => {
  const issues: TSlotAllocationIssue[] = [];
  if (!isNonEmpty(plan.id))
    issues.push({
      id: "t-slot-allocation-plan.id",
      message: "T-slot allocation plans require a non-empty identifier",
      allocationIds: [],
    });

  const byId = new Map<TSlotAllocationId, TSlotFaceAllocation[]>();
  const bySlot = new Map<string, TSlotFaceAllocation[]>();
  for (const allocation of plan.allocations) {
    const sameId = byId.get(allocation.id) ?? [];
    sameId.push(allocation);
    byId.set(allocation.id, sameId);

    const sameSlot = bySlot.get(slotKey(allocation)) ?? [];
    sameSlot.push(allocation);
    bySlot.set(slotKey(allocation), sameSlot);

    const requiresChannel = panelChannelUses.has(allocation.use);
    if (
      (requiresChannel && allocation.continuousChannel?.coverage !== "full-member-length") ||
      (!requiresChannel && allocation.continuousChannel !== undefined)
    )
      issues.push({
        id: `${allocation.id}.channel`,
        message:
          "only inset-panel-retainer and gasket allocations may use a full-member continuous channel",
        allocationIds: [allocation.id],
      });
  }

  for (const [id, allocations] of byId)
    if (allocations.length > 1)
      issues.push({
        id: `${id}.duplicate`,
        message: "T-slot allocation identifiers must be unique",
        allocationIds: allocations.map((allocation) => allocation.id),
      });

  for (const [key, allocations] of bySlot) {
    const allocationIds = allocations.map((allocation) => allocation.id);
    const uses = unique(allocations.map((allocation) => allocation.use));
    const isPanelChannel =
      uses.length === 2 &&
      panelChannelUses.has(uses[0]!) &&
      panelChannelUses.has(uses[1]!) &&
      allocations.length === 2;

    if (!isPanelChannel && allocations.length > 1) {
      issues.push({
        id: `${key}.conflict`,
        message: "a T-slot face cannot be allocated to conflicting uses",
        allocationIds,
      });
      continue;
    }

    if (isPanelChannel) {
      const channelIds = unique(
        allocations.map((allocation) => allocation.continuousChannel?.id ?? "missing"),
      );
      if (channelIds.length !== 1 || channelIds[0] === "missing")
        issues.push({
          id: `${key}.panel-channel`,
          message: "panel retainer and gasket must share one continuous channel",
          allocationIds,
        });
    }
  }

  return issues;
};

/** Rejects an invalid plan at the model boundary, rather than carrying slot conflicts forward. */
export const makeTSlotAllocationPlan = (
  id: string,
  allocations: readonly TSlotFaceAllocation[],
): TSlotAllocationPlan => {
  const plan: TSlotAllocationPlan = Object.freeze({
    id,
    allocations: Object.freeze([...allocations]),
  });
  const issues = validateTSlotAllocationPlan(plan);
  if (issues.length > 0) throw new Error(issues.map((issue) => issue.message).join("; "));
  return plan;
};

export type DoorFrameMemberRole = "top-rail" | "bottom-rail" | "hinge-stile" | "latch-stile";

export type DoorFrameMemberIds = Readonly<Record<DoorFrameMemberRole, PartId>>;

/**
 * The caller supplies each member's local face map. This keeps the factory
 * valid for left/right, mirrored, and bi-fold leaves without presuming their
 * eventual world transforms.
 */
export type DoorFrameSlotFaces = Readonly<{
  panel: TSlotFace;
  exterior: TSlotFace;
  cornerJoinery: TSlotFace;
  spare: TSlotFace;
}>;

export type DoorFrameSlotAllocationInput = Readonly<{
  doorId: string;
  members: DoorFrameMemberIds;
  faces: Readonly<Record<DoorFrameMemberRole, DoorFrameSlotFaces>>;
}>;

export type DoorFrameSlotAllocation = Readonly<{
  status: "reserved-without-connector-selection";
  panelGasketChannel: TSlotChannelId;
  plan: TSlotAllocationPlan;
}>;

const roles: readonly DoorFrameMemberRole[] = [
  "top-rail",
  "bottom-rail",
  "hinge-stile",
  "latch-stile",
];

const allocation = (
  doorId: string,
  role: DoorFrameMemberRole,
  memberId: PartId,
  face: TSlotFace,
  use: TSlotUse,
  continuousChannel?: TSlotFaceAllocation["continuousChannel"],
): TSlotFaceAllocation =>
  Object.freeze({
    id: tSlotAllocationId(`${doorId}-${role}-${face}-${use}`),
    memberId,
    face,
    use,
    ...(continuousChannel ? { continuousChannel } : {}),
  });

/**
 * Reserves all four slots of a conventional inset-panel door frame. The
 * connector reservation contains no catalogue selection: it only protects the
 * non-panel slot required at the corners for a future compatible connector.
 */
export const makeDoorFrameSlotAllocation = (
  input: DoorFrameSlotAllocationInput,
): DoorFrameSlotAllocation => {
  if (!isNonEmpty(input.doorId)) throw new Error("doorId must be non-empty");
  const panelGasketChannel = tSlotChannelId(`${input.doorId}-inset-panel`);
  const continuousChannel = Object.freeze({
    id: panelGasketChannel,
    coverage: "full-member-length" as const,
  });
  const allocations: TSlotFaceAllocation[] = [];

  for (const role of roles) {
    const memberId = input.members[role];
    const faces = input.faces[role];
    allocations.push(
      allocation(
        input.doorId,
        role,
        memberId,
        faces.panel,
        "inset-panel-retainer",
        continuousChannel,
      ),
      allocation(input.doorId, role, memberId, faces.panel, "gasket", continuousChannel),
      allocation(input.doorId, role, memberId, faces.cornerJoinery, "concealed-slot-connector"),
    );

    if (role === "hinge-stile")
      allocations.push(allocation(input.doorId, role, memberId, faces.exterior, "hinge"));
    else if (role === "latch-stile")
      allocations.push(allocation(input.doorId, role, memberId, faces.exterior, "latch"));
    else allocations.push(allocation(input.doorId, role, memberId, faces.exterior, "spare"));

    allocations.push(allocation(input.doorId, role, memberId, faces.spare, "spare"));
  }

  return Object.freeze({
    status: "reserved-without-connector-selection",
    panelGasketChannel,
    plan: makeTSlotAllocationPlan(`slot-allocation-plan:${input.doorId}`, allocations),
  });
};

export type Side = "front" | "back" | "left" | "right" | "top" | "bottom";
export type ButtJointTerminatingFace = "start" | "end";
export type ButtJointSupportingFace = Side;
/**
 * Nominal structural contact. Geometry validation can later use the named
 * faces to compare actual mating planes and overlap against this contract.
 */
export type ButtJoint = Readonly<{
  kind: "butt";
  terminatingMember: string;
  supportingMember: string;
  terminatingFace: ButtJointTerminatingFace;
  supportingFace: ButtJointSupportingFace;
  expectedContactAreaMm2: number;
  toleranceMm: number;
}>;
export type Joint =
  | { kind: "box"; host: string; mate: string; side: Side; fingers: number; depth: number }
  | { kind: "halfLap"; host: string; mate: string; size: number; side: Side }
  | { kind: "tSlotBolt"; host: string; mate: string; bolt: string; nut: string }
  | { kind: "angleBracket"; host: string; mate: string; hardware: string }
  | ButtJoint;
export type HardwareRequirement = {
  id: string;
  specification: string;
  quantity: number;
  notes?: string[];
};
export type Connection = {
  id: string;
  parts: readonly string[];
  joint?: Joint;
  hardware?: readonly HardwareRequirement[];
};
export type ConnectionIssue = { id: string; message: string; references: string[] };
export const boxJoint = (
  host: string,
  mate: string,
  side: Side,
  fingers: number,
  depth: number,
): Joint => ({ kind: "box", host, mate, side, fingers, depth });
export const halfLapJoint = (host: string, mate: string, side: Side, size: number): Joint => ({
  kind: "halfLap",
  host,
  mate,
  side,
  size,
});
export const tSlotConnection = (host: string, mate: string, bolt: string, nut: string): Joint => ({
  kind: "tSlotBolt",
  host,
  mate,
  bolt,
  nut,
});
export const buttJoint = (
  terminatingMember: string,
  supportingMember: string,
  terminatingFace: ButtJointTerminatingFace,
  supportingFace: ButtJointSupportingFace,
  expectedContactAreaMm2: number,
  toleranceMm: number,
): ButtJoint => ({
  kind: "butt",
  terminatingMember,
  supportingMember,
  terminatingFace,
  supportingFace,
  expectedContactAreaMm2,
  toleranceMm,
});
export const validateConnection = (connection: Connection): ConnectionIssue[] => {
  const issues: ConnectionIssue[] = [];
  if (connection.parts.length < 2)
    issues.push({
      id: `${connection.id}.parts`,
      message: "connection requires at least two parts",
      references: [connection.id],
    });
  const joint = connection.joint;
  if (
    joint?.kind === "box" &&
    (!Number.isInteger(joint.fingers) || joint.fingers < 1 || joint.depth <= 0)
  )
    issues.push({
      id: `${connection.id}.box-parameters`,
      message: "box joint fingers and depth must be positive",
      references: [joint.host, joint.mate],
    });
  if (joint?.kind === "halfLap" && joint.size <= 0)
    issues.push({
      id: `${connection.id}.half-lap-size`,
      message: "half-lap size must be positive",
      references: [joint.host, joint.mate],
    });
  if (joint?.kind === "tSlotBolt" && (!joint.bolt || !joint.nut))
    issues.push({
      id: `${connection.id}.hardware`,
      message: "T-slot connection requires matching bolt and nut specifications",
      references: [joint.host, joint.mate],
    });
  if (joint?.kind === "butt") {
    const references = [joint.terminatingMember, joint.supportingMember];
    if (
      !joint.terminatingMember ||
      !joint.supportingMember ||
      joint.terminatingMember === joint.supportingMember ||
      !connection.parts.includes(joint.terminatingMember) ||
      !connection.parts.includes(joint.supportingMember)
    )
      issues.push({
        id: `${connection.id}.butt-members`,
        message: "butt joint members must be distinct declared connection parts",
        references,
      });
    if (
      !Number.isFinite(joint.expectedContactAreaMm2) ||
      joint.expectedContactAreaMm2 <= 0 ||
      !Number.isFinite(joint.toleranceMm) ||
      joint.toleranceMm < 0
    )
      issues.push({
        id: `${connection.id}.butt-parameters`,
        message:
          "butt joint contact area must be finite and positive and tolerance must be finite and non-negative",
        references,
      });
  }
  return issues;
};
export const connectionHardware = (connections: readonly Connection[]): HardwareRequirement[] => {
  const grouped = new Map<string, HardwareRequirement>();
  for (const connection of connections)
    for (const hardware of connection.hardware ?? []) {
      const current = grouped.get(hardware.id);
      grouped.set(hardware.id, {
        ...hardware,
        quantity: (current?.quantity ?? 0) + hardware.quantity,
      });
    }
  return [...grouped.values()];
};
export const connectionIssues = (connections: readonly Connection[]) =>
  connections.flatMap(validateConnection);
export const connectionToCsv = (connections: readonly Connection[]) =>
  [
    "id,parts,joint",
    ...connections.map(
      (connection) =>
        `${connection.id},${connection.parts.join(";")},${connection.joint?.kind ?? "none"}`,
    ),
  ].join("\n");

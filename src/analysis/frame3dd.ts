export type StructuralVector = { x: number; y: number; z: number };
export type StructuralMaterial = {
  id: string;
  youngModulus: number;
  shearModulus: number;
  density: number;
};
export type StructuralSection = { id: string; area: number; ixx: number; iyy: number; j: number };
export type StructuralNode = {
  id: string;
  anchorId: string;
  position: StructuralVector;
  restraint?: { x: boolean; y: boolean; z: boolean; rx: boolean; ry: boolean; rz: boolean };
};
export type StructuralMember = {
  id: string;
  partId: string;
  startNode: string;
  endNode: string;
  profileId: string;
  materialId: string;
  sectionId: string;
};
export type StructuralLoadCase = {
  id: string;
  nodeLoads: Array<{ nodeId: string; force: StructuralVector }>;
};
export type StructuralAnalysisInput = {
  modelId: string;
  modelRevision?: string;
  nodes: StructuralNode[];
  members: StructuralMember[];
  materials: StructuralMaterial[];
  sections: StructuralSection[];
  loadCases: StructuralLoadCase[];
};
export type StructuralResult = {
  status: "available" | "unavailable" | "failed";
  diagnostics: string[];
  nodeDisplacements?: Record<string, StructuralVector>;
  memberForces?: Record<string, number>;
};
export type Frame3ddRunner = (input: StructuralAnalysisInput) => Promise<StructuralResult>;

export const buildFrame3ddInput = (
  modelId: string,
  modelRevision: string,
  nodes: StructuralNode[],
  members: StructuralMember[],
  materials: StructuralMaterial[],
  sections: StructuralSection[],
  loadCases: StructuralLoadCase[],
): StructuralAnalysisInput => ({
  modelId,
  modelRevision,
  nodes,
  members,
  materials,
  sections,
  loadCases,
});
export const serializeFrame3ddInput = (input: StructuralAnalysisInput) =>
  JSON.stringify(input, null, 2);
export const unavailableFrame3dd = (
  reason = "Frame3DD executable is not configured",
): StructuralResult => ({ status: "unavailable", diagnostics: [reason] });
export const runFrame3dd = async (
  runner: Frame3ddRunner | undefined,
  input: StructuralAnalysisInput,
): Promise<StructuralResult> => {
  if (!runner) return unavailableFrame3dd();
  try {
    return await runner(input);
  } catch (error) {
    return {
      status: "failed",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
};
export const parseFrame3ddResult = (json: string): StructuralResult => {
  try {
    const parsed = JSON.parse(json) as StructuralResult;
    if (!parsed || !["available", "unavailable", "failed"].includes(parsed.status))
      throw new Error("invalid Frame3DD result status");
    return parsed;
  } catch (error) {
    return {
      status: "failed",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
};
export const frame3ddResultToJson = (result: StructuralResult) => JSON.stringify(result, null, 2);
export const frame3ddInputToCsv = (input: StructuralAnalysisInput) =>
  [
    "nodeId,x,y,z",
    ...input.nodes.map(
      (node) => `${node.id},${node.position.x},${node.position.y},${node.position.z}`,
    ),
  ].join("\n");

export type FitInterface =
  | "panel-slot"
  | "panel-installation"
  | "door-frame"
  | "door-seam"
  | "hinge-side"
  | "latch-side"
  | "slot-depth"
  | "connector"
  | "fastener-hole"
  | "saw-cut"
  | "custom";
export type FitPolicy = Readonly<{
  id: string;
  material?: string;
  interface: FitInterface;
  nominalClearance: number;
  minimumClearance: number;
  thicknessTolerance?: number;
  notes?: readonly string[];
}>;
export type FitResult = {
  policyId: string;
  passed: boolean;
  clearance: number;
  required: number;
  message: string;
};
export const defaultFitPolicies: readonly FitPolicy[] = Object.freeze([
  {
    id: "polycarbonate-panel-slot",
    material: "material:compact-polycarbonate",
    interface: "panel-slot",
    nominalClearance: 0.5,
    minimumClearance: 0.2,
    thicknessTolerance: 0.1,
  },
  {
    id: "polycarbonate-panel-installation",
    material: "material:compact-polycarbonate",
    interface: "panel-installation",
    nominalClearance: 0.5,
    minimumClearance: 0.2,
    notes: ["Allows panel expansion and installation clearance at each retained edge."],
  },
  {
    id: "door-frame-clearance",
    interface: "door-frame",
    nominalClearance: 1,
    minimumClearance: 0.5,
  },
  { id: "door-seam-clearance", interface: "door-seam", nominalClearance: 2, minimumClearance: 1 },
  { id: "hinge-side-allowance", interface: "hinge-side", nominalClearance: 2, minimumClearance: 1 },
  { id: "latch-side-allowance", interface: "latch-side", nominalClearance: 2, minimumClearance: 1 },
  { id: "t-slot-slot-depth", interface: "slot-depth", nominalClearance: 1, minimumClearance: 0.5 },
  { id: "t-slot-connector", interface: "connector", nominalClearance: 0.2, minimumClearance: 0 },
  {
    id: "t-slot-fastener-hole",
    interface: "fastener-hole",
    nominalClearance: 0.3,
    minimumClearance: 0,
  },
  { id: "extrusion-saw-cut", interface: "saw-cut", nominalClearance: 3, minimumClearance: 0 },
]);
export const evaluateFit = (policy: FitPolicy, clearance: number): FitResult => {
  const required = policy.minimumClearance + (policy.thicknessTolerance ?? 0);
  const passed = Number.isFinite(clearance) && clearance >= required;
  return {
    policyId: policy.id,
    passed,
    clearance,
    required,
    message: passed ? `${policy.id} fits` : `${policy.id} requires at least ${required}`,
  };
};
export const findFitPolicy = (id: string, policies: readonly FitPolicy[] = defaultFitPolicies) =>
  policies.find((policy) => policy.id === id);

export const requiredFitPolicy = (
  id: string,
  policies: readonly FitPolicy[] = defaultFitPolicies,
): FitPolicy => {
  const policy = findFitPolicy(id, policies);
  if (!policy) throw new Error(`Unknown fit policy: ${id}`);
  return policy;
};

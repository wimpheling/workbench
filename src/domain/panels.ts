import type { Point3 } from "./frames";

export type PanelInstallation = "slot-in" | "clip-in" | "screw-on" | "removable";
export type PanelBoundary = { id: string; corners: readonly [Point3, Point3, Point3, Point3] };
export type PanelDefinition = {
  id: string;
  boundary: PanelBoundary;
  material: string;
  thickness: number;
  installation: PanelInstallation;
  edgeClearance: number;
  expansionAllowance: number;
  cutouts?: readonly { id: string; center: Point3; size: { x: number; y: number } }[];
};
export type PanelEvaluation = {
  id: string;
  size: { width: number; height: number };
  clearSize: { width: number; height: number };
  passed: boolean;
  issues: string[];
};

const distance = (a: Point3, b: Point3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const evaluatePanel = (panel: PanelDefinition): PanelEvaluation => {
  const [a, b, c, d] = panel.boundary.corners;
  const width = distance(a, b);
  const height = distance(b, c);
  const allowance = panel.edgeClearance + panel.expansionAllowance;
  const clearSize = { width: width - allowance * 2, height: height - allowance * 2 };
  const issues = [
    ...(panel.thickness <= 0 ? ["panel thickness must be positive"] : []),
    ...(panel.edgeClearance < 0 ? ["edge clearance cannot be negative"] : []),
    ...(panel.expansionAllowance < 0 ? ["expansion allowance cannot be negative"] : []),
    ...(clearSize.width <= 0 ? ["panel width is not manufacturable after clearance"] : []),
    ...(clearSize.height <= 0 ? ["panel height is not manufacturable after clearance"] : []),
    ...(Math.abs(distance(c, d) - width) > 1e-6 ? ["panel boundary is not rectangular"] : []),
  ];
  return { id: panel.id, size: { width, height }, clearSize, passed: issues.length === 0, issues };
};
export const panelCutSize = (panel: PanelDefinition) => {
  const evaluation = evaluatePanel(panel);
  return {
    material: panel.material,
    thickness: panel.thickness,
    width: evaluation.clearSize.width,
    height: evaluation.clearSize.height,
    cutouts: panel.cutouts ?? [],
  };
};
export const panelToJson = (panel: PanelDefinition) => JSON.stringify(panel, null, 2);

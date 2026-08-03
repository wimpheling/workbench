import type { EnclosureModel } from "./domain/enclosureV2";
import {
  manufacturingReportJson,
  buildManufacturingReport,
  type ManufacturingReport,
} from "./domain/manufacturing";
export type DrawingViewId = "front" | "side" | "top" | "isometric";
export type DrawingView = {
  id: DrawingViewId;
  title: string;
  camera: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  };
};
export type DrawingDocument = {
  title: string;
  view: DrawingView;
  lines: string[];
  labels: string[];
  dimensions: Array<{ id: string; value: number; label: string }>;
};
export const defaultDrawingViews: readonly DrawingView[] = Object.freeze([
  {
    id: "front",
    title: "Front elevation",
    camera: { position: { x: 0, y: 0, z: 1 }, rotation: { x: 0, y: 0, z: 0 } },
  },
  {
    id: "side",
    title: "Side elevation",
    camera: { position: { x: 1, y: 0, z: 0 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } },
  },
  {
    id: "top",
    title: "Plan",
    camera: { position: { x: 0, y: 1, z: 0 }, rotation: { x: -Math.PI / 2, y: 0, z: 0 } },
  },
  {
    id: "isometric",
    title: "Isometric",
    camera: { position: { x: 1, y: 1, z: 1 }, rotation: { x: 0, y: 0, z: 0 } },
  },
]);
export const renderDrawing = (model: EnclosureModel, view: DrawingView): DrawingDocument => ({
  title: `${view.title} — ${model.frame.id}`,
  view,
  lines: model.members.map((member) => member.id),
  labels: model.members.map((member) => `${member.id} (${member.profile})`),
  dimensions: model.dimensions
    ? [
        { id: "width", value: model.dimensions.x, label: "Width" },
        { id: "height", value: model.dimensions.y, label: "Height" },
        { id: "depth", value: model.dimensions.z, label: "Depth" },
      ]
    : [],
});
const svgEscape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export const drawingToSvg = (drawing: DrawingDocument) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><title>${svgEscape(drawing.title)}</title><text x="20" y="30">${svgEscape(drawing.title)}</text>${drawing.labels.map((label, index) => `<text x="20" y="${60 + index * 18}">${svgEscape(label)}</text>`).join("")}</svg>`;
export const exportModelJson = (
  model: EnclosureModel,
  report: ManufacturingReport = buildManufacturingReport(model),
) => JSON.stringify({ model, manufacturing: report }, null, 2);
export const exportManufacturingJson = (model: EnclosureModel) =>
  manufacturingReportJson(buildManufacturingReport(model));
export const exportBytes = (content: string) => new TextEncoder().encode(content);
export const exportModel = (model: EnclosureModel, format: "json" | "svg"): Uint8Array =>
  format === "json"
    ? exportBytes(exportModelJson(model))
    : exportBytes(drawingToSvg(renderDrawing(model, defaultDrawingViews[0])));
export const csvEscape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
export const exportBOMCsv = (model: EnclosureModel) => {
  const report = buildManufacturingReport(model);
  return [
    "partId,quantity,material,profile,cutLength",
    ...report.parts.map((part) =>
      [part.partId, part.quantity, part.material, part.profile ?? "", part.cutLength ?? ""]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");
};
export const exportCutListCsv = (model: EnclosureModel) => {
  const report = buildManufacturingReport(model);
  return [
    "partId,quantity,material,profile,cutLength",
    ...report.parts
      .filter((part) => part.cutLength !== undefined)
      .map((part) =>
        [part.partId, part.quantity, part.material, part.profile ?? "", part.cutLength ?? ""]
          .map(csvEscape)
          .join(","),
      ),
  ].join("\n");
};

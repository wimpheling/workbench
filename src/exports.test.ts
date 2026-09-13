import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "./domain/enclosureV2";
import { defaultDrawingViews, drawingToSvg, exportBOMCsv, renderDrawing } from "./exports";

describe("drawing and exports", () => {
  it("renders a parameter-linked dimension and stable IDs", () => {
    const drawing = renderDrawing(
      makeEnclosureV2({ width: 120, height: 100, depth: 80 }),
      defaultDrawingViews[0],
    );
    expect(drawing.dimensions.find((item) => item.id === "width")?.value).toBe(120);
    expect(drawing.lines).toContain("part:front-top");
    expect(drawingToSvg(drawing)).toContain("Front elevation");
  });
  it("exports BOM records", () =>
    expect(exportBOMCsv(makeEnclosureV2({ width: 120, height: 100, depth: 80 }))).toContain(
      "part:front-top",
    ));
});

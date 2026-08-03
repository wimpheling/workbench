import { describe, expect, it } from "vitest";
import { createEvaluationContext, type ProjectDefinition } from "./context";
import { parameterId, projectId } from "./ids";
describe("typed project evaluation boundary", () => {
  it("creates an immutable project context with catalogs", () => {
    const project: ProjectDefinition = {
      id: projectId("demo"),
      name: "Demo",
      parameters: {
        [parameterId("width")]: 600,
        [parameterId("enabled")]: true,
        [parameterId("finish")]: "clear",
      },
    };
    const context = createEvaluationContext(project);
    expect(context.project).toEqual(project);
    expect(context.parameters).toEqual(project.parameters);
    expect(context.profiles.get("profile:aluminium-3030")?.section.x).toBe(30);
    expect(context.materials.get("material:wood")?.classification).toBe("wood");
    expect(context.materials.get("material:compact-polycarbonate")?.classification).toBe(
      "compact-polycarbonate",
    );
    expect(context.materials.get("material:aluminium")?.classification).toBe("aluminium");
    expect(context.tolerances).toEqual({ defaultClearance: 0 });
  });
  it("isolates project data and catalogs", () => {
    const parameters = { [parameterId("width")]: 600 };
    const project: ProjectDefinition = { id: projectId("demo"), name: "Demo", parameters };
    const context = createEvaluationContext(project);
    parameters[parameterId("width")] = 900;
    expect(context.parameters[parameterId("width")]).toBe(600);
    expect(() => (context.materials as Map<unknown, unknown>).set("material:x", {})).toThrow();
  });
});

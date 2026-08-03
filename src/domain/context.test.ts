import { describe, expect, it } from "vitest";
import { createEvaluationContext, type ProjectDefinition } from "./context";

describe("typed project evaluation boundary", () => {
  it("creates an immutable project context with catalog and tolerances", () => {
    const project: ProjectDefinition = {
      id: "project:demo",
      name: "Demo",
      parameters: { width: 600, enabled: true, finish: "clear" },
    };
    const context = createEvaluationContext(project);
    expect(context.project).toEqual(project);
    expect(context.parameters).toEqual(project.parameters);
    expect(context.profiles.get("aluminium-3030")?.section.x).toBe(30);
    expect(context.tolerances).toEqual({ defaultClearance: 0 });
  });
});

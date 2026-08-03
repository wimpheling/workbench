import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "./enclosureV2";
import {
  assemblyState,
  buildEnclosureAssemblies,
  evaluateEnclosureDoorPose,
  evaluateEnclosureAssemblyState,
} from "./assemblies";

describe("assemblies", () => {
  it("exposes named door states through the generic motion API", () => {
    const assembly = buildEnclosureAssemblies(
      makeEnclosureV2({ width: 120, height: 100, depth: 80 }),
    )[0];
    expect(assemblyState(assembly, "open").id).toBe("open");
    expect(
      evaluateEnclosureAssemblyState(assembly, assemblyState(assembly, "closed")).issues,
    ).toHaveLength(0);
  });

  it("evaluates closed/open as a pose for both stable door motion IDs", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    expect(evaluateEnclosureDoorPose(model, "closed")).toEqual({
      "left-door.angle": 0,
      "right-door.angle": 0,
    });
    expect(evaluateEnclosureDoorPose(model, "open")).toEqual({
      "left-door.angle": -Math.PI / 2,
      "right-door.angle": Math.PI / 2,
    });
  });
});

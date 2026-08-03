import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "./enclosureV2";
import {
  assemblyState,
  buildEnclosureAssemblies,
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
});

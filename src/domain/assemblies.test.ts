import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "./enclosureV2";
import {
  assemblyState,
  buildEnclosureAssemblies,
  evaluateEnclosureAssemblyPose,
  evaluateEnclosureDoorPose,
  evaluateEnclosureAssemblyState,
} from "./assemblies";
import { buildAssemblyTree } from "../validation/kinematics";

describe("assemblies", () => {
  it("exposes named door states through the generic motion API", () => {
    const assembly = buildEnclosureAssemblies(
      makeEnclosureV2({ width: 120, height: 100, depth: 80 }),
    ).find((candidate) => candidate.id === "assembly:left-door")!;
    expect(assemblyState(assembly, "open").id).toBe("open");
    expect(
      evaluateEnclosureAssemblyState(assembly, assemblyState(assembly, "closed")).issues,
    ).toHaveLength(0);
  });

  it("evaluates closed/open as a pose for both stable door motion IDs", () => {
    const model = makeEnclosureV2({ width: 120, height: 100, depth: 80 });
    expect(evaluateEnclosureDoorPose(model, "closed")).toMatchObject({
      "left-door.angle": 0,
      "right-door.angle": 0,
    });
    expect(evaluateEnclosureDoorPose(model, "open")).toMatchObject({
      "left-door.angle": -Math.PI / 2,
      "right-door.angle": Math.PI / 2,
    });
  });

  it("builds an enclosure root hierarchy with a real prismatic service slider", () => {
    const model = makeEnclosureV2({ width: 500, height: 400, depth: 300 });
    const assemblies = buildEnclosureAssemblies(model);
    const tree = buildAssemblyTree(assemblies);
    const slider = assemblies.find((assembly) => assembly.id === "assembly:service-slider")!;

    expect(tree).toHaveLength(1);
    expect(tree[0]!.children.map((node) => node.assembly.id)).toEqual([
      "assembly:left-door",
      "assembly:right-door",
      "assembly:service-slider",
    ]);
    expect(slider.motions[0]!.motion.kind).toBe("prismatic");
    expect(evaluateEnclosureAssemblyPose(model, "service")).toMatchObject({
      "left-door.angle": 0,
      "right-door.angle": 0,
      "service-slider.travel": model.serviceSlider!.travel,
    });
  });
});

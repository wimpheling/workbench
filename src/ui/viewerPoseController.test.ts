import { describe, expect, it, vi } from "vitest";
import { createViewerPoseController } from "./viewerPoseController";

describe("viewer pose controller", () => {
  it("applies and renders exactly once per selection without rebuilding", () => {
    const applyPose = vi.fn();
    const render = vi.fn();
    const controller = createViewerPoseController({
      resolvePose: (_scene: { id: string }, state: string) => ({ state }),
      applyPose,
    });
    const scene = { id: "scene" };

    controller.setScene(scene, render);
    controller.select("open");
    controller.select("open");

    expect(applyPose).toHaveBeenCalledTimes(1);
    expect(applyPose).toHaveBeenCalledWith(scene, { state: "open" });
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("reapplies the selected pose when a scene is rebuilt", () => {
    const applyPose = vi.fn();
    const render = vi.fn();
    const controller = createViewerPoseController({
      resolvePose: (_scene: { id: string }, state: string) => ({ state }),
      applyPose,
    });
    const first = { id: "first" };
    const second = { id: "second" };

    controller.select("open");
    controller.setScene(first, render);
    controller.setScene(second, render);

    expect(applyPose).toHaveBeenNthCalledWith(1, first, { state: "open" });
    expect(applyPose).toHaveBeenNthCalledWith(2, second, { state: "open" });
    expect(applyPose).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenCalledTimes(2);
  });
});

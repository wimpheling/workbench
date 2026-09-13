import { describe, expect, it, vi } from "vitest";
import { createDoorPoseAnimator, type AnimationScheduler } from "./doorPoseAnimator";

describe("door pose animator", () => {
  it("eases an open and close transition without rebuilding the scene", () => {
    let now = 0;
    let nextId = 0;
    const frames = new Map<number, FrameRequestCallback>();
    const scheduler: AnimationScheduler = {
      now: () => now,
      request: (callback) => {
        nextId += 1;
        frames.set(nextId, callback);
        return nextId;
      },
      cancel: (id) => frames.delete(id),
    };
    const applyOpenFraction = vi.fn();
    const render = vi.fn();
    const animator = createDoorPoseAnimator({ applyOpenFraction, durationMs: 400, scheduler });
    const scene = { id: "scene" };
    animator.setScene(scene, render);
    animator.animateTo(true);

    now = 200;
    frames.get(1)!(now);
    expect(applyOpenFraction).toHaveBeenLastCalledWith(scene, 0.5);

    now = 400;
    frames.get(2)!(now);
    expect(applyOpenFraction).toHaveBeenLastCalledWith(scene, 1);

    animator.animateTo(false);
    now = 800;
    frames.get(3)!(now);
    expect(applyOpenFraction).toHaveBeenLastCalledWith(scene, 0);
  });
});

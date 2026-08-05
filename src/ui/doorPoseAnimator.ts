export type DoorPoseAnimator<Scene> = {
  animateTo: (open: boolean) => void;
  pause: () => void;
  resume: () => void;
  setScene: (scene: Scene, render: () => void) => void;
  dispose: () => void;
};

export type DoorAnimationState = "idle" | "running" | "paused";

export type AnimationScheduler = Readonly<{
  now: () => number;
  request: (callback: FrameRequestCallback) => number;
  cancel: (id: number) => void;
}>;

const defaultScheduler: AnimationScheduler = {
  now: () => performance.now(),
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

export function createDoorPoseAnimator<Scene>(options: {
  applyOpenFraction: (scene: Scene, openFraction: number) => void;
  durationMs: number;
  scheduler?: AnimationScheduler;
  onStateChange?: (state: DoorAnimationState) => void;
}): DoorPoseAnimator<Scene> {
  const scheduler = options.scheduler ?? defaultScheduler;
  let scene: Scene | undefined;
  let render: (() => void) | undefined;
  let frameId: number | undefined;
  let openFraction = 0;
  let targetFraction = 0;
  let state: DoorAnimationState = "idle";

  const setState = (next: DoorAnimationState) => {
    if (state === next) return;
    state = next;
    options.onStateChange?.(next);
  };

  const apply = () => {
    if (scene === undefined || !render) return;
    options.applyOpenFraction(scene, openFraction);
    render();
  };

  const cancel = () => {
    if (frameId === undefined) return;
    scheduler.cancel(frameId);
    frameId = undefined;
  };

  const start = () => {
    cancel();
    if (targetFraction === openFraction) {
      setState("idle");
      apply();
      return;
    }
    const initial = openFraction;
    const startTime = scheduler.now();
    setState("running");
    const tick = (now: number) => {
      const elapsedFraction = Math.min(1, (now - startTime) / options.durationMs);
      // Smoothstep: zero velocity at both limits, keeping the mechanism readable.
      const eased = elapsedFraction * elapsedFraction * (3 - 2 * elapsedFraction);
      openFraction = initial + (targetFraction - initial) * eased;
      apply();
      if (elapsedFraction < 1) frameId = scheduler.request(tick);
      else {
        frameId = undefined;
        setState("idle");
      }
    };
    frameId = scheduler.request(tick);
  };

  return {
    animateTo: (open) => {
      targetFraction = open ? 1 : 0;
      start();
    },
    pause: () => {
      if (state !== "running") return;
      cancel();
      setState("paused");
    },
    resume: () => {
      if (state !== "paused") return;
      start();
    },
    setScene: (nextScene, nextRender) => {
      scene = nextScene;
      render = nextRender;
      apply();
    },
    dispose: () => {
      cancel();
      setState("idle");
    },
  };
}

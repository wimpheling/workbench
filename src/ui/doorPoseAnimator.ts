export type DoorPoseAnimator<Scene> = {
  animateTo: (open: boolean) => void;
  setScene: (scene: Scene, render: () => void) => void;
  dispose: () => void;
};

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
}): DoorPoseAnimator<Scene> {
  const scheduler = options.scheduler ?? defaultScheduler;
  let scene: Scene | undefined;
  let render: (() => void) | undefined;
  let frameId: number | undefined;
  let openFraction = 0;

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

  return {
    animateTo: (open) => {
      const target = open ? 1 : 0;
      cancel();
      if (target === openFraction) {
        apply();
        return;
      }
      const initial = openFraction;
      const start = scheduler.now();
      const tick = (now: number) => {
        const elapsedFraction = Math.min(1, (now - start) / options.durationMs);
        // Smoothstep: zero velocity at both limits, keeping the mechanism readable.
        const eased = elapsedFraction * elapsedFraction * (3 - 2 * elapsedFraction);
        openFraction = initial + (target - initial) * eased;
        apply();
        if (elapsedFraction < 1) frameId = scheduler.request(tick);
        else frameId = undefined;
      };
      frameId = scheduler.request(tick);
    },
    setScene: (nextScene, nextRender) => {
      scene = nextScene;
      render = nextRender;
      apply();
    },
    dispose: () => cancel(),
  };
}

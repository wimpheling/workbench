export type ViewerPoseController<Scene, State> = {
  select: (state: State) => void;
  setScene: (scene: Scene, render: () => void) => void;
};

export function createViewerPoseController<Scene, State, Pose>(options: {
  resolvePose: (scene: Scene, state: State) => Pose;
  applyPose: (scene: Scene, pose: Pose) => void;
}): ViewerPoseController<Scene, State> {
  let selected: State | undefined;
  let currentScene: Scene | undefined;
  let render: (() => void) | undefined;

  const apply = () => {
    if (currentScene === undefined || selected === undefined || !render) return;
    options.applyPose(currentScene, options.resolvePose(currentScene, selected));
    render();
  };

  return {
    select: (state) => {
      if (Object.is(selected, state)) return;
      selected = state;
      apply();
    },
    setScene: (scene, nextRender) => {
      currentScene = scene;
      render = nextRender;
      apply();
    },
  };
}

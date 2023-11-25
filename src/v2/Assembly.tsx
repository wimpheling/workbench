import { For } from "solid-js/web";
import { init } from "./threeConfig";
import { WorkBench } from "./workbench";
import { createSignal, onCleanup, onMount } from "solid-js";

export const Assembly = () => {
  const [loadControls, setLoadControls] = createSignal(() => {});
  const [saveControls, setSaveControls] = createSignal(() => {});
  const [renderer, setRenderer] = createSignal<THREE.WebGLRenderer>();
  const workbench = new WorkBench();
  const [threeGroups, setThreeGroups] = createSignal<
    Record<string, THREE.Group>
  >({});

  function removeRenderer() {
    const r = renderer();
    r?.domElement.remove();
    r?.dispose();
    setRenderer(undefined);
  }

  function render() {
    removeRenderer();
    const { scene, loadControls, saveControls, renderer } = init();
    // @ts-ignore
    setLoadControls(loadControls);
    // @ts-ignore
    setSaveControls(saveControls);
    workbench.sm.assemble(scene);
    setThreeGroups(workbench.sm.threeGroups);
    setRenderer(renderer);
  }
  onMount(() => {
    render();
  });
  onCleanup(() => {
    removeRenderer();
  });
  const switchGroupVisibility = (key: string, visible: boolean) => {
    const group = threeGroups()[key] as THREE.Group;
    group.visible = visible;
  };

  return (
    <div
      style={{ position: "absolute", top: "20px", left: 0, "z-index": 1000 }}
    >
      <h1>Controls</h1>
      <For each={Object.keys(threeGroups())}>
        {(key) => {
          const group = threeGroups()[key] as THREE.Group;
          return (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={group.visible}
                  onChange={(e) => switchGroupVisibility(key, e.target.checked)}
                />
                {key}
              </label>
              <br />
            </>
          );
        }}
      </For>
      <button onClick={() => saveControls()()}>Save</button>
      <button onClick={() => loadControls()()}>Load</button>
      <button onClick={() => removeRenderer()}>Remove Renderer</button>
      <button onClick={() => render()}>Render</button>
    </div>
  );
};

import { For } from "solid-js/web";
import { init } from "./threeConfig";
import { WorkBench } from "../workbench/workbench";
import { Show, createSignal, onCleanup, onMount } from "solid-js";

export const Assembly = () => {
  // @ts-ignore
  const [loadControls, setLoadControls] = createSignal(() => {});
  // @ts-ignore
  const [saveControls, setSaveControls] = createSignal(() => {});
  const [renderer, setRenderer] = createSignal<THREE.WebGLRenderer>();
  const workbench = new WorkBench();
  const [threeGroups, setThreeGroups] = createSignal<
    Record<string, THREE.Group>
  >({});

  const [select, setSelect] = createSignal<{
    groupName: string;
    vector: THREE.Vector3;
  }>();

  const onSelect = (params?: { groupName: string; vector: THREE.Vector3 }) => {
    setSelect(params);
  };

  function removeRenderer() {
    const r = renderer();
    r?.domElement.remove();
    r?.dispose();
    setRenderer(undefined);
  }

  function render() {
    removeRenderer();
    const { scene, loadControls, saveControls, renderer } = init(onSelect);
    // @ts-ignore
    setLoadControls(loadControls);
    // @ts-ignore
    setSaveControls(saveControls);
    workbench.sm.assemble(scene, {
      hiddenGroups: workbench.hiddenGroups,
    });
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
      style={{ position: "absolute", top: "30px", left: 0, "z-index": 1000 }}
    >
      <div style={{ display: "flex", "flex-direction": "row" }}>
        <div>
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
                      onChange={(e) =>
                        switchGroupVisibility(key, e.target.checked)
                      }
                    />
                    {key}
                  </label>
                  <br />
                </>
              );
            }}
          </For>
        </div>
        <div style={{ "margin-left": "20px" }}>
          <Show when={select()}>
            <h1>Piece Info</h1>
            <p>
              <b>{select()!.groupName}</b>
              <br />
              Width: {Math.round(select()!.vector.x * 10)}mm
              <br />
              Height: {Math.round(select()!.vector.y * 10)}mm
              <br />
              Depth: {Math.round(select()!.vector.z * 10)}mm
            </p>
          </Show>
        </div>
      </div>

      {/* <button onClick={() => saveControls()()}>Save</button>
      <button onClick={() => loadControls()()}>Load</button>
      <button onClick={() => render()}>Render</button> */}
    </div>
  );
};

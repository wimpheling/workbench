/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { For } from "solid-js/web";
import { init } from "./threeConfig";
import { Show, createSignal, onCleanup } from "solid-js";
import { MyObject3D } from "../lib/MyObject3D";
import { DisposableItem } from "./interfaces";

export const Assembly = ({ item }: { item: MyObject3D }) => {
  let loadControls: () => void;
  let saveControls: () => void;
  const [renderer, setRenderer] = createSignal<THREE.WebGLRenderer>();
  const [itemsToDispose, setItemsToDispose] = createSignal<DisposableItem[]>(
    []
  );
  const [itemsToDisposeInit, setItemsToDisposeInit] = createSignal<
    DisposableItem[]
  >([]);
  const [threeGroups, setThreeGroups] = createSignal<
    Record<string, THREE.Group>
  >({});

  const [select, setSelect] = createSignal<{
    groupName: string;
    vector: THREE.Vector3;
    position: THREE.Vector3;
  }>();

  const onSelect = (params?: {
    groupName: string;
    vector: THREE.Vector3;
    position: THREE.Vector3;
  }) => {
    setSelect(params);
  };

  function removeRenderer() {
    const r = renderer();
    r?.domElement.remove();
    r?.dispose();
    itemsToDispose().forEach((i) => i.dispose());
    itemsToDisposeInit().forEach((i) => i.dispose());
    setRenderer(undefined);
  }

  function render() {
    removeRenderer();
    const {
      scene,
      loadControls: lc,
      saveControls: sc,
      renderer,
      itemsToDispose: itemsToInit,
    } = init(onSelect);
    setItemsToDisposeInit(itemsToInit);
    loadControls = lc;
    saveControls = sc;
    const itemsTo = item.sm.assemble(scene, {
      hiddenGroups: item.hiddenGroups,
    });
    setItemsToDispose(itemsTo);
    // enclosure.sm.assemble(scene, {
    //   // hiddenGroups: enclosure.hiddenGroups,
    // });
    setThreeGroups(item.sm.threeGroups);
    setRenderer(renderer);
  }
  onCleanup(() => {
    removeRenderer();
  });
  const switchGroupVisibility = (key: string, visible: boolean) => {
    const group = threeGroups()[key] as THREE.Group;
    group.visible = visible;
  };
  render();

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
              Width: {Math.round(select()!.vector.x * 10)}mm /{" "}
              {Math.round(((select()!.vector.x * 10) / 25.4) * 10) / 10} inches
              <br />
              Height: {Math.round(select()!.vector.y * 10)}mm /{" "}
              {Math.round(((select()!.vector.y * 10) / 25.4) * 10) / 10} inches
              <br />
              Depth: {Math.round(select()!.vector.z * 10)}mm /{" "}
              {Math.round(((select()!.vector.z * 10) / 25.4) * 10) / 10} inches
              <br />
              X: {Math.round(select()!.position.x * 10)}mm
              <br />
              Y: {Math.round(select()!.position.y * 10)}mm
              <br />
              Z: {Math.round(select()!.position.z * 10)}mm
            </p>
          </Show>
        </div>
      </div>

      <button onClick={() => saveControls()}>Save</button>
      <button onClick={() => loadControls()}>Load</button>
    </div>
  );
};

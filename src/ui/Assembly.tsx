import { Show, createSignal, onCleanup, onMount } from 'solid-js';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { For } from 'solid-js/web';
import type { MyObject3D } from '../lib/MyObject3D';
import type { DisposableItem } from './interfaces';
import { init } from './threeConfig';

export const Assembly = ({ item }: { item: MyObject3D }) => {
  let loadControls: () => void;
  let saveControls: () => void;
  const [renderer, setRenderer] = createSignal<THREE.WebGLRenderer>();
  const [itemsToDispose, setItemsToDispose] = createSignal<DisposableItem[]>([]);
  const [itemsToDisposeInit, setItemsToDisposeInit] = createSignal<DisposableItem[]>([]);
  const [threeGroups, setThreeGroups] = createSignal<Record<string, THREE.Group>>({});
  const [lightingMode, setLightingMode] = createSignal<'directional' | 'ambient'>('directional');

  const [select, setSelect] = createSignal<{
    groupName: string;
    vector: THREE.Vector3;
    position: THREE.Vector3;
  }>();

  const doorStates: Record<
    string,
    { isOpen: boolean; targetRotation: number; baseRotation: number }
  > = {};

  const onSelect = (params?: {
    groupName: string;
    vector: THREE.Vector3;
    position: THREE.Vector3;
  }) => {
    setSelect(params);
  };

  const onDoorClick = (doorName: string) => {
    const doorPivot = item.sm.doorPivots[doorName];
    if (!doorPivot) return;

    if (!doorStates[doorName]) {
      doorStates[doorName] = {
        isOpen: false,
        targetRotation: doorPivot.group.rotation.y,
        baseRotation: doorPivot.group.rotation.y,
      };
    }

    const state = doorStates[doorName];
    state.isOpen = !state.isOpen;
    // Open outward: -90° from base
    state.targetRotation = state.isOpen ? state.baseRotation - Math.PI / 2 : state.baseRotation;
  };

  const toggleDoorAnimation = () => {
    const doors = Object.keys(item.sm.doorPivots);
    if (doors.length === 0) {
      requestAnimationFrame(toggleDoorAnimation);
      return;
    }
    for (const doorName of doors) {
      const doorPivot = item.sm.doorPivots[doorName];
      const state = doorStates[doorName];
      if (!doorPivot || !state) continue;

      const currentRotation = doorPivot.group.rotation.y;
      const diff = state.targetRotation - currentRotation;
      if (Math.abs(diff) > 0.01) {
        const newRotation = currentRotation + diff * 0.1;
        doorPivot.group.rotation.y = newRotation;
      } else {
        doorPivot.group.rotation.y = state.targetRotation;
      }
    }
    requestAnimationFrame(toggleDoorAnimation);
  };

  function removeRenderer() {
    const r = renderer();
    r?.domElement.remove();
    r?.dispose();
    for (const i of itemsToDispose()) {
      i.dispose();
    }
    for (const i of itemsToDisposeInit()) {
      i.dispose();
    }
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
    } = init(onSelect, onDoorClick, lightingMode());
    setItemsToDisposeInit(itemsToInit);
    loadControls = lc;
    saveControls = sc;
    const itemsTo = item.sm.assemble(scene, {
      hiddenGroups: item.hiddenGroups,
    });
    setItemsToDispose(itemsTo);
    setThreeGroups(item.sm.threeGroups);
    setRenderer(renderer);
  }
  onCleanup(() => {
    removeRenderer();
  });
  onMount(() => {
    render();
    requestAnimationFrame(toggleDoorAnimation);
  });
  const switchGroupVisibility = (key: string, visible: boolean) => {
    const group = threeGroups()[key] as THREE.Group;
    group.visible = visible;
  };

  return (
    <div style={{ position: 'absolute', top: '30px', left: 0, 'z-index': 1000 }}>
      <div style={{ display: 'flex', 'flex-direction': 'row' }}>
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
                      onChange={(e) => switchGroupVisibility(key, e.target.checked)}
                    />
                    {key}
                  </label>
                  <br />
                </>
              );
            }}
          </For>
        </div>
        <div style={{ 'margin-left': '20px' }}>
          <Show when={select()}>
            {(selected) => (
              <>
                <h1>Piece Info</h1>
                <p>
                  <b>{selected().groupName}</b>
                  <br />
                  Width: {Math.round(selected().vector.x * 10)}mm /{' '}
                  {Math.round(((selected().vector.x * 10) / 25.4) * 10) / 10} inches
                  <br />
                  Height: {Math.round(selected().vector.y * 10)}mm /{' '}
                  {Math.round(((selected().vector.y * 10) / 25.4) * 10) / 10} inches
                  <br />
                  Depth: {Math.round(selected().vector.z * 10)}mm /{' '}
                  {Math.round(((selected().vector.z * 10) / 25.4) * 10) / 10} inches
                  <br />
                  X: {Math.round(selected().position.x * 10)}mm
                  <br />
                  Y: {Math.round(selected().position.y * 10)}mm
                  <br />
                  Z: {Math.round(selected().position.z * 10)}mm
                </p>
              </>
            )}
          </Show>
        </div>
      </div>

      <button type="button" onClick={() => saveControls()}>
        Save
      </button>
      <button type="button" onClick={() => loadControls()}>
        Load
      </button>
      <button
        type="button"
        onClick={() => {
          const newMode = lightingMode() === 'directional' ? 'ambient' : 'directional';
          setLightingMode(newMode);
          render();
        }}
      >
        Lighting: {lightingMode() === 'directional' ? 'Directional' : 'Ambient'}
      </button>
    </div>
  );
};

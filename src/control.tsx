import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { Obj } from "./constraints";

export const Control = (props: {
  legs: Obj;
  socle1: Obj;
  socle2: Obj;
  enclosureOuter: Obj;
  enclosureInner: Obj;
  tableTop: Obj;
}) => {
  const [isAssembled, setIsAssembled] = createSignal(true);
  const [config, setConfig] = createStore({
    legs: true,
    platforms: true,
    tableTop: true,
    enclosureInner: true,
    enclosureOuter: true,
  });

  createEffect(() => {
    props.legs.visible = config.legs;
  });
  createEffect(() => {
    props.socle1.visible = config.platforms;
    props.socle2.visible = config.platforms;
  });
  createEffect(() => {
    props.tableTop.visible = config.tableTop;
  });
  createEffect(() => {
    props.enclosureInner.visible = config.enclosureInner;
  });
  createEffect(() => {
    props.enclosureOuter.visible = config.enclosureOuter;
  });

  return (
    <div>
      <h1>Controls</h1>
      <label>
        Assembled
        <input
          type="checkbox"
          checked={isAssembled()}
          onChange={(e) => setIsAssembled(e.target.checked)}
        />
      </label>
      {isAssembled() && (
        <div>
          <label for="legs">
            Legs
            <input
              type="checkbox"
              id="legs"
              checked={config.legs}
              onChange={(e) => setConfig("legs", e.target.checked)}
            />
          </label>
          <br />
          <label for="platforms">
            Platforms
            <input
              type="checkbox"
              id="platforms"
              checked={config.platforms}
              onChange={(e) => setConfig("platforms", e.target.checked)}
            />
          </label>
          <br />
          <label for="tableTop">
            TableTop
            <input
              type="checkbox"
              id="tableTop"
              checked={config.tableTop}
              onChange={(e) => setConfig("tableTop", e.target.checked)}
            />
          </label>
          <br />
          <label for="enclosureInner">
            EnclosureInner
            <input
              type="checkbox"
              id="enclosureInner"
              checked={config.enclosureInner}
              onChange={(e) => setConfig("enclosureInner", e.target.checked)}
            />
          </label>
          <br />
          <label for="enclosureOuter">
            EnclosureOuter
            <input
              type="checkbox"
              id="enclosureOuter"
              checked={config.enclosureOuter}
              onChange={(e) => setConfig("enclosureOuter", e.target.checked)}
            />
          </label>
        </div>
      )}
    </div>
  );
};

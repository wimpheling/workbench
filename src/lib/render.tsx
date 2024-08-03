import { render } from "solid-js/web";
import { Renderer3D } from "./Renderer3D";
import { MyObject3D } from "./MyObject3D";

import "replicad-opencascadejs/src/replicad_single.wasm?url";
import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC } from "replicad";
// import { expose } from "comlink";

let loaded = false;
const init = async () => {
  if (loaded) return Promise.resolve(true);

  // @ts-expect-error: Wrong typings for OC
  const OC = await opencascade({
    locateFile: () => opencascadeWasm,
  });

  loaded = true;
  setOC(OC);

  return true;
};

export function renderObject3D<A extends MyObject3D>(c: new () => A) {
  function App() {
    const object3D = new c();
    return <Renderer3D object3D={object3D} />;
  }
  const el = document.getElementById("app");
  if (!el) return;
  el.innerHTML = "Loading...";
  init().then(() => {
    el.innerHTML = "";
    render(App, el as HTMLDivElement);
  });
}

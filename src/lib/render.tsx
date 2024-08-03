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

  // @ts-ignore
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
        return <Renderer3D object3D={object3D} />
      }
      init().then(() =>{
        console.log(loaded);
        render(App, document.getElementById("app") as HTMLDivElement)
      });
} 
import { render } from "solid-js/web";
import { Show, createSignal } from "solid-js";
import { Specs } from "./Specs";
import { Assembly } from "./Assembly";

function App() {
  const [showAssembled, setShowAssembled] = createSignal(true);

  return (
    <>
      <div style={{ top: 0, left: 0, "z-index": 1004 }}>
        <button onClick={() => setShowAssembled(!showAssembled())}>
          {showAssembled() ? "Show Specs" : "Show Assembly"}
        </button>
      </div>
      <Show when={showAssembled()}>
        <Assembly />
      </Show>
      <Show when={!showAssembled()}>
        <Specs />
      </Show>
    </>
  );
}

render(App, document.getElementById("app") as HTMLDivElement);

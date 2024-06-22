import { Show, createSignal } from "solid-js";
import { Specs } from "../ui/Specs";
import { Assembly } from "../ui/Assembly";
import { MyObject3D } from "./MyObject3D";
export function Renderer3D({ object3D }: { object3D: MyObject3D }) {
  const [showAssembled, setShowAssembled] = createSignal(false);
  return (
    <>
      <div style={{ top: 0, left: 0, "z-index": 1004 }}>
        <button onClick={() => setShowAssembled(!showAssembled())}>
          {showAssembled() ? "Show Specs" : "Show Assembly"}
        </button>
      </div>
      <Show when={showAssembled()}>
        <Assembly item={object3D} />
      </Show>
      <Show when={!showAssembled()}>
        <Specs shapeMaker={object3D.sm} />
      </Show>
    </>
  );
}

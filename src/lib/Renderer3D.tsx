import { Show, createSignal } from "solid-js";
import { Specs } from "../ui/Specs";
import { Assembly } from "../ui/Assembly";
import { MyObject3D } from "./MyObject3D";
import projects from "./projects";

export function Renderer3D({ object3D }: { object3D: MyObject3D; }) {
  const [showAssembled, setShowAssembled] = createSignal(true);
  return (
    <>
      <div style={{ top: 0, left: 0, "z-index": 1004, display: "flex" }}>
        <button onClick={() => setShowAssembled(!showAssembled())}>
          {showAssembled() ? "Show Specs" : "Show Assembly"}
        </button>
        <ul style={{ "list-style": "none", display: "flex" }}>
          {projects.map((project) => (
            <li style={{ "margin-right": "10px" }}>
              <a
                style={{ "text-decoration": "none" }}
                href={`/projects/${project}.html`}
              >
                {project}
              </a>
            </li>
          ))}
        </ul>
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

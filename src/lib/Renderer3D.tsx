import { Assembly } from "../ui/Assembly";
import { MyObject3D } from "./MyObject3D";
import projects from "./projects";

export function Renderer3D({ object3D }: { object3D: MyObject3D }) {
  return (
    <>
      <div style={{ top: 0, left: 0, "z-index": 1004, display: "flex" }}>
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
      <Assembly item={object3D} />
    </>
  );
}

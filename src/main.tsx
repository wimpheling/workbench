import { render } from "solid-js/web";
import { WorkBench } from "./workbench/workbench";
import { Renderer3D } from "./lib/Renderer3D";

function App() {
  const workbench = new WorkBench();
  return <Renderer3D object3D={workbench} />;
}

render(App, document.getElementById("app") as HTMLDivElement);

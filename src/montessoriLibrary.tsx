import { render } from "solid-js/web";
import { Renderer3D } from "./lib/Renderer3D";
import { MontessoriLibrary } from "./projects/montessoriLibrary/montessoriLibrary";

function App() {
  const montessoriLibrary = new MontessoriLibrary();
  return <Renderer3D object3D={montessoriLibrary} />;
}

render(App, document.getElementById("app") as HTMLDivElement);

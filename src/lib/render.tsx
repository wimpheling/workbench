import { render } from "solid-js/web";
import { Renderer3D } from "./Renderer3D";
import { MyObject3D } from "./MyObject3D";

export function renderObject3D<A extends MyObject3D>(c: new () => A) {
    function App() {
        const object3D = new c();
        return <Renderer3D object3D={object3D} />;
      }
      
      render(App, document.getElementById("app") as HTMLDivElement);  
}
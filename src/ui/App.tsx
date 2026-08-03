import { createMemo } from "solid-js";
import { defaultEnclosureScene } from "../rendering/enclosureScene";

export function App() {
  const scene = createMemo(defaultEnclosureScene);

  return (
    <main>
      <h1>Workbench</h1>
      <p data-testid="scene-status">
        EnclosureV2: {scene().members.length} declarative members rendered.
      </p>
    </main>
  );
}

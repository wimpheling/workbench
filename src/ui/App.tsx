import { createEffect, createResource, onCleanup } from "solid-js";
import { defaultEnclosureScene } from "../rendering/enclosureScene";
import { mountThreeViewer } from "../rendering/viewer";

export function App() {
  let canvas: HTMLCanvasElement | undefined;
  const [scene] = createResource(defaultEnclosureScene);
  createEffect(() => {
    const value = scene();
    if (!value || !canvas) return;
    const dispose = mountThreeViewer(canvas, value.root);
    onCleanup(dispose);
  });

  return (
    <main>
      <h1>Workbench</h1>
      <p data-testid="scene-status">
        EnclosureV2:{" "}
        {scene.loading
          ? "Loading geometry…"
          : scene.error
            ? "Geometry error"
            : `${scene()?.members.length ?? 0} members rendered.`}
      </p>
      <canvas
        ref={(element) => (canvas = element)}
        class="viewer-canvas"
        aria-label="EnclosureV2 3D viewer"
      />
    </main>
  );
}

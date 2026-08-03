import { createEffect, createResource, createSignal, onCleanup } from "solid-js";
import { defaultEnclosureScene } from "../rendering/enclosureScene";
import { mountThreeViewer } from "../rendering/viewer";
import { buildManufacturingReport, manufacturingReportJson } from "../domain/manufacturing";
import { buildValidationReport } from "../validation/reports";
import { validateModel } from "../validation/constraints";
import { defaultFitPolicies, evaluateFit } from "../validation/fitPolicies";

export function App() {
  let canvas: HTMLCanvasElement | undefined;
  const [scene] = createResource(defaultEnclosureScene);
  const [showReport, setShowReport] = createSignal(false);
  createEffect(() => {
    const value = scene();
    if (!value || !canvas) return;
    const dispose = mountThreeViewer(canvas, value.root);
    onCleanup(dispose);
  });
  const report = () => {
    const model = scene()?.model;
    if (!model) return undefined;
    return buildValidationReport(
      model.frame.id,
      validateModel(model),
      [],
      [evaluateFit(defaultFitPolicies[0], 0.5)],
    );
  };
  const manufacturing = () => {
    const model = scene()?.model;
    return model ? buildManufacturingReport(model) : undefined;
  };
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
      <div class="toolbar">
        <button type="button" onClick={() => setShowReport(!showReport())}>
          {showReport() ? "Hide report" : "Show validation report"}
        </button>
        <button
          type="button"
          onClick={() => {
            const value = manufacturing();
            if (value) navigator.clipboard?.writeText(manufacturingReportJson(value));
          }}
        >
          Copy BOM JSON
        </button>
      </div>
      {showReport() && (
        <section aria-label="Validation report">
          <h2>Validation</h2>
          <p>Status: {report()?.status ?? "incomplete"}</p>
          <ul>
            {report()?.issues.map((issue) => (
              <li>
                {issue.severity}: {issue.message}
              </li>
            ))}
          </ul>
        </section>
      )}
      <canvas
        ref={(element) => (canvas = element)}
        class="viewer-canvas"
        aria-label="EnclosureV2 3D viewer"
      />
    </main>
  );
}

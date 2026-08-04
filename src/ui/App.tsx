import { createEffect, createResource, createSignal, For, onCleanup } from "solid-js";
import { applyAssemblyPose, buildEnclosureScene } from "../rendering/enclosureScene";
import { mountThreeViewer } from "../rendering/viewer";
import { evaluateEnclosureAssemblyPose } from "../domain/assemblies";
import { buildManufacturingReport, manufacturingReportJson } from "../domain/manufacturing";
import {
  defaultDrawingViews,
  drawingToSvg,
  exportBOMCsv,
  exportCutListCsv,
  exportModelJson,
  renderDrawing,
} from "../exports";
import {
  defaultConfigurations,
  defaultDimensions,
  motionStateIds,
  regenerateModel,
  updateDimension,
  type EditableDimensions,
} from "./modelAuthoring";
import { resolveRuntimeValidationState } from "./runtimeValidation";
import { ValidationAssertionTree } from "./ValidationAssertionTree";
import { createViewerPoseController } from "./viewerPoseController";

export function App() {
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>();
  let viewer: ReturnType<typeof mountThreeViewer> | undefined;
  const [dimensions, setDimensions] = createSignal<EditableDimensions>(defaultDimensions);
  const [scene] = createResource(dimensions, (value) => buildEnclosureScene(value));
  const [showReport, setShowReport] = createSignal(true);
  const [configuration, setConfiguration] = createSignal("default");
  const [motionState, setMotionState] = createSignal("closed");
  const [selectedAssembly, setSelectedAssembly] = createSignal("assembly:enclosure");
  const [hiddenAssemblies, setHiddenAssemblies] = createSignal<ReadonlySet<string>>(new Set());
  const regenerated = () => regenerateModel(dimensions());
  const configurations = () => defaultConfigurations(dimensions());
  const motions = () => motionStateIds(regenerated().model);
  const poseController = createViewerPoseController({
    resolvePose: (value: Awaited<ReturnType<typeof buildEnclosureScene>>, state: string) =>
      evaluateEnclosureAssemblyPose(value.model, state),
    applyPose: (value, pose) => applyAssemblyPose(value, pose),
  });

  createEffect(() => {
    const value = scene();
    const element = canvas();
    if (!value || !element) return;
    viewer?.dispose();
    viewer = mountThreeViewer(element, value.root);
    poseController.setScene(value, viewer.render);
    onCleanup(() => {
      viewer?.dispose();
      viewer = undefined;
    });
  });
  createEffect(() => {
    const value = scene();
    const state = motionState();
    if (value && viewer) poseController.select(state);
  });
  const download = (name: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };
  const manufacturing = () => buildManufacturingReport(regenerated().model);
  const selectedAssemblyDetails = () =>
    scene()?.assemblies.find((assembly) => assembly.id === selectedAssembly());
  const setAssemblyVisible = (id: string, visible: boolean) => {
    const value = scene();
    const object = value?.assemblyObjects.get(id);
    if (object) {
      object.visible = visible;
      viewer?.render();
    }
    setHiddenAssemblies((current) => {
      const next = new Set(current);
      if (visible) next.delete(id);
      else next.add(id);
      return next;
    });
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
        <fieldset aria-label="Enclosure dimensions">
          <legend>Dimensions (mm)</legend>
          <For each={["width", "height", "depth"] as const}>
            {(key) => (
              <label>
                {key}{" "}
                <input
                  type="number"
                  min="1"
                  value={dimensions()[key]}
                  onChange={(event) => {
                    const next = updateDimension(dimensions(), key, event.currentTarget.value);
                    if (next) setDimensions(next);
                  }}
                />
              </label>
            )}
          </For>
        </fieldset>
        <label>
          Configuration{" "}
          <select
            value={configuration()}
            onChange={(event) => setConfiguration(event.currentTarget.value)}
          >
            <For each={configurations()}>
              {(item) => <option value={item.id}>{item.name}</option>}
            </For>
          </select>
        </label>
        <label>
          Motion state{" "}
          <select
            value={motionState()}
            onChange={(event) => setMotionState(event.currentTarget.value)}
          >
            <For each={motions()}>{(state) => <option value={state}>{state}</option>}</For>
          </select>
        </label>
        <button type="button" onClick={() => setShowReport(!showReport())}>
          {showReport() ? "Hide report" : "Show validation report"}
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(manufacturingReportJson(manufacturing()))}
        >
          Copy BOM JSON
        </button>
        <button
          type="button"
          onClick={() =>
            download(
              "workbench-model.json",
              exportModelJson(regenerated().model),
              "application/json",
            )
          }
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() =>
            download("workbench-bom.csv", exportBOMCsv(regenerated().model), "text/csv")
          }
        >
          Export BOM CSV
        </button>
        <button
          type="button"
          onClick={() =>
            download("workbench-cut-list.csv", exportCutListCsv(regenerated().model), "text/csv")
          }
        >
          Export cut list
        </button>
        <button
          type="button"
          onClick={() =>
            download(
              "workbench-front.svg",
              drawingToSvg(renderDrawing(regenerated().model, defaultDrawingViews[0])),
              "image/svg+xml",
            )
          }
        >
          Export front SVG
        </button>
      </div>
      <section class="viewer-panel" aria-label="3D enclosure viewer">
        <div class="viewer-heading">
          <div>
            <h2>3D view</h2>
            <p>Drag to orbit, scroll or pinch to zoom, and right-drag to pan.</p>
          </div>
        </div>
        <canvas ref={setCanvas} class="viewer-canvas" aria-label="EnclosureV2 3D viewer" />
      </section>
      <section aria-label="Assembly hierarchy">
        <h2>Assembly hierarchy</h2>
        <ul>
          <For each={scene()?.assemblies ?? []}>
            {(assembly) => (
              <li style={{ "margin-left": assembly.parent ? "1.5rem" : "0" }}>
                <button
                  type="button"
                  aria-pressed={selectedAssembly() === assembly.id}
                  onClick={() => setSelectedAssembly(assembly.id)}
                >
                  {assembly.name}
                </button>{" "}
                <label>
                  <input
                    type="checkbox"
                    checked={!hiddenAssemblies().has(assembly.id)}
                    disabled={!scene()?.assemblyObjects.has(assembly.id)}
                    onChange={(event) =>
                      setAssemblyVisible(assembly.id, event.currentTarget.checked)
                    }
                  />{" "}
                  visible
                </label>
              </li>
            )}
          </For>
        </ul>
        {selectedAssemblyDetails() && (
          <p data-testid="assembly-inspection">
            <strong>{selectedAssemblyDetails()!.name}</strong>: source parts{" "}
            {selectedAssemblyDetails()!.parts.join(", ") || "—"}; motions{" "}
            {selectedAssemblyDetails()!
              .motions.map((motion) => motion.id)
              .join(", ") || "—"}
            ; states{" "}
            {selectedAssemblyDetails()!
              .states.map((state) => state.id)
              .join(", ") || "—"}
            .
          </p>
        )}
      </section>
      {showReport() && (
        <section aria-label="Validation report">
          <h2>Validation</h2>
          {(() => {
            const state = resolveRuntimeValidationState({
              loading: scene.loading,
              error: scene.error,
              scene: scene(),
            });
            if (state.status !== "ready") return <p>{state.message}</p>;
            const report = state.report;
            return (
              <>
                <p>Status: {report.status}</p>
                <ul>
                  <For each={report.issues}>
                    {(issue) => (
                      <li data-severity={issue.severity}>
                        <strong>{issue.severity}</strong> <span>{issue.category}</span>:{" "}
                        {issue.message}{" "}
                        {issue.references.length ? `[${issue.references.join(", ")}]` : ""}
                      </li>
                    )}
                  </For>
                </ul>
                <p>
                  {report.issues.length
                    ? "Review errors and warnings before fabrication."
                    : "No validation errors or warnings."}
                </p>
                <h3>Constraint assertions ({report.assertions.length})</h3>
                <ValidationAssertionTree tree={report.assertionTree} />
              </>
            );
          })()}
        </section>
      )}
    </main>
  );
}

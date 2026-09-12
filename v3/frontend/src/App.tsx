import { createSignal, createMemo, createEffect, onMount, For, Show, onCleanup } from "solid-js";
import Viewer from "./Viewer";
import {
  type Evaluation,
  type Parameters,
  type Pose,
  readResponse,
  evaluate,
  signature,
  canExport,
  download,
} from "./api";
const fields = [
  ["width_mm", "Internal width"],
  ["depth_mm", "Internal depth"],
  ["height_mm", "Internal height"],
  ["panel_thickness_mm", "Wood thickness"],
  ["glass_thickness_mm", "Glass thickness"],
  ["clearance_mm", "Door clearance"],
  ["cut_tolerance_mm", "Cut tolerance"],
] as const;
const doors = [
  ["front-left", "Front · left leaf"],
  ["front-right", "Front · right leaf"],
  ["left-rear", "Left wall · rear bifold"],
  ["back-right", "Rear wall · right bifold"],
];
export default function App() {
  const [parameters, setParameters] = createSignal<Parameters>({});
  const [pose, setPose] = createSignal<Pose>(Object.fromEntries(doors.map(([id]) => [id, 0])));
  const [result, setResult] = createSignal<Evaluation>();
  const [evaluated, setEvaluated] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [invalidFields, setInvalidFields] = createSignal<string[]>([]);
  const [loaded, setLoaded] = createSignal(false);
  const [tab, setTab] = createSignal("checks");
  const [filter, setFilter] = createSignal("all");
  const [checkLimit, setCheckLimit] = createSignal(20);
  const [roof, setRoof] = createSignal(true);
  const [walls, setWalls] = createSignal(true);
  const [references, setReferences] = createSignal(false);
  const [selected, setSelected] = createSignal("");
  const [exporting, setExporting] = createSignal("");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let queued = false;
  let disposed = false;
  const current = createMemo(() => signature(parameters(), pose()));
  const stale = createMemo(() => current() !== evaluated());
  const exportAllowed = createMemo(
    () => !invalidFields().length && canExport(result(), busy(), current(), evaluated()),
  );
  const status = createMemo(() =>
    invalidFields().length
      ? "Enter valid measurements"
      : stale()
        ? "Changes awaiting verification"
        : result()?.report.order_ready
          ? "Ready to order"
          : result()?.report.status === "invalid"
            ? "Design needs correction"
            : "Quotation draft · evidence needed",
  );
  async function run() {
    if (invalidFields().length) return;
    if (running) {
      queued = true;
      return;
    }
    running = true;
    setBusy(true);
    const key = current();
    const input = { ...parameters() },
      angles = { ...pose() };
    try {
      const next = await evaluate(input, angles);
      if (!disposed && key === current()) {
        if (next.model.revision !== next.report.revision)
          throw new Error(
            "The geometry and verification revisions do not match. Please evaluate again.",
          );
        setResult(next);
        setEvaluated(key);
        setError("");
      }
    } catch (e) {
      if (!disposed && key === current()) setError(e instanceof Error ? e.message : String(e));
    } finally {
      running = false;
      if (!disposed) {
        setBusy(false);
        if (queued) {
          queued = false;
          void run();
        }
      }
    }
  }
  createEffect(() => {
    current();
    const invalid = invalidFields().length;
    clearTimeout(timer);
    if (!loaded() || invalid) return;
    timer = setTimeout(() => void run(), 350);
  });
  async function load() {
    try {
      setError("");
      const defaults = await readResponse<Parameters>(await fetch("/api/defaults"));
      setParameters(defaults);
      setLoaded(true);
    } catch (e) {
      setError(
        `Unable to connect to the enclosure service. ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  onMount(() => void load());
  onCleanup(() => {
    disposed = true;
    clearTimeout(timer);
  });
  function update(id: string, value: string) {
    const n = Number(value);
    const valid = !!value.trim() && Number.isFinite(n);
    setInvalidFields((fields) =>
      valid ? fields.filter((field) => field !== id) : [...new Set([...fields, id])],
    );
    if (valid) setParameters((p) => ({ ...p, [id]: n }));
  }
  async function save(format: string) {
    if (!exportAllowed() || exporting()) return;
    setExporting(format);
    try {
      await download(format, { ...parameters() }, { ...pose() }, result()!.model.revision);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting("");
    }
  }
  const checks = createMemo(
    () =>
      result()
        ?.report.checks.filter((c) => filter() === "all" || c.status === filter())
        .sort(
          (a, b) =>
            ({ fail: 0, unknown: 1, pass: 2 })[a.status] -
            { fail: 0, unknown: 1, pass: 2 }[b.status],
        ) ?? [],
  );
  const groups = createMemo(() => [...new Set(result()?.model.parts.map((p) => p.category) ?? [])]);
  const selectedPart = createMemo(() => result()?.model.parts.find((p) => p.id === selected()));
  return (
    <>
      <header>
        <a class="brand" href="/">
          w<span>/</span> <strong>workbench</strong>
        </a>
        <div class="project-label">
          ENCLOSURE 03 <span>Shapeoko 5 Pro · 4 × 4</span>
        </div>
        <span class="location">Lisbon, PT</span>
      </header>
      <main>
        <div class="intro">
          <div>
            <div class="eyebrow">DESIGN & ASSEMBLY</div>
            <h1>A place for the work.</h1>
            <p>Configure your enclosure. Inspect the fit. Know what remains to be confirmed.</p>
          </div>
          <div
            class={`status-pill ${result()?.report.order_ready ? "pass" : result()?.report.status === "invalid" ? "fail" : "unknown"}`}
            role="status"
          >
            {busy() ? "◌ Verifying enclosure…" : status()}
          </div>
        </div>
        <Show when={invalidFields().length}>
          <div class="error" role="alert">
            Enter a valid number for{" "}
            {invalidFields()
              .map((id) => id.replaceAll("_", " "))
              .join(", ")}
            . Supplier downloads are paused.
          </div>
        </Show>
        <Show when={error()}>
          <div class="error" role="alert">
            {error()} <button onClick={() => (loaded() ? void run() : void load())}>Retry</button>
          </div>
        </Show>
        <div class="workspace">
          <aside class="settings">
            <div class="section-heading">
              <h2>Your enclosure</h2>
              <span>mm</span>
            </div>
            <p class="muted">Clear internal dimensions. All measurements in millimetres.</p>
            <For each={fields}>
              {([id, label]) => (
                <label class="field">
                  <span>{label}</span>
                  <input
                    aria-label={label}
                    type="number"
                    step={id === "cut_tolerance_mm" ? "0.1" : "1"}
                    value={Number(parameters()[id] ?? 0)}
                    disabled={!loaded()}
                    onInput={(e) => update(id, e.currentTarget.value)}
                  />
                </label>
              )}
            </For>
            <details>
              <summary>Machine, loading & allowances</summary>
              <p class="muted">
                Reference envelopes are assumptions until matched to your machine, dust shoe and
                hose.
              </p>
              <For
                each={Object.entries(parameters()).filter(
                  ([id, value]) =>
                    typeof value === "number" && !fields.some(([field]) => field === id),
                )}
              >
                {([id, value]) => (
                  <label class="field">
                    <span>{id.replace(/_mm$/, "").replaceAll("_", " ")}</span>
                    <input
                      aria-label={id.replaceAll("_", " ")}
                      type="number"
                      step="any"
                      value={Number(value)}
                      onInput={(e) => update(id, e.currentTarget.value)}
                    />
                  </label>
                )}
              </For>
            </details>
            <For
              each={Object.entries(parameters()).filter(([, value]) => typeof value === "string")}
            >
              {([id, value]) => (
                <label class="field">
                  <span>{id.replaceAll("_", " ")}</span>
                  <select
                    aria-label={id.replaceAll("_", " ")}
                    value={String(value)}
                    onChange={(e) =>
                      setParameters((p) => ({
                        ...p,
                        [id]: e.currentTarget.value,
                      }))
                    }
                  >
                    <option value="wood">Wood</option>
                    <option value="glass">Glass</option>
                  </select>
                </label>
              )}
            </For>
            <div class="section-heading doors-heading">
              <h2>Open & close</h2>
              <button
                class="text-button"
                onClick={() => setPose(Object.fromEntries(doors.map(([id]) => [id, 0])))}
              >
                Close all
              </button>
            </div>
            <For each={doors}>
              {([id, label]) => (
                <label class="door-control">
                  <span>
                    {label}
                    <b>{Math.round(pose()[id] * 100)}%</b>
                  </span>
                  <input
                    aria-label={label}
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={pose()[id]}
                    onInput={(e) =>
                      setPose((p) => ({
                        ...p,
                        [id]: Number(e.currentTarget.value),
                      }))
                    }
                  />
                </label>
              )}
            </For>
            <p class="muted">
              Preview poses update after adjustment. See the report for verified motion coverage.
            </p>
          </aside>
          <section class="preview">
            <div class="preview-heading">
              <span>ASSEMBLY PREVIEW</span>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={roof()}
                    onChange={(e) => setRoof(e.currentTarget.checked)}
                  />{" "}
                  Roof
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={walls()}
                    onChange={(e) => setWalls(e.currentTarget.checked)}
                  />{" "}
                  Walls
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={references()}
                    onChange={(e) => setReferences(e.currentTarget.checked)}
                  />{" "}
                  Clearances
                </label>
              </div>
            </div>
            <Viewer
              result={result()}
              roof={roof()}
              walls={walls()}
              references={references()}
              selected={selected()}
              onSelect={setSelected}
            />
            <Show when={stale() && result()}>
              <div class="stale-banner">
                Showing the previous evaluation. Updated results are pending.
              </div>
            </Show>
            <Show when={selectedPart()}>
              {(part) => (
                <div class="part-detail">
                  <strong>{part().name}</strong>
                  <span>
                    {part()
                      .size.map((v) => v.toFixed(1))
                      .join(" × ")}{" "}
                    mm · {part().material}
                  </span>
                  <span>{part().geometry_fidelity}</span>
                  <button onClick={() => setSelected("")}>×</button>
                </div>
              )}
            </Show>
            <div class="preview-footer">
              <span>X → right &nbsp; Y → rear &nbsp; Z → up</span>
              <span>
                {result()?.model.parts.length ?? "—"} components · revision{" "}
                {result()?.model.revision.slice(0, 10) ?? "—"}
              </span>
            </div>
          </section>
        </div>
        <section class="evidence">
          <nav aria-label="Inspection sections">
            <For
              each={[
                ["checks", "Fit & confidence"],
                ["parts", "Parts & materials"],
                ["exports", "Supplier files"],
              ]}
            >
              {([id, label]) => (
                <button class={tab() === id ? "active" : ""} onClick={() => setTab(id)}>
                  {label}
                </button>
              )}
            </For>
          </nav>
          <Show when={tab() === "checks"}>
            <div class="evidence-top">
              <div>
                <h2>Evidence, before confidence.</h2>
                <p class="muted">
                  An unresolved requirement cannot earn a pass. Review assumptions before ordering.
                </p>
              </div>
              <div class="counts">
                <For each={["all", "fail", "unknown", "pass"]}>
                  {(value) => (
                    <button
                      class={filter() === value ? "active" : ""}
                      onClick={() => {
                        setFilter(value);
                        setCheckLimit(20);
                      }}
                    >
                      {value === "all"
                        ? "All"
                        : value === "unknown"
                          ? "Unresolved"
                          : value === "fail"
                            ? "Failed"
                            : "Passed"}{" "}
                      <b>
                        {value === "all"
                          ? (result()?.report.checks.length ?? 0)
                          : (result()?.report.summary[value] ?? 0)}
                      </b>
                    </button>
                  )}
                </For>
              </div>
            </div>
            <Show
              when={result()}
              fallback={
                <p class="empty">
                  {busy()
                    ? "Building geometry and checking requirements…"
                    : "Connect to the enclosure service to evaluate your design."}
                </p>
              }
            >
              <div class="checks">
                <For each={checks().slice(0, checkLimit())}>
                  {(check) => (
                    <details class={`check ${check.status}`}>
                      <summary>
                        <span class="check-symbol">
                          {check.status === "pass" ? "✓" : check.status === "fail" ? "×" : "?"}
                        </span>
                        <span>
                          {check.message}
                          <small>
                            {check.category} · {check.id}
                          </small>
                        </span>
                        <b>{check.status === "unknown" ? "Unresolved" : check.status}</b>
                      </summary>
                      <div class="check-detail">
                        <Show when={check.method}>
                          <p>Method: {check.method}</p>
                        </Show>
                        <Show when={check.measured !== undefined}>
                          <p>
                            Measured: {JSON.stringify(check.measured)} {check.unit}
                          </p>
                        </Show>
                        <Show when={check.required !== undefined}>
                          <p>Required: {JSON.stringify(check.required)}</p>
                        </Show>
                        <p>References: {check.references?.join(", ") || "Assembly"}</p>
                      </div>
                    </details>
                  )}
                </For>
                <Show when={checks().length > checkLimit()}>
                  <button class="more-checks" onClick={() => setCheckLimit((n) => n + 50)}>
                    Show more checks ({checks().length - checkLimit()} remaining)
                  </button>
                </Show>
              </div>
              <details class="assumptions">
                <summary>Design assumptions & verification coverage</summary>
                <For each={result()?.model.assumptions ?? []}>
                  {(a) => (
                    <p>
                      <strong>{a.confirmed ? "Confirmed" : "Unconfirmed"}:</strong> {a.description}
                    </p>
                  )}
                </For>
                <pre>{JSON.stringify(result()?.report.coverage, null, 2)}</pre>
              </details>
            </Show>
          </Show>
          <Show when={tab() === "parts"}>
            <div class="evidence-top">
              <div>
                <h2>Every piece accounted for.</h2>
                <p class="muted">
                  Select a component to locate it in the preview. Reference envelopes are not
                  purchased parts.
                </p>
              </div>
            </div>
            <For each={groups()}>
              {(category) => (
                <details class="inventory" open>
                  <summary>{category.replaceAll("-", " ")}</summary>
                  <div class="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Material / reference</th>
                          <th>Envelope (mm)</th>
                          <th>Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={result()?.model.parts.filter((p) => p.category === category)}>
                          {(part) => (
                            <tr
                              class={selected() === part.id ? "selected" : ""}
                              onClick={() => setSelected(part.id)}
                            >
                              <td>
                                <button class="text-button" onClick={() => setSelected(part.id)}>
                                  {part.name}
                                </button>
                                <small>{part.id}</small>
                              </td>
                              <td>
                                {part.material}
                                <small>{part.product_code}</small>
                              </td>
                              <td>{part.size.map((v) => v.toFixed(1)).join(" × ")}</td>
                              <td>{part.supplier || "To confirm"}</td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </For>
          </Show>
          <Show when={tab() === "exports"}>
            <div class="evidence-top">
              <div>
                <h2>From design to supplier.</h2>
                <p class="muted">
                  Reiman Portugal for extrusions. Separate specifications for panels, glass and
                  hardware.
                </p>
              </div>
              <span class="status-pill unknown">
                {result()?.report.order_ready ? "Ready to order" : "REQUEST FOR QUOTATION"}
              </span>
            </div>
            <p class="export-note">
              {result()?.report.order_ready
                ? "The evaluated requirements are satisfied. Check quantities and delivery details with your suppliers."
                : "These files are quotation drafts. Unresolved specifications and failed checks travel with the design; do not use them as approved cutting instructions."}{" "}
              Glass specifications must include all machining before tempering.
            </p>
            <div class="export-grid">
              <For
                each={[
                  [
                    "pack",
                    "Complete supplier pack",
                    "All drawings, lists and verification evidence.",
                  ],
                  ["pdf", "Dimensioned drawings", "Printable supplier specifications and status."],
                  ["csv", "Order list", "Component quantities and cutting dimensions."],
                  ["dxf", "Panel outlines", "Flat geometry for supplier review."],
                  ["step", "Assembly geometry", "Solid model for technical coordination."],
                  ["json", "Design & evidence", "Parameters, component inventory and report."],
                ]}
              >
                {([format, title, description]) => (
                  <button
                    class="export-card"
                    disabled={!exportAllowed() || !!exporting()}
                    onClick={() => void save(format)}
                  >
                    <span>{format.toUpperCase()} ↗</span>
                    <strong>{exporting() === format ? "Preparing file…" : title}</strong>
                    <small>{description}</small>
                  </button>
                )}
              </For>
            </div>
            <Show when={!exportAllowed()}>
              <p class="muted">
                Evaluate the current design before downloading matching supplier files.
              </p>
            </Show>
          </Show>
        </section>
        <footer>
          WORKBENCH / ENCLOSURE 03{" "}
          <span>Fit and motion evidence · Physical installation checks remain necessary.</span>
        </footer>
      </main>
    </>
  );
}

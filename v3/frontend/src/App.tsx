import {
  createSignal,
  createMemo,
  createEffect,
  onMount,
  For,
  Show,
  onCleanup,
} from "solid-js";
import Viewer from "./Viewer";
import { playbackPhases } from "./playback";
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
  const [pose, setPose] = createSignal<Pose>(
    Object.fromEntries(doors.map(([id]) => [id, 0])),
  );
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
  let queued: boolean | undefined;
  let controller: AbortController | undefined;
  let epoch = 0;
  const [autoVerify, setAutoVerify] = createSignal(true);
  const [verifying, setVerifying] = createSignal(false);
  const [playing, setPlaying] = createSignal<"opening" | "closing" | "">("");
  let disposed = false;
  let playbackFrame = 0;
  let playbackStart = 0;
  const current = createMemo(() => signature(parameters(), {}));
  const stale = createMemo(() => current() !== evaluated());
  const report = createMemo(() =>
    !stale() && !invalidFields().length ? result()?.report : null,
  );
  const exportAllowed = createMemo(
    () =>
      !invalidFields().length &&
      canExport(result(), busy(), current(), evaluated()),
  );
  const status = createMemo(() =>
    invalidFields().length
      ? "Enter valid measurements"
      : stale()
        ? "Changes awaiting verification"
        : !report()
          ? "Preview only · verification needed"
          : report()?.order_ready
            ? "Ready to order"
            : report()?.status === "invalid"
              ? "Design needs correction"
              : "Quotation draft · evidence needed",
  );
  async function run(verify = autoVerify()) {
    if (invalidFields().length) return;
    if (running) {
      queued = verify;
      return;
    }
    running = true;
    setBusy(true);
    setVerifying(verify);
    controller = new AbortController();
    const requestEpoch = epoch;
    const key = current();
    const input = { ...parameters() },
      angles = { ...pose() };
    try {
      const next = await evaluate(input, angles, verify, controller.signal);
      if (!disposed && key === current() && requestEpoch === epoch) {
        if (
          verify &&
          (!next.report || next.model.revision !== next.report.revision)
        )
          throw new Error(
            "The geometry and verification revisions do not match. Please evaluate again.",
          );
        setResult(next);
        setEvaluated(key);
        setError("");
      }
    } catch (e) {
      if (
        !disposed &&
        key === current() &&
        requestEpoch === epoch &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      running = false;
      if (!disposed) {
        setBusy(false);
        if (queued !== undefined) {
          const nextMode = queued;
          queued = undefined;
          void run(nextMode);
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
  function toggleAuto(enabled: boolean) {
    stopPlayback();
    clearTimeout(timer);
    queued = undefined;
    epoch++;
    controller?.abort();
    setAutoVerify(enabled);
    if (enabled || busy() || stale() || !result()) void run(enabled);
  }
  function verifyNow() {
    stopPlayback();
    clearTimeout(timer);
    void run(true);
  }
  async function load() {
    try {
      setError("");
      const defaults = await readResponse<Parameters>(
        await fetch("/api/defaults"),
      );
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
    stopPlayback();
    controller?.abort();
    clearTimeout(timer);
  });
  function stopPlayback() {
    if (playbackFrame) cancelAnimationFrame(playbackFrame);
    playbackFrame = 0;
    setPlaying("");
  }
  function play(direction: "opening" | "closing") {
    if (!loaded()) return;
    stopPlayback();
    const closed = Object.fromEntries(doors.map(([id]) => [id, 0]));
    const opened = Object.fromEntries(doors.map(([id]) => [id, 1]));
    const phases = playbackPhases(
      direction,
      doors.map(([id]) => id),
    );
    setPlaying(direction);
    let phase = 0;
    setPose({ ...(direction === "opening" ? closed : opened) });
    playbackStart = performance.now();
    const tick = (now: number) => {
      if (disposed || !playing() || phase >= phases.length) {
        playbackFrame = 0;
        setPlaying("");
        return;
      }
      const current = phases[phase];
      const progress = Math.min(1, (now - playbackStart) / current.duration);
      const next = { ...current.from };
      for (const id of current.ids) {
        next[id] =
          current.from[id] + (current.to[id] - current.from[id]) * progress;
      }
      setPose(next);
      if (progress >= 1) {
        phase += 1;
        playbackStart = now;
      }
      playbackFrame = requestAnimationFrame(tick);
    };
    playbackFrame = requestAnimationFrame(tick);
  }
  function changePose(id: string, value: number) {
    stopPlayback();
    setPose((p) => ({ ...p, [id]: value }));
  }
  function update(id: string, value: string) {
    stopPlayback();
    const n = Number(value);
    const valid = !!value.trim() && Number.isFinite(n);
    setInvalidFields((fields) =>
      valid
        ? fields.filter((field) => field !== id)
        : [...new Set([...fields, id])],
    );
    if (valid) setParameters((p) => ({ ...p, [id]: n }));
  }
  async function save(format: string) {
    if (!exportAllowed() || exporting()) return;
    setExporting(format);
    try {
      await download(
        format,
        { ...parameters() },
        { ...pose() },
        result()!.model.revision,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting("");
    }
  }
  const checks = createMemo(
    () =>
      report()
        ?.checks.filter((c) => filter() === "all" || c.status === filter())
        .sort(
          (a, b) =>
            ({ fail: 0, unknown: 1, pass: 2 })[a.status] -
            { fail: 0, unknown: 1, pass: 2 }[b.status],
        ) ?? [],
  );
  const groups = createMemo(() => [
    ...new Set(result()?.model.parts.map((p) => p.category) ?? []),
  ]);
  const selectedPart = createMemo(() =>
    result()?.model.parts.find((p) => p.id === selected()),
  );
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
            <p>
              Configure your enclosure. Inspect the fit. Know what remains to be
              confirmed.
            </p>
          </div>
          <div
            class={`status-pill ${report()?.order_ready ? "pass" : report()?.status === "invalid" ? "fail" : "unknown"}`}
            role="status"
          >
            {busy()
              ? verifying()
                ? "◌ Verifying enclosure…"
                : "◌ Updating preview…"
              : status()}
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
            {error()}{" "}
            <button onClick={() => (loaded() ? void run() : void load())}>
              Retry
            </button>
          </div>
        </Show>
        <div class="workspace">
          <aside class="settings">
            <div class="verification-controls">
              <label>
                <input
                  type="checkbox"
                  checked={autoVerify()}
                  onChange={(e) => toggleAuto(e.currentTarget.checked)}
                />{" "}
                Automatic verification
              </label>
              <button
                disabled={
                  !loaded() ||
                  !!invalidFields().length ||
                  (busy() && verifying())
                }
                onClick={verifyNow}
              >
                Verify now
              </button>
              <p class="muted">
                {autoVerify()
                  ? "Changes update geometry and verification."
                  : "Geometry stays live. Verify when you are ready to review the evidence."}
              </p>
            </div>
            <div class="section-heading">
              <h2>Your enclosure</h2>
              <span>mm</span>
            </div>
            <p class="muted">
              Clear internal dimensions. All measurements in millimetres.
            </p>
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
                Reference envelopes are assumptions until matched to your
                machine, dust shoe and hose.
              </p>
              <For
                each={Object.entries(parameters()).filter(
                  ([id, value]) =>
                    typeof value === "number" &&
                    !fields.some(([field]) => field === id),
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
              each={Object.entries(parameters()).filter(
                ([, value]) => typeof value === "string",
              )}
            >
              {([id, value]) => (
                <label class="field">
                  <span>{id.replaceAll("_", " ")}</span>
                  <select
                    aria-label={id.replaceAll("_", " ")}
                    value={String(value)}
                    onChange={(e) => {
                      stopPlayback();
                      setParameters((p) => ({
                        ...p,
                        [id]: e.currentTarget.value,
                      }));
                    }}
                  >
                    <option value="wood">Wood</option>
                    <option value="glass">Glass</option>
                    <Show when={id === "bifold_material"}>
                      <option value="polycarbonate">
                        Polycarbonate · 4 mm
                      </option>
                    </Show>
                  </select>
                </label>
              )}
            </For>
            <div class="section-heading doors-heading">
              <h2>Open & close</h2>
              <div class="door-actions">
                <button
                  class="text-button"
                  onClick={() => {
                    stopPlayback();
                    setPose(Object.fromEntries(doors.map(([id]) => [id, 0])));
                  }}
                >
                  Close all
                </button>
                <button
                  class="text-button"
                  aria-label="Play opening sequence"
                  onClick={() => play("opening")}
                >
                  {playing() === "opening" ? "Opening…" : "Play opening"}
                </button>
                <button
                  class="text-button"
                  aria-label="Play closing sequence"
                  onClick={() => play("closing")}
                >
                  {playing() === "closing" ? "Closing…" : "Play closing"}
                </button>
              </div>
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
                    disabled={
                      id === "front-left"
                        ? pose()["front-right"] < 1 &&
                          pose()["front-left"] === 0
                        : id === "front-right"
                          ? pose()["front-left"] > 0
                          : false
                    }
                    aria-describedby={
                      id.startsWith("front-")
                        ? "front-door-sequence"
                        : undefined
                    }
                    onInput={(e) =>
                      changePose(id, Number(e.currentTarget.value))
                    }
                  />
                </label>
              )}
            </For>
            <p class="muted" id="front-door-sequence">
              Open the right front leaf fully before opening the left. Close the
              left completely before closing the right.
            </p>
            <p class="muted">
              Preview poses update after adjustment. See the report for verified
              motion coverage.
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
              pose={pose()}
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
                ["notes", "Design notes"],
              ]}
            >
              {([id, label]) => (
                <button
                  class={tab() === id ? "active" : ""}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              )}
            </For>
          </nav>
          <Show when={tab() === "notes"}>
            <section class="design-notes" aria-label="Design notes">
              <h2>Design notes & outstanding issues</h2>
              <p class="muted">Prototype details, proposed fixings and remaining validation work.</p>
            <p data-testid="front-inset-note">
              Front doors · inset 6 mm behind the frame front face, with no fixed centre post.
              Six vendor CFG.30/30 hinges, six 6 mm moving-wing spacers and eight door CJP3030L corner plates; four more connect the front frame.
              Open right fully, then left; close left fully, then right. 100° nominal travel.
              Slot-captured front infill uses an unselected holder for its actual thickness (maximum 6 mm);
              FSP08 is not specified for 6 mm glass. Glass setting support, gasket compounds,
              compression, fixings, sag and physical stops remain unapproved. Handles and hinge barrels project.
            </p>
            <p data-testid="bifold-prototype-note">
              Bifold prototype · A1 mini PETG guides, CFG hinges, 88° parking.
              Rear opening 750 mm by default. Metal carrier, standard CJP3030L corner plates and
              two-fixing closing tabs modeled; vendor STEP hinges, rollers
              and bushes fitted. Head sealing, bottom gaps and physical
              load/wear validation remain pending. Not released for manufacture.
            </p>
            <p data-testid="printed-park-stop-note">
              Four ribbed PETG parked stops · A1 mini prototype. Metal M6
              screws, washers and slot nuts; replaceable rubber contact pads.
              Gentle 88° travel limit only, not a slam stop or parked latch.
              Print strength, clamp creep and pad adhesion remain unvalidated.
              The quotation ZIP includes the body STL and print notes under
              printed-prototypes/BF-PARK-88.
            </p>
            <details class="bifold-completion" data-testid="bifold-completion">
              <summary>Bifold hardware · design status and fixings</summary>
              <p>Four GHD9008B handles use catalogue dimensions, not vendor STEP.
                Grip contours and recessed screw seats remain unconfirmed.
                Both bifolds omit bottom seals, backing and rigid strips, plus the complete
                closed catches, strikes, adapters and dedicated fixings. Lower openings
                are intentionally unsealed. One printed swing latch across each folding joint keeps the pair shut: lift the lever, hold it clear and fold. The viewer shows levers released whenever doors are open. A short break in the adhesive meeting wipe clears each latch. No hermetic seal is required.
                Sixteen CJP3030L corner plates use the supplier drawing; end interleaf
                hinges move 25 mm inward. Slot glazing cuts remain unchanged.</p>
              <p data-testid="parked-catch-note">Parked magnets and their holders have been removed to simplify the doors. The 88° stops limit travel but do not hold doors open. Consider a simple retaining strap only if the doors drift in use.</p>
              <ul>
                <For each={result()?.model.bifold_completion?.catch_requirements}>
                  {(r) => <li><a href={r.source} target="_blank" rel="noreferrer">{r.product_code}</a>
                    {" · "}{r.quantity} × {r.id}: {r.unresolved}</li>}
                </For>
              </ul>
              <p>Partial dead-load screening only; omitted hardware, impact,
                hinge capacity and guide reactions are not validated.</p>
              <ul>
                <For each={result()?.model.doors.filter((d) => d.load_screening)}>
                  {(d) => <li>{d.id}: included mass {d.load_screening!.included_mass_kg.toFixed(2)} kg;
                    closed frame moment {d.load_screening!.closed_frame_moment_Nm.toFixed(2)} N·m;
                    interleaf moment {d.load_screening!.closed_interleaf_moment_Nm.toFixed(2)} N·m.</li>}
                </For>
              </ul>
              <details><summary>Proposed fixing schedule — engagement pending</summary>
                <ul><For each={result()?.model.bifold_completion?.fastener_schedule}>
                  {(r) => <li>{r.part_id}: {r.quantity} × {r.screw}; {r.nut}</li>}
                </For></ul>
              </details>
            </details>
            <p data-testid="rail-retention-note">
              Rail retention: continuous 4 mm steel underside strips, 10 mm
              axle slot and bolted stock-angle end barriers with flush screws. Metal sleeves and bridge washers
              carry the bolt clamp load. Backup overtravel stops only;
              Stock-cut steel carriers and 4 mm closing tabs need drilling and finishing.
              Stock sections, fasteners, impact and tilt retention remain unvalidated.
            </p>
            <p data-testid="bifold-head-note">
              Exterior head hoods clear the moving leaves. Angled brush sections
              bridge to the leaf tops; nominal coverage is not seal approval.
              Brush deflection around the carrier, profile selection, bonded
              holder attachment and corner returns remain unvalidated.
              Meeting wipes use cut-to-length self-adhesive Tesa 05422 candidates
              on the secondary leaves: no custom clamps or seal screws. Handles
              mount directly to the frames. The free lips disengage on opening;
              actual section, adhesive fit and wear remain unconfirmed.
              {" "}<a href="https://www.leroymerlin.pt/produtos/veda-porta-adesivo-1m-branco-tesa-universal-310485.html" target="_blank" rel="noreferrer">Retail seal candidate</a>
            </p>
            <Show when={result()?.model.parts.some((p) => p.glazing)}>
              <details data-testid="bifold-glazing" open>
                <summary>Slot glazing studies · front infill and 4 mm Lexan</summary>
                <p>
                  Bifold FSP08 candidate: drawing-based section, not vendor STEP.
                  Front holders are unselected and adapted to the actual infill thickness.
                  PVC compatibility with Lexan is unconfirmed. Corner seals,
                  minimum edge engagement and frame connectors need approval.
                  Provisional cuts below — do not order yet.
                </p>
                <ul>
                  <For each={result()?.model.parts.filter((p) => p.glazing)}>
                    {(p) => (
                      <li>
                        <button onClick={() => setSelected(p.id)}>
                          {p.id.replace("-infill", "")}: {p.size[0].toFixed(2)} ×{" "}
                          {p.size[2].toFixed(2)} × {p.size[1]} mm
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
                <p>
                  40 K thermal excursion allowance; at default dimensions,
                  3 mm nominal slot engagement and 2 mm reserve per edge.
                  Frame assembled around the panel; no Lexan drilling.
                </p>
              </details>
            </Show>
            <details class="containment-note">
              <summary>Dust containment & airflow intent</summary>
              <p class="muted">
                Rubber seals bridge the assembly clearances when doors close.
                Close the left front leaf first, then the right leaf with its
                overlapping meeting strip. Open the right leaf fully first, then
                the left. Seal compression and hardware fit remain installation
                checks.
              </p>
              <p class="muted">
                A baffled makeup-air inlet supplies the dust-shoe extraction
                path. Vacuum selection and measured airflow must establish
                whether extraction is adequate. Seal fit and dust containment
                require installation checks.
              </p>
            </details>
            </section>
          </Show>
          <Show when={tab() === "checks"}>
            <div class="evidence-top">
              <div>
                <h2>Evidence, before confidence.</h2>
                <p class="muted">
                  An unresolved requirement cannot earn a pass. Review
                  assumptions before ordering.
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
                          ? (report()?.checks.length ?? 0)
                          : (report()?.summary[value] ?? 0)}
                      </b>
                    </button>
                  )}
                </For>
              </div>
            </div>
            <Show
              when={report()}
              fallback={
                <p class="empty">
                  {busy()
                    ? "Building geometry and checking requirements…"
                    : "No current verification report. Select Verify now to check this design."}
                </p>
              }
            >
              <div class="checks">
                <For each={checks().slice(0, checkLimit())}>
                  {(check) => (
                    <details class={`check ${check.status}`}>
                      <summary>
                        <span class="check-symbol">
                          {check.status === "pass"
                            ? "✓"
                            : check.status === "fail"
                              ? "×"
                              : "?"}
                        </span>
                        <span>
                          {check.message}
                          <small>
                            {check.category} · {check.id}
                          </small>
                        </span>
                        <b>
                          {check.status === "unknown"
                            ? "Unresolved"
                            : check.status}
                        </b>
                      </summary>
                      <div class="check-detail">
                        <Show when={check.method}>
                          <p>Method: {check.method}</p>
                        </Show>
                        <Show when={check.measured !== undefined}>
                          <p>
                            Measured: {JSON.stringify(check.measured)}{" "}
                            {check.unit}
                          </p>
                        </Show>
                        <Show when={check.required !== undefined}>
                          <p>Required: {JSON.stringify(check.required)}</p>
                        </Show>
                        <p>
                          References:{" "}
                          {check.references?.join(", ") || "Assembly"}
                        </p>
                      </div>
                    </details>
                  )}
                </For>
                <Show when={checks().length > checkLimit()}>
                  <button
                    class="more-checks"
                    onClick={() => setCheckLimit((n) => n + 50)}
                  >
                    Show more checks ({checks().length - checkLimit()}{" "}
                    remaining)
                  </button>
                </Show>
              </div>
              <details class="assumptions">
                <summary>Design assumptions & verification coverage</summary>
                <For each={result()?.model.assumptions ?? []}>
                  {(a) => (
                    <p>
                      <strong>
                        {a.confirmed ? "Confirmed" : "Unconfirmed"}:
                      </strong>{" "}
                      {a.description}
                    </p>
                  )}
                </For>
                <pre>{JSON.stringify(report()?.coverage, null, 2)}</pre>
              </details>
            </Show>
          </Show>
          <Show when={tab() === "parts"}>
            <div class="evidence-top">
              <div>
                <h2>Every piece accounted for.</h2>
                <p class="muted">
                  Select a component to locate it in the preview. Reference
                  envelopes are not purchased parts.
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
                        <For
                          each={result()?.model.parts.filter(
                            (p) => p.category === category,
                          )}
                        >
                          {(part) => (
                            <tr
                              class={selected() === part.id ? "selected" : ""}
                              onClick={() => setSelected(part.id)}
                            >
                              <td>
                                <button
                                  class="text-button"
                                  onClick={() => setSelected(part.id)}
                                >
                                  {part.name}
                                </button>
                                <small>{part.id}</small>
                              </td>
                              <td>
                                {part.material}
                                <small>{part.product_code}</small>
                              </td>
                              <td>
                                {part.size.map((v) => v.toFixed(1)).join(" × ")}
                              </td>
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
                  Reiman Portugal for extrusions. Separate specifications for
                  panels, glass and hardware.
                </p>
              </div>
              <span class="status-pill unknown">
                {report()?.order_ready
                  ? "Ready to order"
                  : "REQUEST FOR QUOTATION"}
              </span>
            </div>
            <p class="export-note">
              {report()?.order_ready
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
                  [
                    "pdf",
                    "Dimensioned drawings",
                    "Printable supplier specifications and status.",
                  ],
                  [
                    "csv",
                    "Order list",
                    "Component quantities and cutting dimensions.",
                  ],
                  [
                    "dxf",
                    "Panel outlines",
                    "Flat geometry for supplier review.",
                  ],
                  [
                    "step",
                    "Assembly geometry",
                    "Solid model for technical coordination.",
                  ],
                  [
                    "json",
                    "Design & evidence",
                    "Parameters, component inventory and report.",
                  ],
                ]}
              >
                {([format, title, description]) => (
                  <button
                    class="export-card"
                    disabled={!exportAllowed() || !!exporting()}
                    onClick={() => void save(format)}
                  >
                    <span>{format.toUpperCase()} ↗</span>
                    <strong>
                      {exporting() === format ? "Preparing file…" : title}
                    </strong>
                    <small>{description}</small>
                  </button>
                )}
              </For>
            </div>
            <Show when={!exportAllowed()}>
              <p class="muted">
                Evaluate the current design before downloading matching supplier
                files.
              </p>
            </Show>
          </Show>
        </section>
        <footer>
          WORKBENCH / ENCLOSURE 03{" "}
          <span>
            Fit and motion evidence · Physical installation checks remain
            necessary.
          </span>
        </footer>
      </main>
    </>
  );
}

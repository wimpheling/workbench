import { test, expect } from "@playwright/test";

test("revision C prototype is served by v3 and animates without CAD requests", async ({
  page,
}) => {
  const errors: string[] = [];
  let evaluations = 0;
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().endsWith("/api/evaluate")) evaluations++;
  });
  const evaluated = page.waitForResponse(
    (r) => r.url().endsWith("/api/evaluate"),
    { timeout: 300000 }, // Cold native verification includes articulated vendor solids.
  );
  await page.goto("/");
  const response = await evaluated;
  expect(response.ok()).toBe(true);
  // Read CAD payload outside Chromium's finite inspector-body cache.
  const preview = await page.request.post("/api/preview", {
    data: { parameters: {} },
  });
  expect(preview.ok()).toBe(true);
  const data = await preview.json();
  const bifolds = data.model.doors.filter(
    (d: { type: string }) => d.type === "bifold",
  );
  expect(bifolds.map((d: { mechanism: string }) => d.mechanism)).toEqual([
    "printed-guide-revision-c",
    "printed-guide-revision-c",
  ]);
  expect(bifolds[1].opening_width_mm).toBe(750);
  expect(bifolds[1].guide.module_length_mm).toBeCloseTo(133.84);
  expect(data.report).toBeNull();
  await expect(page.locator(".settings").getByTestId("bifold-prototype-note")).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Left wall · rear bifold" })).toBeVisible();
  await page.getByRole("button", { name: "Design notes", exact: true }).click();
  await expect(page.getByRole("region", { name: "Design notes", exact: true })).toBeVisible();
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "CJP3030L")).toHaveLength(16);
  for (const plate of data.model.parts.filter((p: { product_code?: string }) => p.product_code === "CJP3030L")) expect(plate.fastener_schedule.screw).toContain("ISO 7380 button head");
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "BF-PARK-88")).toHaveLength(4);
  for (const stop of data.model.parts.filter((p: { product_code?: string }) => p.product_code === "BF-PARK-88")) {
    expect(stop.material).toBe("PETG");
    expect(stop.print_spec.printer).toBe("Bambu A1 mini");
    expect(stop.cad_asset).toBeUndefined();
    expect(data.meshes.find((m: { id: string }) => m.id === stop.id).positions.length).toBeGreaterThan(100);
  }
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "M6-WASHER-12")).toHaveLength(8);
  await expect(page.getByTestId("printed-park-stop-note")).toContainText("not a slam stop");
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "BF-MEETING-CLAMP")).toHaveLength(0);
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "TESA-05422")).toHaveLength(2);
  const handles = data.model.parts.filter((p: { product_code?: string }) => p.product_code === "GHD9008B");
  expect(handles).toHaveLength(4);
  for (const handle of handles) {
    expect(handle.cad_asset).toBeUndefined();
    expect(handle.geometry_fidelity).toBe("drawing-based-unconfirmed-solid");
    expect(data.meshes.find((m: { id: string }) => m.id === handle.id).positions.length).toBeGreaterThan(100);
  }
  expect(data.model.bifold_completion.catch_requirements.reduce((n: number, r: { quantity: number }) => n + r.quantity, 0)).toBe(0);
  await page.getByTestId("bifold-completion").locator("summary").first().click();
  await expect(page.getByTestId("bifold-completion")).toContainText("One printed swing latch");
  await expect(page.getByTestId("parked-catch-note")).toContainText("removed to simplify");
  const closedCad = data.model.parts.filter((p: { cad_asset?: string }) => p.cad_asset === "GN_4470-50-A1-L2-SR.step");
  expect(closedCad).toHaveLength(0);
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "BF-SWING-LEVER")).toHaveLength(2);
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "BF-SWING-KEEPER")).toHaveLength(2);
  for (const did of ["left-rear", "back-right"]) {
    expect(data.model.parts.filter((p: { id: string }) => p.id.startsWith(did + "-perimeter-bottom-") || p.id.startsWith(did + "-closed-catch-"))).toHaveLength(0);
  }
  for (const part of closedCad) {
    expect(data.meshes.find((m: { id: string }) => m.id === part.id).positions.length).toBeGreaterThan(100);
    if (part.id.endsWith("strike")) expect(part.motion_leaf).toBe("a");
  }
  const parkedCad = data.model.parts.filter((p: { cad_asset?: string }) => p.cad_asset === "GN_4470-50-C2-L3-SR.step");
  expect(parkedCad).toHaveLength(0);
  expect(parkedCad.reduce((n: number, p: { quantity: number }) => n + p.quantity, 0)).toBe(0);
  expect(data.model.parts.filter((p: { geometry?: { kind: string } }) => p.geometry?.kind === "parked-catch-holder")).toHaveLength(0);
  await expect(page.getByTestId("bifold-completion")).toContainText(`${bifolds[0].load_screening.included_mass_kg.toFixed(2)} kg`);
  await page.getByTestId("bifold-completion").locator("summary").first().click();
  expect(data.model.parts.filter((p: { id: string }) => p.id.includes("keeper-strip-continuous"))).toHaveLength(4);
  expect(data.model.parts.filter((p: { id: string }) => p.id.includes("rail-end-stop"))).toHaveLength(4);
  await expect(page.getByTestId("rail-retention-note")).toContainText("bolted stock-angle end barriers");
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "STOCK-ANGLE-80x40x6-CARRIER")).toHaveLength(2);
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "DIN7991-M4x40")).toHaveLength(8);
  expect(data.model.parts.filter((p: { id: string }) => p.id.endsWith("carrier-shelf"))).toHaveLength(0);
  await expect(page.getByTestId("bifold-head-note")).toContainText("Brush deflection around the carrier");
  await expect(page.getByTestId("bifold-head-note")).toContainText("no custom clamps or seal screws");
  for (const wipe of data.model.parts.filter((p: { product_code?: string }) => p.product_code === "TESA-05422")) {
    expect(wipe.motion_leaf).toBe("b");
    expect(wipe.cad_asset).toBeUndefined();
    expect(wipe.procurement.packs_required).toBe(1);
    expect(data.meshes.find((m: { id: string }) => m.id === wipe.id).positions.length).toBeGreaterThan(0);
  }
  const inserts = data.model.parts.filter((p: { product_code?: string }) => p.product_code === "FSP08");
  expect(inserts).toHaveLength(16);
  for (const insert of inserts) {
    expect(insert.cad_asset).toBeUndefined();
    expect(insert.geometry_fidelity).toBe("drawing-based-unconfirmed-flexible-section");
    expect(data.meshes.find((m: { id: string }) => m.id === insert.id).positions.length).toBeGreaterThan(100);
  }
  await expect(page.getByTestId("bifold-glazing")).toContainText("330.75 × 628.00 × 4 mm");
  await expect(page.getByTestId("bifold-glazing")).toContainText("PVC compatibility");
  for (const [asset, count] of [["GN_753.1-22-B5-ZL-1.stp", 2], ["GN_753.2-4-5-3-AE-NI.stp", 4]] as const) {
    const parts = data.model.parts.filter((p: { cad_asset?: string }) => p.cad_asset === asset);
    expect(parts).toHaveLength(count);
    for (const part of parts) {
      expect(part.geometry_fidelity).toBe("supplier-step-solid");
      expect(part.geometry).toBeUndefined();
      expect(data.meshes.find((m: { id: string }) => m.id === part.id).positions.length).toBeGreaterThan(100);
    }
  }
  const hinges = data.model.parts.filter(
    (p: { cad_asset?: string }) => p.cad_asset === "CFG3030.stp",
  );
  expect(hinges).toHaveLength(36);
  expect(hinges.filter((p: { cad_component: string }) => p.cad_component === "pin")).toHaveLength(12);
  for (const hinge of hinges) {
    expect(data.meshes.find((m: { id: string }) => m.id === hinge.id).positions.length).toBeGreaterThan(100);
  }
  await expect(page.getByTestId("bifold-prototype-note")).toContainText(
    "A1 mini PETG",
  );
  await expect(
    page.getByRole("combobox", { name: "bifold material" }),
  ).toHaveValue("polycarbonate");
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Fit & confidence", exact: true }).click();
  await expect(page.getByRole("region", { name: "Design notes", exact: true })).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Roof", exact: true }).uncheck();
  const count = evaluations;
  for (const fraction of ["0.24", "0.5", "1", "0"]) {
    await page
      .getByRole("slider", { name: "Left wall · rear bifold" })
      .fill(fraction);
    await page
      .getByRole("slider", { name: "Rear wall · right bifold" })
      .fill(fraction);
    if (fraction === "0.5") {
      await page.screenshot({ path: "../artifacts/vendor-hinges-half-open.png", fullPage: true });
    }
  }
  expect(evaluations).toBe(count);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "../artifacts/printed-bifold-v3.png",
    fullPage: true,
  });
});

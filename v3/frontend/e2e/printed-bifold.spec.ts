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
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "BF-CORNER-65")).toHaveLength(16);
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "BF-PARK-88")).toHaveLength(4);
  expect(data.model.parts.filter((p: { product_code?: string }) => p.product_code === "BF-MEETING-CLAMP")).toHaveLength(6);
  const handles = data.model.parts.filter((p: { product_code?: string }) => p.product_code === "GHD9008B");
  expect(handles).toHaveLength(4);
  for (const handle of handles) {
    expect(handle.cad_asset).toBeUndefined();
    expect(handle.geometry_fidelity).toBe("drawing-based-unconfirmed-solid");
    expect(data.meshes.find((m: { id: string }) => m.id === handle.id).positions.length).toBeGreaterThan(100);
  }
  expect(data.model.bifold_completion.catch_requirements.reduce((n: number, r: { quantity: number }) => n + r.quantity, 0)).toBe(6);
  await page.getByTestId("bifold-completion").locator("summary").first().click();
  await expect(page.getByTestId("bifold-completion")).toContainText("not yet fitted");
  await expect(page.getByTestId("bifold-completion")).toContainText("6.45 kg");
  expect(await page.getByTestId("bifold-completion").evaluate((e) => e.getBoundingClientRect().height)).toBeLessThanOrEqual(360);
  await page.getByTestId("bifold-completion").locator("summary").first().click();
  expect(data.model.parts.filter((p: { id: string }) => p.id.includes("keeper-strip-continuous"))).toHaveLength(4);
  expect(data.model.parts.filter((p: { id: string }) => p.id.includes("rail-end-stop"))).toHaveLength(4);
  await expect(page.getByTestId("rail-retention-note")).toContainText("welded end bars");
  await expect(page.getByTestId("bifold-head-note")).toContainText("Brush deflection around the carrier");
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

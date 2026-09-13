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
  const evaluated = page.waitForResponse((r) =>
    r.url().endsWith("/api/evaluate"),
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
  }
  expect(evaluations).toBe(count);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "../artifacts/printed-bifold-v3.png",
    fullPage: true,
  });
});

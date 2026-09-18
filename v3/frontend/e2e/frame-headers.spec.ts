import { test, expect } from "@playwright/test";

test("square side headers and upright front beam appear in live preview", async ({ page }) => {
  await page.route("**/api/evaluate", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("checkbox", { name: "Automatic verification" }).uncheck();
  const preview = page.waitForResponse(r => r.url().endsWith("/api/preview"), { timeout: 120000 });
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1680");
  const response = await preview;
  expect(response.ok()).toBe(true);
  const { model } = await (await page.request.post("/api/preview", { data: { parameters: { width_mm: 1680 } } })).json();
  const by = Object.fromEntries(model.parts.map((p: {id: string}) => [p.id, p]));
  expect(by["rail-front-top"].size).toEqual([1680, 30, 60]);
  expect(by["rail-left-top"].size[0]).toBe(30);
  expect(by["rail-back-top"].size[1]).toBe(30);
  expect(model.header_layout.front_opening_height_mm).toBe(870);
  expect(by["left-rear-header-adapter-1"].size[2]).toBe(8);
  await expect(page.getByRole("status")).toContainText("Preview only", { timeout: 120000 });
  await page.getByRole("button", { name: "Design notes", exact: true }).click();
  await expect(page.getByTestId("bifold-prototype-note")).toContainText("30×30");
  await expect(page.getByTestId("front-inset-note")).toContainText("30×60");
  await page.getByRole("checkbox", { name: "Roof", exact: true }).uncheck();
  await page.getByRole("slider", { name: "Rear wall · right bifold", exact: true }).fill("1");
  await page.getByRole("slider", { name: "Left wall · rear bifold", exact: true }).fill("1");
  await page.screenshot({ path: "../artifacts/frame-headers-preview.png", fullPage: true });
});

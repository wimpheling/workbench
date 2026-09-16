import { test, expect } from "@playwright/test";

test("six-panel roof appears with its cuts and can be hidden", async ({ page }) => {
  await page.route("**/api/evaluate", route => route.abort());
  await page.goto("/");
  await page.getByRole("checkbox", { name: "Automatic verification" }).uncheck();
  const preview = page.waitForResponse(r => r.url().endsWith("/api/preview"), { timeout: 120000 });
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1680");
  expect((await preview).ok()).toBe(true);
  await expect(page.getByRole("status")).toContainText("Preview only", { timeout: 120000 });
  const { model } = await (await page.request.post("/api/preview", { data: { parameters: { width_mm: 1680 } } })).json();
  expect(model.roof_layout.panel_ids).toHaveLength(6);
  expect(model.roof_layout.centre_support_ids).toHaveLength(3);
  expect(model.roof_layout.hose_panel_id).toBe("panel-roof-left-middle");
  const panels = model.parts.filter((p: { id: string }) => model.roof_layout.panel_ids.includes(p.id));
  expect(panels.every((p: { size: number[] }) => p.size[0] === 869)).toBe(true);
  await page.getByRole("button", { name: "Design notes", exact: true }).click();
  const note = page.getByTestId("roof-layout-note");
  await note.locator("summary").click();
  await expect(note.locator("li")).toHaveCount(6);
  await expect(note).toContainText("middle-left");
  await page.getByRole("checkbox", { name: "Roof", exact: true }).check();
  await page.screenshot({ path: "../artifacts/six-panel-roof.png", fullPage: true });
  await page.getByRole("checkbox", { name: "Roof", exact: true }).uncheck();
  await expect(page.getByRole("checkbox", { name: "Roof", exact: true })).not.toBeChecked();
});

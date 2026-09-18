import { test, expect } from "@playwright/test";

test("real CAD preview is interactive before verification finishes", async ({
  page,
}) => {
  let release!: () => void;
  let waiting = false;
  await page.route("**/api/evaluate", async (route) => {
    waiting = true;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await page.goto("/");
  await expect.poll(() => waiting, { timeout: 180000 }).toBe(true);
  await expect(page.getByRole("status")).toContainText("Preview ready");
  await expect(page.locator(".preview-footer")).toContainText(/\d+ components/);
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("checkbox", { name: "Roof", exact: true }).uncheck();
  await page.getByRole("slider", { name: "Front · right leaf" }).fill("0.5");
  await expect(
    page.getByRole("slider", { name: "Front · right leaf" }),
  ).toHaveValue("0.5");
  await page.screenshot({
    path: "test-results/preview-during-verification.png",
  });
  await page
    .getByRole("button", { name: "Supplier files", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /Order list/ })).toBeDisabled();
  release();
  await expect(page.getByRole("button", { name: /Order list/ })).toBeEnabled({
    timeout: 240000,
  });
  await expect(
    page.getByRole("slider", { name: "Front · right leaf" }),
  ).toHaveValue("0.5");
});

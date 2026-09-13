import { test, expect } from "@playwright/test";
const defaults = {
  width_mm: 1674,
  depth_mm: 1649,
  height_mm: 740,
  panel_thickness_mm: 6,
  glass_thickness_mm: 6,
  clearance_mm: 4,
  cut_tolerance_mm: 0.5,
};
function response(parameters: Record<string, unknown>, verified: boolean) {
  const revision = JSON.stringify(parameters);
  return {
    model: { revision, parameters, parts: [], assumptions: [], doors: [] },
    meshes: [],
    report: verified
      ? {
          revision,
          status: "incomplete",
          checks: [
            {
              id: "test",
              status: "unknown",
              category: "test",
              message: "Current evidence",
            },
          ],
          summary: { pass: 0, fail: 0, unknown: 1 },
          coverage: {},
          order_ready: false,
        }
      : null,
  };
}
test("automatic switch preserves live preview, manual evidence, and export gating", async ({
  page,
}) => {
  const calls: string[] = [];
  await page.route("**/api/defaults", (route) => route.fulfill({ json: defaults }));
  await page.route(/\/api\/(evaluate|preview)$/, async (route) => {
    const endpoint = route.request().url().split("/").pop()!;
    calls.push(endpoint);
    await route.fulfill({
      json: response(route.request().postDataJSON().parameters, endpoint === "evaluate"),
    });
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Quotation draft");
  const left = page.getByRole("slider", { name: "Front · left leaf" });
  const right = page.getByRole("slider", { name: "Front · right leaf" });
  await expect(left).toBeDisabled();
  await expect(right).toBeEnabled();
  await right.fill("1");
  await expect(page.getByRole("status")).toContainText("Quotation draft");
  await expect(left).toBeEnabled();
  await left.fill("0.5");
  await expect(right).toBeDisabled();
  await expect(left).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("Quotation draft");
  await left.fill("0");
  await expect(right).toBeEnabled();
  await right.fill("0");
  await expect(left).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Quotation draft");
  await page.getByRole("checkbox", { name: "Automatic verification" }).uncheck();
  await expect(page.getByRole("status")).toContainText("Quotation draft");
  const verifiedCount = calls.filter((c) => c === "evaluate").length;
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1700");
  await expect(page.getByRole("status")).toContainText("Preview only");
  await page.getByRole("slider", { name: "Left wall · rear bifold" }).fill("0.5");
  await expect(page.getByRole("status")).toContainText("Preview only");
  expect(calls.filter((c) => c === "evaluate")).toHaveLength(verifiedCount);
  await page.getByRole("button", { name: "Play opening sequence" }).click();
  await page.waitForTimeout(200);
  expect(calls.filter((c) => c === "evaluate")).toHaveLength(verifiedCount);
  await page.getByRole("button", { name: "Supplier files", exact: true }).click();
  await expect(page.getByRole("button", { name: /Order list/ })).toBeDisabled();
  await page.getByRole("button", { name: "Verify now", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Quotation draft");
  await expect(page.getByRole("button", { name: /Order list/ })).toBeEnabled();
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1720");
  await expect(page.getByRole("button", { name: /Order list/ })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Preview only");
  await page.getByRole("button", { name: "Fit & confidence", exact: true }).click();
  await expect(page.getByText("Current evidence")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Automatic verification" }).check();
  await expect(page.getByRole("status")).toContainText("Quotation draft");
});
test("disabling during verification cancels queued verification and ignores late results", async ({
  page,
}) => {
  const calls: string[] = [];
  let release!: () => void;
  let blocked = false;
  await page.route("**/api/defaults", (route) => route.fulfill({ json: defaults }));
  await page.route(/\/api\/(evaluate|preview)$/, async (route) => {
    const endpoint = route.request().url().split("/").pop()!;
    calls.push(endpoint);
    const params = route.request().postDataJSON().parameters;
    if (endpoint === "evaluate" && params.width_mm === 1700) {
      blocked = true;
      await new Promise<void>((resolve) => (release = resolve));
    }
    await route.fulfill({ json: response(params, endpoint === "evaluate") }).catch(() => {});
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Quotation draft");
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1700");
  await expect.poll(() => blocked).toBe(true);
  await page.getByRole("spinbutton", { name: "Internal width", exact: true }).fill("1720");
  await page.getByRole("checkbox", { name: "Automatic verification" }).uncheck();
  release();
  await expect(page.getByRole("status")).toContainText("Preview only");
  expect(calls.filter((c) => c === "evaluate")).toHaveLength(2);
  await page.getByRole("button", { name: "Supplier files", exact: true }).click();
  await expect(page.getByRole("button", { name: /Order list/ })).toBeDisabled();
});
